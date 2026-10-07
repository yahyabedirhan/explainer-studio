"""Synthesize a video's music bed, end sting and UI sound effects.

Usage:
    npm run sound -- <video> --seconds <N> [--bpm 96] [--seed 1]

Writes videos/<video>/assets/sound/ with 48 kHz stereo WAVs:
    bed.wav     N seconds of calm pad, plucked arpeggio and light pulse in D major
                (I-V-vi-IV: D, A, B minor, G), 1 s fade-in, 2 s fade-out.
    sting.wav   about 2 s resolving D major hit with a shimmer tail.
    click.wav, whoosh.wav, pop.wav, tick.wav   short UI effects.
    SOURCES.md  the exact command and seed, since nothing here is downloaded.

Everything is made from numpy maths, so there is no licence to track.
The same arguments always give the same files.
"""

import argparse
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
VIDEOS = ROOT / "videos"
SR = 48000

# D major, I-V-vi-IV. Pad voicings move by step; bass and arpeggio follow the chord.
PROGRESSION = [
    {"name": "D", "bass": 38, "pad": [57, 62, 66], "arp": [62, 66, 69, 74]},
    {"name": "A", "bass": 45, "pad": [57, 61, 64], "arp": [61, 64, 69, 73]},
    {"name": "Bm", "bass": 47, "pad": [59, 62, 66], "arp": [62, 66, 71, 74]},
    {"name": "G", "bass": 43, "pad": [59, 62, 67], "arp": [62, 67, 71, 74]},
]
ARP_PATTERN = [0, 1, 2, 3, 2, 1, 2, 3]  # indices into the chord's arp notes, one per eighth


# ---------- building blocks ----------


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def db(value):
    return 10 ** (value / 20)


def times(seconds):
    return np.arange(int(round(seconds * SR))) / SR


def saw(freq, t, phase=0.0):
    """Band-limited sawtooth (polyBLEP), so low notes don't alias into fizz."""
    dt = freq / SR
    p = (freq * t + phase) % 1.0
    out = 2 * p - 1
    lo = p < dt
    x = p[lo] / dt
    out[lo] -= 2 * x - x * x - 1
    hi = p > 1 - dt
    x = (p[hi] - 1) / dt
    out[hi] -= x * x + 2 * x + 1
    return out


def spectral_filter(x, response):
    """Zero-phase filter: multiply the spectrum by response(freqs). Works on mono or (n, 2)."""
    n = x.shape[0]
    size = 1 << int(np.ceil(np.log2(n + 1)))
    freqs = np.fft.rfftfreq(size, 1 / SR)
    spectrum = np.fft.rfft(x, size, axis=0)
    gain = response(freqs)
    if x.ndim == 2:
        gain = gain[:, None]
    return np.fft.irfft(spectrum * gain, size, axis=0)[:n]


def lowpass(x, cutoff, order=2):
    return spectral_filter(x, lambda f: 1 / np.sqrt(1 + (f / cutoff) ** (2 * order)))


def highpass(x, cutoff, order=2):
    return spectral_filter(x, lambda f: 1 / np.sqrt(1 + (cutoff / np.maximum(f, 1e-3)) ** (2 * order)))


def bandpass(x, low, high):
    return highpass(lowpass(x, high), low)


def convolve(x, ir):
    size = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


def feedback_delay(x, delay_seconds, feedback):
    """y[n] = x[n] + feedback * y[n - d], computed one delay-length block at a time."""
    d = max(1, int(round(delay_seconds * SR)))
    y = x.copy()
    for start in range(d, len(y), d):
        end = min(start + d, len(y))
        y[start:end] += feedback * y[start - d : end - d]
    return y


def reverb(x, rng, seconds=2.4, damping=3500):
    """Stereo room: decaying, darkened noise as an impulse response, different per side."""
    t = times(seconds)
    env = np.exp(-t * 6.9 / seconds) * (1 - np.exp(-t / 0.004))
    left = lowpass(rng.standard_normal(len(t)) * env, damping)
    right = lowpass(rng.standard_normal(len(t)) * env, damping)
    mono = x.mean(axis=1) if x.ndim == 2 else x
    wet = np.stack([convolve(mono, left), convolve(mono, right)], axis=1)
    return wet / np.sqrt(np.sum(left**2))


