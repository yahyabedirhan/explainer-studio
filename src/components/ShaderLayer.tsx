import { useLayoutEffect, useRef, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A GLSL fragment shader drawn on a WebGL canvas, once per frame, in the spirit of
// fframes' `Shader` layer. The shader gets Shadertoy-style uniforms:
//   uniform vec2  iResolution;  canvas size in pixels
//   uniform float iTime;        seconds since the layer's Sequence started
//   uniform float iFrame;       frame since the layer's Sequence started
// plus every entry of `uniforms` as a float, vec2, vec3 or vec4 by array length.
// Write `void main()` and set `gl_FragColor` (GLSL ES 1.0, premultiplied alpha).

type Uniform = number | readonly number[];

type Props = {
  readonly fragment: string;
  readonly width: number;
  readonly height: number;
  readonly uniforms?: Record<string, Uniform>;
  readonly style?: React.CSSProperties;
};

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const HEADER = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float iFrame;
`;

type GlState = { gl: WebGLRenderingContext; program: WebGLProgram };

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create a WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader did not compile: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
};

const setup = (canvas: HTMLCanvasElement, fragment: string): GlState => {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL is not available. Render with --gl=angle.");
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create a WebGL program");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, HEADER + fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Shader did not link: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  return { gl, program };
};

const setUniform = (state: GlState, name: string, value: Uniform) => {
  const { gl, program } = state;
  const location = gl.getUniformLocation(program, name);
  if (!location) return;
  const v = typeof value === "number" ? [value] : value;
  if (v.length === 1) gl.uniform1f(location, v[0]);
  else if (v.length === 2) gl.uniform2f(location, v[0], v[1]);
  else if (v.length === 3) gl.uniform3f(location, v[0], v[1], v[2]);
  else gl.uniform4f(location, v[0], v[1], v[2], v[3]);
};

export const ShaderLayer: React.FC<Props> = ({
  fragment,
  width,
  height,
  uniforms = {},
  style,
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<GlState | null>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("Compiling shader"));

  useLayoutEffect(() => {
    if (!canvas.current) return;
    try {
      state.current = setup(canvas.current, fragment);
    } catch (error) {
      cancelRender(error);
    }
    continueRender(handle);
  }, [fragment, handle]);

  // Drawn in a layout effect, so the frame is on the canvas before Remotion captures it.
  useLayoutEffect(() => {
    const s = state.current;
    if (!s) return;
    const { gl } = s;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setUniform(s, "iResolution", [width, height]);
    setUniform(s, "iTime", frame / fps);
    setUniform(s, "iFrame", frame);
    for (const [name, value] of Object.entries(uniforms)) setUniform(s, name, value);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });

  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, top: 0, width, height, ...style }}
    />
  );
};
