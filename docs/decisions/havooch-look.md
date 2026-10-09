# Decisions: the havooch preset and the paper-havooch look

A preset for videos about Havooch ([yahyabedirhan/havooch](https://github.com/yahyabedirhan/havooch)), settled with the maintainer on 2026-10-09.

## 2026-10-09: a separate copy of paper-blueprint, recoloured

- **What was asked.** The sketchbook look, with its blue palette swapped for Havooch's and its tomato robot swapped for the logo's cat, saved so later Havooch videos can start from it.
- **Tried first: three new looks.** A risograph zine, a night screening room and an editor's light table, each with the cat. The maintainer chose to keep paper-blueprint's look and change only its colours and cast.
- **Cast: drawn from the logo, not copied.** The first cat used the old logo mark; the README's logo is Havuç (`assets/images/logo/v2-havuc/`). A pasted logo didn't fit the pen-drawn world, so Havuç is redrawn by hand from the logo's marks (ears with peach insides, three forehead stripes, big eyes with catchlights, pink nose, "w" mouth, white muzzle), with a sitting body added. `src/looks/paper-havooch/havuc.ts` lists those marks.
- **Palette.** Paper stays `#EFE6D2`; stripes go peach `#F4C9AE` and butter `#FFE9A8`; ink is the logo's `#2E1D14`; red becomes carrot `#F37A1F`; the navy blueprint becomes a cocoa print, `#4A2C1C` to `#1F130C` with cream `#F6DCC8` lines, carrot for data and nose pink `#EE8E92` for highlights. A burnt-orange "tabby print" and the app icon's slate were the other dark grounds shown; slate still read as blue.
- **A copy, not a palette parameter.** Making paper-blueprint take a palette would have touched every function in it. The maintainer asked to keep paper-blueprint as it is, so `src/looks/paper-havooch/` is a copy with its colours changed, `blueprint.ts` renamed to `cocoa.ts` (`cocoaBg`, theme `"cocoa"`), `mascot.ts` replaced by `havuc.ts`, and `props.ts`, `hud.ts`, `paper.ts` and `storyboard.ts` kept. A fix to a shared shape now has to be made in both looks.
- **No optional steps in the preset.** paper-blueprint's reference study already covers the look's motion.
- **First video.** `havooch-intro`, about 37 seconds: what Havooch is and its pause, point and send loop, written for the Havooch README and landing page.

## Seen while building

- **The root's `tsconfig.json` names one checkout.** It points `@studio/*` at the checkout that wrote it, so `npx tsc -p "$(npm run --silent root)"` from a worktree with a new look fails with "Cannot find module '@studio/looks/<look>'". Renders and stills from the worktree work, because the bundler resolves `@studio` from the running checkout. The check passed with a scratch copy of the root tsconfig whose `@studio/*` pointed at the worktree.
- **Kokoro reads capitals one by one.** "ha-VOOCH" came out as letters; the plain spelling "Havooch" gives "huh-VOOCH" (misaki's G2P: `həvˈuʧ`). The preset says so.
