# Drawing: dom

Needs `remotion`. A scene is React and CSS elements, with SVG for diagrams: real UI mocks and captures, typography, diagrams and a cursor that drags. Browser text layout measures and wraps text for you. Mix it with `canvas` scene by scene when a video needs both.

## Shared components

Import them as `@studio/components/<Name>`. Read a component's source when a prop matters.

| Component | Draws |
|---|---|
| `Captions` | word-timed captions from a scene's `caption ?? text`: [../captions.md](../captions.md) |
| `Cursor` | a macOS-style pointer on an eased path; `cursorAt(keys, frame)` gives its position and press state, for drags |
| `Travel` | moves its child along a cubic Bézier path between two frames; `pointOnPath` gives a point on it |
| `Typewriter` | types text out between two frames, with an optional caret |
| `KineticTitle` | a full-frame kinetic headline: a kicker line over big words that build in |
| `PixelSprite` | pixel art from a character grid as crisp SVG, with an optional extruded depth |
| `Grain` | film grain: [../effects/grain.md](../effects/grain.md) |
| `Shader`, `ShaderLayer` | shader effects: [../effects/shaders.md](../effects/shaders.md) |

## Rules

- **Measure text.** Use `@remotion/layout-utils` to fit text to its box; never a fixed width for text that changes.
- **Real UI.** Capture real screens with Playwright, or redraw the real layout flat. Never invent a product's interface.
- **Springs for UI.** Move UI on springs with high damping and no bounce, and a cursor on eased paths.
- **CSS.** Inline styles or Tailwind classes; Tailwind v4 is set up for video code in the videos root.
