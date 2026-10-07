// Effects from the `shaders` package (https://github.com/shader-effects-inc/shaders, MIT,
// Copyright (c) 2026 Shader Effects Inc.), drawn one Remotion frame at a time. See docs/shaders.md.
//
// The package's own <Shader> runs a requestAnimationFrame loop on the wall clock, which flickers
// in a render. This component drives the package's core WebGPU renderer instead: it never starts
// the loop, and for each frame it draws exactly one picture at `time` seconds (default: the
// scene's frame / fps). Node registration follows `createShader` in the package's
// `packages/js/src/createShader.ts`.
//
// Use only effects whose picture is a function of time and props. Simulations (fluids, boids,
// particles with state, trails, cursor effects) step from the previous frame and are not.
// Keep `speed` props constant within a scene: a layer's clock adds time x speed as it goes.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createGpuUniformsMap,
  resolveBoundingBox,
  rootPassthrough,
  shaderRendererGPU,
  type GpuShaderDefinition,
} from "shaders/core";
import { cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";

// One layer: an effect definition, imported as
// `import { componentDefinition as Aurora } from "shaders/core/Aurora"`, its props, and for a
// filter the layers it changes. Prop names are the package's (shaders.com/docs/components).
// `opacity`, `blendMode`, `visible`, `transform`, `maskSource` and `maskType` work on any layer.
export type ShaderLayer = {
  readonly effect: GpuShaderDefinition;
  readonly id?: string;
  readonly props?: Record<string, unknown>;
  readonly children?: ShaderLayer[];
};

type Props = {
  readonly layers: ShaderLayer[];
  // Shader clock in seconds. Default: the scene's frame / fps.
  readonly time?: number;
  readonly width?: number;
  readonly height?: number;
  readonly style?: React.CSSProperties;
};

type Renderer = ReturnType<typeof shaderRendererGPU>;
type Identified = Omit<ShaderLayer, "id" | "children"> & { id: string; children?: Identified[] };
type Metadata = Parameters<Renderer["registerNode"]>[3];
type MetadataPatch = Parameters<Renderer["updateNodeMetadata"]>[1];
type LiveNode = { def: GpuShaderDefinition; props: Record<string, unknown> };

const METADATA = new Set(["opacity", "blendMode", "visible"]);
const ROOT_ID = "remotion-shader-root";

// Ids follow each layer's place in the tree, so they stay the same from frame to frame.
const identify = (layers: ShaderLayer[], prefix = "layer"): Identified[] =>
  layers.map((layer, i) => {
    const id = layer.id ?? `${prefix}-${i}-${layer.effect.name}`;
    return { ...layer, id, children: layer.children && identify(layer.children, id) };
  });

const structureOf = (layers: Identified[]): string =>
  layers.map((l) => `${l.id}:${l.effect.name}(${structureOf(l.children ?? [])})`).join(",");

const transformOf = (value: unknown) =>
  value
    ? { offsetX: 0, offsetY: 0, rotation: 0, scale: 1, anchorX: 0.5, anchorY: 0.5, edges: "transparent", ...(value as object) }
    : undefined;

const maskOf = (props: Record<string, unknown>) =>
  props.maskSource ? { source: props.maskSource, type: props.maskType ?? "alpha" } : undefined;

const register = (r: Renderer, nodes: Map<string, LiveNode>, layer: Identified, parentId: string, order: number) => {
  const def = layer.effect;
  const props = layer.props ?? {};
  const complete = Object.fromEntries(
    Object.entries(def.props).map(([key, config]) => [key, props[key] ?? (config as { default: unknown }).default]),
  );
  const metadata = {
    blendMode: props.blendMode ?? "normal",
    opacity: props.opacity,
    visible: props.visible,
    renderOrder: order,
    id: layer.id,
    mask: maskOf(props),
    transform: transformOf(props.transform),
    boundingBox: resolveBoundingBox(props.boundingBox as never),
  } as Metadata;
  r.registerNode(layer.id, def.fragment, parentId, metadata, createGpuUniformsMap(def, complete, layer.id), def);
  nodes.set(layer.id, { def, props: { ...props } });
  layer.children?.forEach((child, i) => register(r, nodes, child, layer.id, i));
};

// Push changed props into the live nodes; the next draw picks them up.
const update = (r: Renderer, nodes: Map<string, LiveNode>, layers: Identified[]) => {
  for (const layer of layers) {
    const node = nodes.get(layer.id);
    const props = layer.props ?? {};
    if (node) {
      for (const [key, value] of Object.entries(props)) {
        if (JSON.stringify(node.props[key]) === JSON.stringify(value)) continue;
        node.props[key] = value;
        if (key === "transform") r.updateNodeMetadata(layer.id, { transform: transformOf(value) } as MetadataPatch);
        else if (key === "boundingBox") r.updateNodeMetadata(layer.id, { boundingBox: resolveBoundingBox(value as never) });
        else if (key === "maskSource" || key === "maskType") r.updateNodeMetadata(layer.id, { mask: maskOf(props) } as MetadataPatch);
        else if (METADATA.has(key)) r.updateNodeMetadata(layer.id, { [key]: value } as MetadataPatch);
        else if (Object.prototype.hasOwnProperty.call(node.def.props, key)) r.updateUniformValue(layer.id, key, value);
      }
    }
    update(r, nodes, layer.children ?? []);
  }
};

// The renderer keeps two clocks, and both must land on `seconds` for every frame, in any order:
// - a global clock, performance.now() minus a time origin. With the origin at 0 and
//   performance.now() held at `seconds` for the synchronous part of the draw, it reads `seconds`.
// - a per-layer clock for effects with a `speed` prop, which adds deltaTime x speed on every
//   draw. Passing deltaTime = seconds - (the time it last reached) puts it at seconds x speed.
//   It restarts at 0 when layers are registered again, so `clock` is reset with them.
const drawAt = async (r: Renderer, seconds: number, clock: { current: number }) => {
  r.setTimeOrigin(0);
  const realNow = performance.now;
  performance.now = () => seconds * 1000;
  let drawn: Promise<void>;
  try {
    drawn = r.renderSyntheticFrame(seconds - clock.current);
    clock.current = seconds;
  } finally {
    performance.now = realNow;
  }
  await drawn;
};

// The renderer draws by itself on the next animation frame after a prop change, on the wall clock.
// It schedules at most one such draw, so holding the first one forever turns them all off.
const withoutSelfScheduledDraws = (register: () => void) => {
  const realRaf = window.requestAnimationFrame;
  window.requestAnimationFrame = () => -1;
  try {
    register();
  } finally {
    window.requestAnimationFrame = realRaf;
  }
};

export const Shader: React.FC<Props> = ({ layers, time, width, height, style }) => {
  const frame = useCurrentFrame();
  const { fps, width: compWidth, height: compHeight } = useVideoConfig();
  const w = width ?? compWidth;
  const h = height ?? compHeight;
  const seconds = time ?? frame / fps;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const nodesRef = useRef(new Map<string, LiveNode>());
  const builtRef = useRef<string | null>(null);
  const clockRef = useRef(0);
  const identified = useMemo(() => identify(layers), [layers]);

  // Start the renderer once: no resize or visibility observers, no animation loop.
  const [initHandle] = useState(() => delayRender("Starting the WebGPU shader renderer"));
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = shaderRendererGPU();
    let cancelled = false;
    r.setOnUnavailable((reason: string) => {
      cancelRender(new Error(`<Shader>: the WebGPU renderer stopped (${reason}). See docs/shaders.md.`));
    });
    r.initialize({ canvas, observeElement: false })
      .then(() => {
        if (cancelled) return;
        r.stopAnimation();
        r.resize(w, h);
        withoutSelfScheduledDraws(() =>
          r.registerNode(ROOT_ID, rootPassthrough.fragment, null, null, {}, rootPassthrough),
        );
        setRenderer(r);
        continueRender(initHandle);
      })
      .catch((err: unknown) => cancelRender(err));
    return () => {
      cancelled = true;
      try {
        r.cleanup();
      } catch {
        // Already released.
      }
    };
    // The canvas size is fixed for a composition, so the renderer starts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every frame: bring the layers up to date, then draw at `seconds` before Remotion takes the frame.
  useEffect(() => {
    if (!renderer) return;
    const handle = delayRender(`Drawing the shader at ${seconds.toFixed(3)} s`);
    const structure = structureOf(identified);
    const rebuilt = builtRef.current !== structure;
    if (rebuilt) {
      for (const id of [...nodesRef.current.keys()].reverse()) renderer.removeNode(id);
      nodesRef.current.clear();
      identified.forEach((layer, i) => register(renderer, nodesRef.current, layer, ROOT_ID, i));
      builtRef.current = structure;
      clockRef.current = 0;
    } else {
      update(renderer, nodesRef.current, identified);
    }
    // After new layers, the renderer keeps showing the old ones until the new ones have drawn
    // once. Draw twice so the frame shows the new layers.
    drawAt(renderer, seconds, clockRef)
      .then(() => (rebuilt ? drawAt(renderer, seconds, clockRef) : undefined))
      .then(() => continueRender(handle))
      .catch((err: unknown) => cancelRender(err));
  }, [renderer, identified, seconds]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{ position: "absolute", left: 0, top: 0, width: w, height: h, ...style }}
    />
  );
};