def pan(mono, position):
    """Equal-power pan, position from -1 (left) to 1 (right)."""
    angle = (position + 1) * np.pi / 4
    return np.stack([mono * np.cos(angle), mono * np.sin(angle)], axis=1)


def place(buffer, sound, start_seconds, gain=1.0):
    start = int(round(start_seconds * SR))
    if start >= len(buffer):
        return
    end = min(len(buffer), start + len(sound))
    buffer[start:end] += gain * sound[: end - start]


def fade(x, fade_in, fade_out):
    """Raised-cosine fades so nothing starts or stops with a click."""
    x = x.copy()
    shape = (-1, 1) if x.ndim == 2 else (-1,)
    n_in, n_out = (min(len(x), int(s * SR)) for s in (fade_in, fade_out))
    if n_in:
        x[:n_in] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n_in))).reshape(shape)
    if n_out:
        x[-n_out:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n_out))).reshape(shape)
    return x


def normalise(x, rms_db=None, peak_db=-1.0):
    """Scale to the RMS target, but never past the peak ceiling."""
    gain = db(peak_db) / np.max(np.abs(x))
    if rms_db is not None:
        gain = min(gain, db(rms_db) / np.sqrt(np.mean(x**2)))
    return x * gain


# ---------- instruments ----------


def pad_note(midi, seconds, rng, release=1.2, attack=0.6):
    """Three detuned saws per note, darkened, with a slow swell and long release."""
    t = times(seconds + release)
    f = hz(midi)
    voice = sum(saw(f * 2 ** (cents / 1200), t, rng.random()) for cents in (-9, 0, 8)) / 3
    env = np.minimum(1, t / attack) ** 2
    tail = t > seconds
    env[tail] *= np.cos(np.minimum(1, (t[tail] - seconds) / release) * np.pi / 2) ** 2
    return voice * env


def pluck(midi, seconds=1.4):
    """FM pluck: a bright attack that mellows as the modulation index decays."""
    t = times(seconds)
    f = hz(midi)
    index = 2.2 * np.exp(-t / 0.07) + 0.15
    tone = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.32)
    return fade(tone * env, 0, 0.05)


def bell(midi, seconds=2.0, decay=0.9):
    """FM bell (inharmonic 3.5 ratio) for sparkle on the sting."""
    t = times(seconds)
    f = hz(midi)
    index = 3.0 * np.exp(-t / 0.25)
    tone = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * 3.5 * t))
    return fade(tone * np.minimum(1, t / 0.002) * np.exp(-t / decay), 0, 0.1)


def bass_note(midi, seconds):
    t = times(seconds + 0.3)
    f = hz(midi)
    tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.02) * np.exp(-t / 1.5)
    return fade(tone * env, 0, 0.3)


def soft_kick():
    t = times(0.35)
    freq = 48 + 62 * np.exp(-t / 0.03)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return fade(np.sin(phase) * np.exp(-t / 0.11) * np.minimum(1, t / 0.002), 0, 0.05)


def shaker(rng):
    t = times(0.09)
    noise = bandpass(rng.standard_normal(len(t)), 3000, 7000)
    env = np.minimum(1, t / 0.008) * np.exp(-t / 0.025)
    return fade(noise * env, 0, 0.02)


# ---------- outputs ----------


