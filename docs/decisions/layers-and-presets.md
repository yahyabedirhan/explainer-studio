# Decisions: layers and presets

How a video's choices are structured, and who reads what. Settled with the maintainer on 2026-10-08, in spec #35.

## 2026-10-08: layers replace styles

- **The four "styles" were four prototypes.** Studio, Sketchbook, FFrames and Shaders each changed a different part of the pipeline: Studio the drawing method and look, Sketchbook the drawing method, look, captions and the process itself, FFrames the whole renderer, Shaders only the effects. Calling them styles made each one fork the process: Studio's recipe sat in `AGENTS.md`, and the others were skills that replaced its steps 4 to 10.
- **Layers, each with options.** One shared process, and a layer wherever a video can differ: renderer, drawing, look, effects, captions, voice, sound and optional steps. A video picks one option per layer, or several where the layer allows. The layers and options are listed once, in `skills/make-explainer-video/SKILL.md`.
- **Presets are saved choices.** A preset picks an option per layer and the settings it needs, such as fps, and adds no behaviour. `studio` and `sketchbook` are presets; FFrames and shaders are options without a preset. A video can start from a preset, change any layer, or use no preset at all.
- **A look is separate from the renderer.** Each look has an intent, written for any renderer, and an "In each renderer" section with its code or "not built yet". A look built in a second renderer follows the intent; nobody expects the same frames from two renderers. Which look works best with which renderer is left to experiment.
- **Voice and sound are layers** although voice has one option, so a second engine plugs in without a process change. Sound already has two: `synth` and `none`.
- **A brief records its choices** as one line per layer. No table, no checks, and no system for recording or comparing experiments: the agent running an experiment presents it.
- **Full migration.** The rename reached the code (`src/styles/sketchbook/` became `src/looks/paper-blueprint/`), the template and the docs, with nothing kept for the old model.

## 2026-10-08: one skill for the consumer, docs for the maintainer

- **Two readers.** The consumer is an agent that makes a video; the maintainer is an agent that changes the studio. They read different files, as in the skills repo, where `skills/` is installed and `docs/decisions/` is not.
- **One consumer skill.** `make-explainer-video`, in this repository, is the only entry point for making a video. `SKILL.md` holds the process and the lists; `references/` holds one file per option; `presets/` holds the presets. A style recipe is needed only when that style is chosen, so options are references of one skill, not separate installed skills whose descriptions would load in every session.
- **Official skills for the tools.** Remotion's skills and FFrames' `fframes-video` are used as they are, pinned in `skills-lock.json`. The studio's corrections sit in one table in `SKILL.md`.
- **`AGENTS.md` is the maintainer's.** Its first line sends a video maker to the skill. History and reasons go here, in `docs/decisions/`.
- **Named for what it makes.** `make-explainer` became `make-explainer-video`.
