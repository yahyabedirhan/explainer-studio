# Voice: kokoro

Kokoro speaks the narration locally, with no key. `npm run voice -- <slug>` turns each scene's line into `<root>/<slug>/audio/<id>.wav`, measures it, and writes back each scene's `durationSeconds` and `words` (`text`, `start`, `end`, in seconds from the scene WAV's start). Only scenes whose text changed are generated again.

## A scene in `voiceover.json`

```json
{ "id": "hook", "text": "One or two short sentences.", "voice": "af_heart", "speed": 1.0,
  "audioFile": "", "durationSeconds": 0, "paddingSeconds": 0.4 }
```

- `voice`: `af_heart` by default. Ids starting `af_` or `am_` are American English, `bf_` or `bm_` British. Write the voice in the brief's Voice line, for example `kokoro, af_heart`.
- `speed`: 1.0 speaks about 2.5 words a second. Raise it up to about 1.1 when the total runs long, or shorten the lines.
- `paddingSeconds`: the pause after the line, 0.3 to 0.4; about 0.6 on the last scene.
- `caption`: optional text on screen when it differs from `text`.

`npm run voice` prints each scene's length and the `total with padding`: use that total for the sound layer. A word Kokoro says wrong is fixed in `text`: [../pronunciation.md](../pronunciation.md).

The first run downloads Kokoro's model, about 330 MB. espeak-ng can't read its data from a venv path of 160 characters or more; `npm run voice` says so when that happens.