def make_bed(seconds, bpm, rng):
    beat = 60 / bpm
    bar = 4 * beat
    out = np.zeros((int(round(seconds * SR)), 2))
    pad_bus = np.zeros_like(out)
    pluck_bus = np.zeros(len(out))
    kick, shake = soft_kick(), shaker(rng)

    for i in range(int(np.ceil(seconds / bar))):
        chord = PROGRESSION[i % len(PROGRESSION)]
        start = i * bar
        for k, note in enumerate(chord["pad"]):
            place(pad_bus, pan(pad_note(note, bar, rng), (-0.5, 0.0, 0.5)[k]), start, 0.22)
        place(out, pan(bass_note(chord["bass"], bar), 0), start, 0.30)

        # The arpeggio enters on bar 2 and the pulse on bar 3, so the bed opens gently.
        if i >= 1:
            for step, idx in enumerate(ARP_PATTERN):
                accent = 1.0 if step % 2 == 0 else 0.7
                place(pluck_bus, pluck(chord["arp"][idx]), start + step * beat / 2, 0.11 * accent)
        if i >= 2:
            for b in range(4):
                place(out, pan(kick, 0), start + b * beat, 0.28 if b % 2 == 0 else 0.18)
                place(out, pan(shake, 0.3), start + b * beat + beat / 2, 0.035)

    # Pad: low-passed for warmth, gently ducked on each beat for a light pulse.
    pad_bus = lowpass(pad_bus, 1400)
    t = np.arange(len(out)) / SR
    duck = 1 - 0.18 * np.exp(-((t % beat) / 0.12))
    pad_bus *= duck[:, None]

    # Pluck: a stereo feedback delay (dotted eighth left, quarter right), then darkened.
    plucks = np.stack(
        [feedback_delay(pluck_bus, 0.75 * beat, 0.32), feedback_delay(pluck_bus, beat, 0.28)],
        axis=1,
    )
    plucks = lowpass(plucks, 4500)

    dry = out + pad_bus + plucks
    wet = reverb(pad_bus * 0.6 + plucks, rng)
    mix = lowpass(highpass(dry + 0.35 * wet, 35), 9000)
    return normalise(fade(mix, 1.0, 2.0), rms_db=-18, peak_db=-6)


def make_sting(rng):
    seconds = 2.2
    out = np.zeros((int(seconds * SR), 2))
    t = times(seconds)

    # Body: D major add9 in saws, bright on the hit, then dark as it decays.
    body = np.zeros(len(t))
    for note in (50, 57, 62, 66, 69, 76):
        voice = sum(saw(hz(note) * 2 ** (c / 1200), t, rng.random()) for c in (-7, 0, 7)) / 3
        body += voice
    bright = lowpass(body, 5000) * np.exp(-t / 0.18)
    warm = lowpass(body, 1200) * np.exp(-t / 0.7)
    attack = np.minimum(1, t / 0.004)
    body = (0.6 * bright + warm) * attack * 0.12
    out += pan(body, 0)

    # Sub thump on the root, and bells on top.
    sub = np.sin(2 * np.pi * hz(38) * t) * np.exp(-t / 0.35) * attack
    out += pan(sub, 0) * 0.35
    for k, note in enumerate((74, 78, 81, 86)):
        place(out, pan(bell(note, seconds), (-0.6, 0.6, -0.3, 0.3)[k]), 0.012 * k, 0.07)

    # Shimmer: high octaves with a slow tremolo, swelling in under the decay.
    shimmer = np.zeros((len(t), 2))
    for k, note in enumerate((86, 93, 98)):
        trem = 1 + 0.4 * np.sin(2 * np.pi * (5 + k) * t + k)
        env = (1 - np.exp(-t / 0.15)) * np.exp(-t / 0.8)
        shimmer += pan(np.sin(2 * np.pi * hz(note) * t) * trem * env, (-0.7, 0.7, 0)[k])
    out += 0.04 * shimmer

    out = out + 0.5 * reverb(out, rng, seconds=2.0, damping=6000)
    out = lowpass(highpass(out, 30), 12000)
    return normalise(fade(out, 0.0, 0.4), peak_db=-3)


def make_click(rng):
    t = times(0.04)
    body = np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.004)
    low = np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.009)
    snap = bandpass(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.0015)
    x = (0.6 * body + 0.5 * low + 0.25 * snap) * np.minimum(1, t / 0.0004)
    return normalise(fade(pan(x, 0), 0, 0.01), peak_db=-6)


def make_tick(rng):
    t = times(0.025)
    body = np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.0025)
    wood = np.sin(2 * np.pi * 1100 * t) * np.exp(-t / 0.004)
    snap = bandpass(rng.standard_normal(len(t)), 3000, 8000) * np.exp(-t / 0.001)
    x = (0.5 * body + 0.5 * wood + 0.2 * snap) * np.minimum(1, t / 0.0003)
    return normalise(fade(pan(x, 0), 0, 0.006), peak_db=-10)


