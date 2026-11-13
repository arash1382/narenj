import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stat, readFile } from "node:fs/promises";

const here = path.dirname(fileURLToPath(import.meta.url));
const useBuild = process.argv.includes("--dist");
const root = useBuild ? path.join(here, "build") : here;
const port = Number(process.env.PORT || 4173);
const basePath = (process.env.NARANJ_BASE_PATH || "").replace(/\/$/, "");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Allow": "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://naranj.local").pathname); }
  catch { response.writeHead(400); response.end("Bad request"); return; }
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) pathname = pathname.slice(basePath.length) || "/";
  if (pathname === "/") pathname = "/index.html";
  const assetPrefix = pathname.startsWith("/fonts/") || pathname.startsWith("/design-system/") || pathname.startsWith("/avatars/") || pathname.startsWith("/illustrations/");
  const assetRoot = useBuild ? root : path.join(here, "public");
  const resolved = assetPrefix
    ? path.resolve(assetRoot, `.${pathname}`)
    : path.resolve(root, `.${pathname}`);
  const allowedRoot = path.resolve(assetPrefix ? assetRoot : root);
  if (!resolved.startsWith(`${allowedRoot}${path.sep}`) && resolved !== path.resolve(root, "index.html")) {
    response.writeHead(403); response.end("Forbidden"); return;
  }
  let filePath = resolved;
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, "index.html");
    await stat(filePath);
  } catch {
    if (path.extname(pathname)) { response.writeHead(404); response.end("Not found"); return; }
    filePath = path.join(root, "index.html");
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Naranj demo ${useBuild ? "(build)" : "(development)"} listening on 0.0.0.0:${port}`);
});
