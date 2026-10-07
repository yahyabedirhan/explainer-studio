import { AbsoluteFill, random, useCurrentFrame } from "remotion";

type Props = {
  readonly opacity?: number;
  readonly blend?: "overlay" | "soft-light";
  // Higher is finer grain.
  readonly frequency?: number;
};

// Full-frame film grain from SVG turbulence, with a new seed every 2 frames.
export const Grain: React.FC<Props> = ({
  opacity = 0.12,
  blend = "soft-light",
  frequency = 0.85,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${Math.floor(frame / 2)}`) * 10000);

  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", mixBlendMode: blend, opacity }}
    >
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          {/* Turbulence sits near mid-grey; stretch it so the grain reaches black and white. */}
          <feComponentTransfer>
            <feFuncR type="linear" slope={3} intercept={-1} />
            <feFuncG type="linear" slope={3} intercept={-1} />
            <feFuncB type="linear" slope={3} intercept={-1} />
            <feFuncA type="linear" slope={0} intercept={1} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