def make_whoosh(rng):
    """Noise through a band that sweeps up and back down, panning left to right."""
    seconds, n_fft, hop = 0.6, 1024, 256
    n = int(seconds * SR)
    noise = rng.standard_normal(n + n_fft)
    window = np.hanning(n_fft)
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    out = np.zeros(n + n_fft)
    for start in range(0, n, hop):
        u = start / n
        center = 350 * (2500 / 350) ** np.sin(np.pi * min(1, u / 0.85) * 0.75)
        width = 0.55  # in octaves
        band = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1) / center) / width) ** 2)
        frame = np.fft.irfft(np.fft.rfft(noise[start : start + n_fft] * window) * band, n_fft)
        out[start : start + n_fft] += frame * window
    x = out[:n]
    u = np.arange(n) / n
    env = np.where(u < 0.55, (u / 0.55) ** 2, np.cos(np.clip(u - 0.55, 0, 0.45) / 0.45 * np.pi / 2) ** 1.5)
    x *= env
    position = np.clip(-0.7 + 1.4 * u, -1, 1)
    angle = (position + 1) * np.pi / 4
    stereo = np.stack([x * np.cos(angle), x * np.sin(angle)], axis=1)
    return normalise(fade(stereo, 0.01, 0.02), peak_db=-8)


def make_pop():
    """A soft bubble: a sine chirping upward under a quick decay."""
    t = times(0.15)
    freq = 380 + 900 * (1 - np.exp(-t / 0.018))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.minimum(1, t / 0.0015) * np.exp(-t / 0.03)
    x = np.sin(phase) * env + 0.3 * np.sin(2 * phase) * env * np.exp(-t / 0.01)
    return normalise(fade(pan(lowpass(x, 5000), 0), 0, 0.03), peak_db=-6)


def write_sources(folder, command, seed):
    files = ["bed.wav", "sting.wav", "click.wav", "whoosh.wav", "pop.wav", "tick.wav"]
    lines = [
        "# Sound sources",
        "",
        "Every file in this folder was synthesized locally by `scripts/sound.py` from numpy maths.",
        "Nothing was downloaded or sampled, so no licence applies.",
        "",
        f"Command: `{command}`",
        "",
        f"Seed: {seed}. The same command always gives the same files.",
        "",
    ] + [f"- `{name}`" for name in files]
    (folder / "SOURCES.md").write_text("\n".join(lines) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video")
    parser.add_argument("--seconds", type=float, required=True, help="length of bed.wav")
    parser.add_argument("--bpm", type=float, default=96)
    parser.add_argument("--seed", type=int, default=1)
    args = parser.parse_args()

    video = VIDEOS / args.video
    if not video.is_dir():
        raise SystemExit(f"No video folder: {video}")
    folder = video / "assets" / "sound"
    folder.mkdir(parents=True, exist_ok=True)

    # One generator per file, so changing one sound never shifts another.
    def rng(k):
        return np.random.default_rng([args.seed, k])

    outputs = {
        "bed.wav": make_bed(args.seconds, args.bpm, rng(0)),
        "sting.wav": make_sting(rng(1)),
        "click.wav": make_click(rng(2)),
        "whoosh.wav": make_whoosh(rng(3)),
        "pop.wav": make_pop(),
        "tick.wav": make_tick(rng(4)),
    }
    for name, audio in outputs.items():
        sf.write(folder / name, audio.astype(np.float32), SR, subtype="PCM_16")
        peak = 20 * np.log10(np.max(np.abs(audio)))
        print(f"{name}: {len(audio) / SR:.2f} s, peak {peak:.1f} dBFS")

    seconds = f"{args.seconds:g}"
    bpm = f"{args.bpm:g}"
    command = f"npm run sound -- {args.video} --seconds {seconds} --bpm {bpm} --seed {args.seed}"
    write_sources(folder, command, args.seed)
    print(f"Wrote {folder.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
