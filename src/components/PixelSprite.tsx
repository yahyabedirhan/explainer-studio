// Pixel art from a character grid, drawn as crisp SVG rectangles. Each row of `grid`
// is a string; each character is a key in `palette`, and "." is empty. Runs of the
// same colour in a row merge into one rectangle.
//
// `depth` stacks darker copies down and to the right, for the chunky extruded
// look of the icons in the fframes reference post.

type Props = {
  readonly grid: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
  // Size of one pixel cell, in canvas pixels.
  readonly cell: number;
  readonly depth?: number;
  readonly depthColor?: string;
  readonly style?: React.CSSProperties;
};

type Run = { x: number; y: number; w: number; key: string };

const runs = (grid: readonly string[]): Run[] => {
  const out: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let w = 1;
      while (x + w < row.length && row[x + w] === key) w++;
      if (key !== "." && key !== " ") out.push({ x, y, w, key });
      x += w;
    }
  });
  return out;
};

export const PixelSprite: React.FC<Props> = ({
  grid,
  palette,
  cell,
  depth = 0,
  depthColor = "#1a1a1a",
  style,
}) => {
  const cols = Math.max(...grid.map((r) => r.length));
  const rows = grid.length;
  const cells = runs(grid);
  const layers = Array.from({ length: depth }, (_, i) => depth - i);

  return (
    <svg
      width={(cols + depth * 0.5) * cell}
      height={(rows + depth * 0.5) * cell}
      viewBox={`0 0 ${cols + depth * 0.5} ${rows + depth * 0.5}`}
      shapeRendering="crispEdges"
      style={{ display: "block", overflow: "visible", ...style }}
    >
      {layers.map((k) => (
        <g key={k} transform={`translate(${k * 0.5} ${k * 0.5})`}>
          {cells.map((c) => (
            <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={c.w} height={1} fill={depthColor} />
          ))}
        </g>
      ))}
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x}
          y={c.y}
          width={c.w}
          height={1}
          fill={palette[c.key] ?? "magenta"}
        />
      ))}
    </svg>
  );
};
