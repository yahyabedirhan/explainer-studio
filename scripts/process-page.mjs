// Build one static page that shows how a video was made, stage by stage.
//
//   npm run process -- <slug>
//
// Reads out/<slug>/process/, where each stage is a numbered folder such as
// 01-refs or 06-review-1. A stage holds NOTES.md (its first "# " line is the title)
// and any images, videos and text files it produced. Writes
// out/<slug>/process/process.html with relative links, to open locally in a browser.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const [slug] = process.argv.slice(2);
if (!slug) {
  console.error("Usage: npm run process -- <slug>");
  process.exit(1);
}
const root = join("out", slug, "process");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

// Enough Markdown for notes: headings, paragraphs, lists, fenced code and tables.
const markdown = (text) => {
  const html = [];
  let list = null;
  let code = null;
  let para = [];
  let table = false;
  const flush = () => {
    if (table) html.push("</table>");
    table = false;
    if (para.length) html.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
    if (list) html.push(`</${list}>`);
    list = null;
  };
  for (const line of text.split("\n")) {
    if (table && !line.startsWith("|")) flush();
    if (code !== null) {
      if (line.startsWith("```")) {
        html.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
        code = null;
      } else code.push(line);
      continue;
    }
    if (line.startsWith("```")) {
      flush();
      code = [];
    } else if (/^#{2,4} /.test(line)) {
      flush();
      html.push(`<h3>${inline(line.replace(/^#+ /, ""))}</h3>`);
    } else if (/^\s*([-*]|\d+\.) /.test(line)) {
      if (para.length) flush();
      const kind = /^\s*\d+\./.test(line) ? "ol" : "ul";
      if (list !== kind) {
        if (list) html.push(`</${list}>`);
        html.push(`<${kind}>`);
        list = kind;
      }
      html.push(`<li>${inline(line.replace(/^\s*([-*]|\d+\.) /, ""))}</li>`);
    } else if (line.trim() === "") flush();
    else if (line.startsWith("|")) {
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      const tag = table ? "td" : "th";
      if (!table) {
        flush();
        html.push("<table>");
        table = true;
      }
      html.push(
        `<tr>${cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`,
      );
    } else para.push(line.trim());
  }
  flush();
  return html.join("\n");
};

const stages = readdirSync(root)
  .filter((d) => /^\d+-/.test(d) && statSync(join(root, d)).isDirectory())
  .sort();

const sections = stages.map((dir) => {
  const files = readdirSync(join(root, dir)).sort();
  const notesFile = files.includes("NOTES.md")
    ? readFileSync(join(root, dir, "NOTES.md"), "utf8")
    : "";
  const title = notesFile.match(/^# (.+)$/m)?.[1] ?? dir;
  const notes = markdown(notesFile.replace(/^# .+$/m, ""));
  const media = files
    .filter((f) => f !== "NOTES.md")
    .map((f) => {
      const src = `${dir}/${encodeURIComponent(f)}`;
      const ext = extname(f).toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext))
        return `<figure><a href="${src}"><img src="${src}" alt="${esc(f)}"></a><figcaption>${esc(f)}</figcaption></figure>`;
      if ([".mp4", ".webm"].includes(ext))
        return `<figure class="wide"><video src="${src}" controls preload="metadata"></video><figcaption>${esc(f)}</figcaption></figure>`;
      if ([".wav", ".mp3", ".m4a"].includes(ext))
        return `<figure><audio src="${src}" controls></audio><figcaption>${esc(f)}</figcaption></figure>`;
      if ([".md", ".json", ".txt", ".ts", ".tsx"].includes(ext))
        return `<details><summary>${esc(f)}</summary><pre><code>${esc(readFileSync(join(root, dir, f), "utf8"))}</code></pre></details>`;
      return `<p><a href="${src}">${esc(f)}</a></p>`;
    })
    .join("\n");
  const id = dir.replace(/^\d+-/, "");
  return {
    id,
    num: dir.match(/^\d+/)[0],
    title,
    html: `${notes}\n<div class="media">${media}</div>`,
  };
});

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Making ${esc(slug)}</title>
<style>
:root { --bg:#EFE6D2; --ink:#2B2622; --muted:#6B6158; --card:#FBF6EA; --line:#D8CCB4; --accent:#D9533F; --gold:#E2B23C; }
@media (prefers-color-scheme: dark) { :root { --bg:#141A3E; --ink:#EEF0FF; --muted:#AEB6E8; --card:#1C2350; --line:#2E3770; --accent:#F07A8C; --gold:#E2B23C; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.55 Inter, system-ui, sans-serif; }
main { max-width:1100px; margin:0 auto; padding:48px 16px 96px; }
h1 { font-size:40px; margin:0 0 4px; letter-spacing:-0.01em; }
h1 + p { color:var(--muted); margin:0 0 32px; }
nav { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:40px; }
nav a { color:var(--ink); text-decoration:none; border:1px solid var(--line); border-radius:999px; padding:4px 12px; font-size:14px; background:var(--card); }
section { border-top:2px solid var(--line); padding-top:24px; margin-top:40px; }
h2 { font-size:26px; margin:0 0 12px; display:flex; gap:12px; align-items:baseline; }
h2 .num { color:var(--accent); font:600 18px ui-monospace, monospace; }
h2 + * { margin-top:0; }
h3 { font-size:17px; margin:20px 0 6px; }
p, li { max-width:72ch; }
code { font:14px ui-monospace, monospace; background:var(--card); padding:1px 4px; border-radius:4px; }
pre { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:12px; overflow:auto; font-size:13px; }
table { border-collapse:collapse; margin:12px 0; font-size:14px; }
th, td { border:1px solid var(--line); padding:6px 10px; text-align:left; vertical-align:top; }
th { background:var(--card); }
.media { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; margin-top:16px; }
figure { margin:0; background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px; }
figure.wide { grid-column:1 / -1; }
img, video { width:100%; height:auto; display:block; border-radius:4px; }
audio { width:100%; }
figcaption { font-size:13px; color:var(--muted); margin-top:6px; }
details { grid-column:1 / -1; }
summary { cursor:pointer; color:var(--muted); }
a { color:var(--accent); }
</style>
</head>
<body>
<main>
<h1>Making ${esc(slug)}</h1>
<p>Every stage of the video, in the order it was made. Click an image to open it full size.</p>
<nav>${sections.map((s) => `<a href="#${s.id}">${s.num} ${esc(s.title)}</a>`).join("")}</nav>
${sections.map((s) => `<section id="${s.id}"><h2><span class="num">${s.num}</span>${esc(s.title)}</h2>\n${s.html}</section>`).join("\n")}
</main>
</body>
</html>
`;
writeFileSync(join(root, "process.html"), page);
console.log(`${join(root, "process.html")}: ${sections.length} stages`);
