import { cp, mkdir, readFile, rm, access, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "build");
const basePath = (process.env.NARANJ_BASE_PATH || "").replace(/\/$/, "");
if (basePath && (!basePath.startsWith("/") || basePath.includes("..") || basePath === "/")) {
  throw new Error("NARANJ_BASE_PATH must be an absolute path prefix such as /narenj");
}
const required = [
  "index.html", "src/app.js", "src/styles.css", "src/data/skills.json",
  "src/pages/student.js", "src/pages/teacher.js", "src/pages/practice.js",
  "src/store.js", "src/ui.js", "src/tour.js", "src/data/demo.js", "src/data/questions.js", "src/data/avatars.js",
  "public/fonts", "public/avatars", "public/illustrations/naranj-brand.webp", "public/illustrations/3d-notebook.webp",
  "public/illustrations/learning-world.webp", "public/illustrations/math-exploration.webp", "public/illustrations/achievement-medals.webp",
  "public/illustrations/ATTRIBUTION.md", "public/design-system/color.css", "public/design-system/layout.css",
  "public/design-system/fonts.css",
];
for (const item of required) await access(path.join(root, item));
for (const file of ["src/app.js", "src/store.js", "src/ui.js", "src/tour.js", "src/data/demo.js", "src/data/questions.js", "src/data/avatars.js", "src/pages/student.js", "src/pages/teacher.js", "src/pages/practice.js", "server.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`JavaScript syntax check failed: ${file}\n${result.stderr}`);
}
const skillsData = JSON.parse(await readFile(path.join(root, "src/data/skills.json"), "utf8"));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const item of ["index.html", "src", "public/fonts", "public/avatars", "public/illustrations", "public/design-system", "narenj/logo/narenj.png"]) {
  const destination = item.startsWith("public/") ? item.slice("public/".length) : item;
  await cp(path.join(root, item), path.join(out, destination), { recursive: true });
}

if (basePath) {
  const transformable = [];
  async function collect(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) await collect(file);
      else if (/\.(html|js|css)$/.test(item.name)) transformable.push(file);
    }
  }
  await collect(out);
  for (const file of transformable) {
    let source = await readFile(file, "utf8");
    for (const prefix of ["illustrations", "avatars", "fonts", "design-system"]) {
      source = source.replaceAll(`/${prefix}/`, `${basePath}/${prefix}/`);
    }
    source = source.replaceAll('"/src/', `"${basePath}/src/`).replaceAll("'/src/", `'${basePath}/src/`);
    source = source.replace("<script type=\"module\" src=", `<script>window.__NARANJ_BASE_PATH__=${JSON.stringify(basePath)};</script>\n    <script type="module" src=`);
    await writeFile(file, source);
  }

  const routes = [
    "/", "/login", "/account",
    "/student/home", "/student/library", "/student/recommendations", "/student/progress", "/student/achievements",
    "/teacher/home", "/teacher/classes", "/teacher/library", "/teacher/assignments", "/teacher/assignments/new",
    "/teacher/assignments/assignment-demo-1", "/teacher/analytics",
    ...(skillsData.skills || []).map((skill) => `/student/practice/${skill.sourceRow}`),
  ];
  const entry = await readFile(path.join(out, "index.html"));
  for (const route of routes) {
    if (route === "/") continue;
    const routeDirectory = path.join(out, route.slice(1));
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(path.join(routeDirectory, "index.html"), entry);
  }
  const fallback = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>در حال بازگشت به نارنج</title><script>const base=${JSON.stringify(basePath)};const route=location.pathname.startsWith(base)?location.pathname.slice(base.length)||"/":location.pathname;location.replace(base+"/?__naranj_route="+encodeURIComponent(route+location.search+location.hash));</script></head><body>در حال بازگشت به مسیر نارنج…</body></html>`;
  await writeFile(path.join(out, "404.html"), fallback);
}
console.log(`Build complete: static demo copied to build/${basePath ? ` (base path ${basePath}, direct-route pages + fallback)` : ""}.\nValidated HTML entry, data JSON and JavaScript syntax.`);
