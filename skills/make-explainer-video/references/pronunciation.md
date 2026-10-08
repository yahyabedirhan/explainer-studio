# Pronunciation

Write narration for the ear: short sentences, no symbols or unexplained abbreviations, numbers written as spoken.

Kokoro reads the `text` field of a scene in `voiceover.json` literally. When a word comes out wrong, change how it is spelled in `text`, run `npm run voice -- <video>`, and listen again. Only the edited scene is regenerated.

- **Spell hard words phonetically.** `Kubernetes` becomes `koo-ber-NET-eez`, `Herdr` becomes `herder`, `nginx` becomes `engine X`. Capitals mark the stressed syllable.
- **Space or dot acronyms you want spelled out.** `CLI` becomes `C L I` or `C.L.I.`, `VPS` becomes `V P S`. Leave acronyms that are said as words alone, such as `NASA`.
- **Write numbers, symbols and units as speech.** `v2.1` becomes `version two point one`, `50%` becomes `fifty percent`, `3x` becomes `three times`, `/` becomes `slash`.
- **Use punctuation for pacing.** A comma adds a short pause, a full stop a longer one. For a longer pause between scenes, raise that scene's `paddingSeconds` instead.
- **Try another voice** if a voice keeps stumbling on a word. Voice ids start with their language: `af_` and `am_` are American, `bf_` and `bm_` British.

Text on screen keeps the real spelling. Only the narration is respelled.
