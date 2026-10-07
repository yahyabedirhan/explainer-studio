# Handoff: the videos-root effort

You orchestrate the effort `effort:videos-root` in `yahyabedirhan/explainer-studio`. Deliver it as one pull request from this branch. The effort ends with every existing video moved into the shared root.

## Where things are

- Worktree: `~/.treehouse/explainer-studio-404ae0/1/explainer-studio`. Branch: `effort/videos-root`, cut from `main` at the merge of #17 "Make AGENTS.md the entry point for styles and one process". Treehouse lease holder: `videos-root`.
- Spec: #22 "Spec: Keep every video outside the repository in one shared root".
- Tickets, as sub-issues of the spec, with native blocking links:
  1. #23 "Research: Prove Remotion loads videos from a root outside the repository" (no blockers)
  2. #27 "Feature: Resolve the videos root and scaffold new videos there"
  3. #24 "Feature: Write voice, sound and FFrames output to the video's root folder"
  4. #25 "Feature: Write renders and checks into the video's root folder"
  5. #28 "Chore: Name the shared videos root in every doc and skill"
  6. #26 "Chore: Move every existing video into the shared root"
  7. #29 "QA: Check the shared videos root by hand" (for the maintainer)
- The studio's rules are in `AGENTS.md`. Read it first. It became the entry point today, with the styles table, the ten steps and `docs/pipeline.md`.

## Decisions already made

These are settled with the maintainer. Do not reopen them.

- The root is `~/.local/share/explainer-studio/videos/`. One folder per video, `<root>/<slug>/`, holds both the preparation material and the outputs (stills, contact sheet, process page, final MP4). The maintainer asked for exactly this layout.
- The root resolves in this order: `STUDIO_VIDEOS_DIR`, then a config setting, then the default. This copies Swift Lab's root resolution (its ADR 0002, in `~/Developer/yahyabedirhan/swift-lab/docs/adr/`).
- Every existing video moves at the end of the effort, after the studio changes merge.
- Everything stays free and local. No paid APIs or keys.

## How the migration ticket differs

#26 "Chore: Move every existing video into the shared root" acts on the maintainer's machine, not on the branch. The 19 videos are git-ignored and exist only in the main checkout, `~/Developer/yahyabedirhan/explainer-studio/videos/` and `out/` (about 0.9 GB of sources and 3.7 GB of renders). The worktree's `videos/` and `out/` are empty.

- Ask the maintainer before merging the effort's pull request; their rule is to ask before every merge.
- Run the migration only after the merge, from the main checkout on `main`. Then do the post-merge checks the ticket lists.
- The FFrames projects (`havooch-fframes`, `fframes-spike`, `seed-tree`) had `cargo clean` run on them, so they hold no `target/`.

## Research already done (2026-10-07)

A read-only pass over Remotion 4.0.532 found the facts in the spec's "Implementation Decisions". Start the research ticket from them, and spend it on the two unproven points: an alias in `require.context`, and hot reload of a new folder outside the project. The spec also names the render-copy problem: Remotion copies the whole public folder into each bundle.

## Reaching this session

This session settles once you start. It cannot answer questions. Decide open questions yourself from the spec and `AGENTS.md`, and list each one, with what you chose, in the pull request under "Things to be aware of".

## Suggested skills

- `orchestrate-effort` and `orchestrating`, to run the tickets with sub-agents.
- `implement` and `tdd`, for the delegates building tickets.
- `remotion-best-practices`, with the overrides table in `AGENTS.md`, before any Remotion code.
- `writing-for-agents`, when a ticket edits `AGENTS.md` or a skill.
- `to-pr`, for the pull request.
- `settle-effort`, after the maintainer approves the pull request.
