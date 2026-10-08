# Layers

## Combining options

Any look works in any renderer and drawing. A look's "In each renderer" section says where its code is, or that it is not built yet. The other limits are in the layers table in `SKILL.md` and in each option's reference.

## Recording the choices

Write the choices into the brief's Choices lines. Mark a choice that departs from the preset with "(changed from the preset)", and write the voice as "kokoro, <voice id>".

## A look in a new renderer

When the chosen look has no code for the chosen renderer or drawing method:

1. Read the look's intent: palette, type, materials, motion and what to avoid.
2. Build the look's pieces in that renderer: in Remotion, shared code goes in `src/looks/<look>/`; in FFrames, in the video's own project.
3. Add the location to the look's "In each renderer" section, so the next video can use it.
