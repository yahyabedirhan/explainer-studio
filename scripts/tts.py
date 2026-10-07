"""Generate Kokoro voiceover for one video, or every video.

Usage:
    npm run voice                 # every video in the videos root
    npm run voice -- <video>      # one video, e.g. smoke-test

Reads <root>/<video>/voiceover.json, writes <root>/<video>/audio/<scene-id>.wav
at 24 kHz, and writes back into each scene its measured length (durationSeconds)
and its word timings (words: [{"text", "start", "end"}], in seconds from the start
of the scene's WAV, punctuation left out).
A scene is regenerated only when its text, voice or speed changed, its WAV is missing,
or it has no word timings yet.
"""

import hashlib
import json
import re
import sys
import warnings

from videos_root import videos_root

warnings.filterwarnings("ignore")

SAMPLE_RATE = 24000
DEFAULTS = {"voice": "af_heart", "speed": 1.0, "paddingSeconds": 0.4}

_pipelines = {}


def pipeline_for(voice):
    # Kokoro voice ids start with their language code: af_heart -> "a" (American English).
    from kokoro import KPipeline

    lang = voice[0]
    if lang not in _pipelines:
        _pipelines[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    return _pipelines[lang]


def scene_hash(scene):
    key = json.dumps([scene["text"], scene["voice"], scene["speed"]])
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def word_text(token):
    # Drop punctuation but keep apostrophes inside words, so "it's" stays one word.
    return re.sub(r"[^\w']+", "", token).strip("'")


def synthesize(scene, out_path):
    """Write the scene's WAV and return its word timings."""
    import numpy as np
    import soundfile as sf

    chunks, words = [], []
    offset = 0.0  # Kokoro times each chunk from 0; the WAV is the chunks back to back.
    for result in pipeline_for(scene["voice"])(
        scene["text"], voice=scene["voice"], speed=scene["speed"]
    ):
        audio = result.audio.numpy()
        for token in result.tokens or []:
            text = word_text(token.text)
            if text and token.start_ts is not None and token.end_ts is not None:
                words.append(
                    {
                        "text": text,
                        "start": round(offset + token.start_ts, 3),
                        "end": round(offset + token.end_ts, 3),
                    }
                )
        chunks.append(audio)
        offset += len(audio) / SAMPLE_RATE
    if not chunks:
        raise RuntimeError(f"Kokoro returned no audio for scene {scene['id']!r}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out_path, np.concatenate(chunks), SAMPLE_RATE, subtype="PCM_16")
    return words


def process(video_dir):
    import soundfile as sf

    config_path = video_dir / "voiceover.json"
    config = json.loads(config_path.read_text())
    rows = []
    for scene in config["scenes"]:
        for field, value in DEFAULTS.items():
            scene.setdefault(field, value)
        # Relative to the videos root, the public folder, so staticFile(scene.audioFile) finds it.
        scene["audioFile"] = f"{video_dir.name}/audio/{scene['id']}.wav"
        wav = video_dir / "audio" / f"{scene['id']}.wav"
        digest = scene_hash(scene)
        status = "cached"
        if scene.get("hash") != digest or not wav.exists() or not scene.get("words"):
            scene["words"] = synthesize(scene, wav)
            scene["hash"] = digest
            status = "generated"
        info = sf.info(wav)
        scene["durationSeconds"] = round(info.frames / info.samplerate, 3)
        rows.append((scene["id"], scene["voice"], scene["durationSeconds"], status))
    config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n")

    total = sum(s["durationSeconds"] + s["paddingSeconds"] for s in config["scenes"])
    print(f"\n{video_dir.name}")
    print(f"  {'scene':<24}{'voice':<14}{'seconds':>8}  status")
    for scene_id, voice, seconds, status in rows:
        print(f"  {scene_id:<24}{voice:<14}{seconds:>8.2f}  {status}")
    print(f"  {'total with padding':<38}{total:>8.2f}")


def check_espeak_path():
    # espeak-ng keeps its data path in a 160-byte buffer and fails with a confusing
    # "phontab: No such file" error when the venv sits under a longer path.
    import espeakng_loader

    data_path = espeakng_loader.get_data_path()
    if len(data_path) >= 160:
        sys.exit(
            f"espeak-ng can't use data paths of 160 characters or more, and this one is {len(data_path)}:\n"
            f"  {data_path}\nMove the studio to a shorter path and run npm run setup:voice again."
        )


def main():
    check_espeak_path()
    names = sys.argv[1:]
    videos = videos_root()
    dirs = (
        [videos / n for n in names]
        if names
        else sorted(p.parent for p in videos.glob("*/voiceover.json"))
    )
    for d in dirs:
        if not (d / "voiceover.json").exists():
            sys.exit(f"No voiceover.json in {d}")
        process(d)


if __name__ == "__main__":
    main()
