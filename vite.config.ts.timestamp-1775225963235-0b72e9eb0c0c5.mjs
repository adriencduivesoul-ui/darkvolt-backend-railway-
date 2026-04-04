// vite.config.ts
import { jsxLocPlugin } from "file:///C:/Users/admin/Documents/DarckVolt/node_modules/@builder.io/vite-plugin-jsx-loc/dist/index.js";
import tailwindcss from "file:///C:/Users/admin/Documents/DarckVolt/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///C:/Users/admin/Documents/DarckVolt/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "file:///C:/Users/admin/Documents/DarckVolt/node_modules/vite/dist/node/index.js";
import { vitePluginManusRuntime } from "file:///C:/Users/admin/Documents/DarckVolt/node_modules/vite-plugin-manus-runtime/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\admin\\Documents\\DarckVolt";
var PROJECT_ROOT = __vite_injected_original_dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "client", "src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "shared"),
      "@assets": path.resolve(__vite_injected_original_dirname, "attached_assets")
    }
  },
  envDir: path.resolve(__vite_injected_original_dirname),
  root: path.resolve(__vite_injected_original_dirname, "client"),
  build: {
    outDir: "../dist/public",
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    },
    emptyOutDir: true
  },
  server: {
    port: 3e3,
    strictPort: false,
    host: true,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/socket.io": { target: "http://localhost:3001", ws: true, changeOrigin: true }
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  define: {
    // Forcer l'URL Railway en production
    __VITE_API_URL__: JSON.stringify(
      process.env.NODE_ENV === "production" ? "https://darkvolt-backend-production.up.railway.app" : "http://localhost:3001"
    )
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhZG1pblxcXFxEb2N1bWVudHNcXFxcRGFyY2tWb2x0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhZG1pblxcXFxEb2N1bWVudHNcXFxcRGFyY2tWb2x0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hZG1pbi9Eb2N1bWVudHMvRGFyY2tWb2x0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsganN4TG9jUGx1Z2luIH0gZnJvbSBcIkBidWlsZGVyLmlvL3ZpdGUtcGx1Z2luLWpzeC1sb2NcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCBmcyBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFBsdWdpbiwgdHlwZSBWaXRlRGV2U2VydmVyIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB7IHZpdGVQbHVnaW5NYW51c1J1bnRpbWUgfSBmcm9tIFwidml0ZS1wbHVnaW4tbWFudXMtcnVudGltZVwiO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gTWFudXMgRGVidWcgQ29sbGVjdG9yIC0gVml0ZSBQbHVnaW5cbi8vIFdyaXRlcyBicm93c2VyIGxvZ3MgZGlyZWN0bHkgdG8gZmlsZXMsIHRyaW1tZWQgd2hlbiBleGNlZWRpbmcgc2l6ZSBsaW1pdFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuY29uc3QgUFJPSkVDVF9ST09UID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbmNvbnN0IExPR19ESVIgPSBwYXRoLmpvaW4oUFJPSkVDVF9ST09ULCBcIi5tYW51cy1sb2dzXCIpO1xuY29uc3QgTUFYX0xPR19TSVpFX0JZVEVTID0gMSAqIDEwMjQgKiAxMDI0OyAvLyAxTUIgcGVyIGxvZyBmaWxlXG5jb25zdCBUUklNX1RBUkdFVF9CWVRFUyA9IE1hdGguZmxvb3IoTUFYX0xPR19TSVpFX0JZVEVTICogMC42KTsgLy8gVHJpbSB0byA2MCUgdG8gYXZvaWQgY29uc3RhbnQgcmUtdHJpbW1pbmdcblxudHlwZSBMb2dTb3VyY2UgPSBcImJyb3dzZXJDb25zb2xlXCIgfCBcIm5ldHdvcmtSZXF1ZXN0c1wiIHwgXCJzZXNzaW9uUmVwbGF5XCI7XG5cbmZ1bmN0aW9uIGVuc3VyZUxvZ0RpcigpIHtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKExPR19ESVIpKSB7XG4gICAgZnMubWtkaXJTeW5jKExPR19ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyaW1Mb2dGaWxlKGxvZ1BhdGg6IHN0cmluZywgbWF4U2l6ZTogbnVtYmVyKSB7XG4gIHRyeSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGxvZ1BhdGgpIHx8IGZzLnN0YXRTeW5jKGxvZ1BhdGgpLnNpemUgPD0gbWF4U2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVzID0gZnMucmVhZEZpbGVTeW5jKGxvZ1BhdGgsIFwidXRmLThcIikuc3BsaXQoXCJcXG5cIik7XG4gICAgY29uc3Qga2VwdExpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBrZXB0Qnl0ZXMgPSAwO1xuXG4gICAgLy8gS2VlcCBuZXdlc3QgbGluZXMgKGZyb20gZW5kKSB0aGF0IGZpdCB3aXRoaW4gNjAlIG9mIG1heFNpemVcbiAgICBjb25zdCB0YXJnZXRTaXplID0gVFJJTV9UQVJHRVRfQllURVM7XG4gICAgZm9yIChsZXQgaSA9IGxpbmVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBsaW5lQnl0ZXMgPSBCdWZmZXIuYnl0ZUxlbmd0aChgJHtsaW5lc1tpXX1cXG5gLCBcInV0Zi04XCIpO1xuICAgICAgaWYgKGtlcHRCeXRlcyArIGxpbmVCeXRlcyA+IHRhcmdldFNpemUpIGJyZWFrO1xuICAgICAga2VwdExpbmVzLnVuc2hpZnQobGluZXNbaV0pO1xuICAgICAga2VwdEJ5dGVzICs9IGxpbmVCeXRlcztcbiAgICB9XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKGxvZ1BhdGgsIGtlcHRMaW5lcy5qb2luKFwiXFxuXCIpLCBcInV0Zi04XCIpO1xuICB9IGNhdGNoIHtcbiAgICAvKiBpZ25vcmUgdHJpbSBlcnJvcnMgKi9cbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZVRvTG9nRmlsZShzb3VyY2U6IExvZ1NvdXJjZSwgZW50cmllczogdW5rbm93bltdKSB7XG4gIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGVuc3VyZUxvZ0RpcigpO1xuICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKExPR19ESVIsIGAke3NvdXJjZX0ubG9nYCk7XG5cbiAgLy8gRm9ybWF0IGVudHJpZXMgd2l0aCB0aW1lc3RhbXBzXG4gIGNvbnN0IGxpbmVzID0gZW50cmllcy5tYXAoKGVudHJ5KSA9PiB7XG4gICAgY29uc3QgdHMgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgcmV0dXJuIGBbJHt0c31dICR7SlNPTi5zdHJpbmdpZnkoZW50cnkpfWA7XG4gIH0pO1xuXG4gIC8vIEFwcGVuZCB0byBsb2cgZmlsZVxuICBmcy5hcHBlbmRGaWxlU3luYyhsb2dQYXRoLCBgJHtsaW5lcy5qb2luKFwiXFxuXCIpfVxcbmAsIFwidXRmLThcIik7XG5cbiAgLy8gVHJpbSBpZiBleGNlZWRzIG1heCBzaXplXG4gIHRyaW1Mb2dGaWxlKGxvZ1BhdGgsIE1BWF9MT0dfU0laRV9CWVRFUyk7XG59XG5cbi8qKlxuICogVml0ZSBwbHVnaW4gdG8gY29sbGVjdCBicm93c2VyIGRlYnVnIGxvZ3NcbiAqIC0gUE9TVCAvX19tYW51c19fL2xvZ3M6IEJyb3dzZXIgc2VuZHMgbG9ncywgd3JpdHRlbiBkaXJlY3RseSB0byBmaWxlc1xuICogLSBGaWxlczogYnJvd3NlckNvbnNvbGUubG9nLCBuZXR3b3JrUmVxdWVzdHMubG9nLCBzZXNzaW9uUmVwbGF5LmxvZ1xuICogLSBBdXRvLXRyaW1tZWQgd2hlbiBleGNlZWRpbmcgMU1CIChrZWVwcyBuZXdlc3QgZW50cmllcylcbiAqL1xuZnVuY3Rpb24gdml0ZVBsdWdpbk1hbnVzRGVidWdDb2xsZWN0b3IoKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcIm1hbnVzLWRlYnVnLWNvbGxlY3RvclwiLFxuXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBodG1sLFxuICAgICAgICB0YWdzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGFnOiBcInNjcmlwdFwiLFxuICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgc3JjOiBcIi9fX21hbnVzX18vZGVidWctY29sbGVjdG9yLmpzXCIsXG4gICAgICAgICAgICAgIGRlZmVyOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluamVjdFRvOiBcImhlYWRcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xuICAgICAgLy8gUE9TVCAvX19tYW51c19fL2xvZ3M6IEJyb3dzZXIgc2VuZHMgbG9ncyAod3JpdHRlbiBkaXJlY3RseSB0byBmaWxlcylcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoXCIvX19tYW51c19fL2xvZ3NcIiwgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIikge1xuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVQYXlsb2FkID0gKHBheWxvYWQ6IGFueSkgPT4ge1xuICAgICAgICAgIC8vIFdyaXRlIGxvZ3MgZGlyZWN0bHkgdG8gZmlsZXNcbiAgICAgICAgICBpZiAocGF5bG9hZC5jb25zb2xlTG9ncz8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd3JpdGVUb0xvZ0ZpbGUoXCJicm93c2VyQ29uc29sZVwiLCBwYXlsb2FkLmNvbnNvbGVMb2dzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBheWxvYWQubmV0d29ya1JlcXVlc3RzPy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3cml0ZVRvTG9nRmlsZShcIm5ldHdvcmtSZXF1ZXN0c1wiLCBwYXlsb2FkLm5ldHdvcmtSZXF1ZXN0cyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwYXlsb2FkLnNlc3Npb25FdmVudHM/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHdyaXRlVG9Mb2dGaWxlKFwic2Vzc2lvblJlcGxheVwiLCBwYXlsb2FkLnNlc3Npb25FdmVudHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlIH0pKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXFCb2R5ID0gKHJlcSBhcyB7IGJvZHk/OiB1bmtub3duIH0pLmJvZHk7XG4gICAgICAgIGlmIChyZXFCb2R5ICYmIHR5cGVvZiByZXFCb2R5ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGhhbmRsZVBheWxvYWQocmVxQm9keSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBTdHJpbmcoZSkgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYm9keSA9IFwiXCI7XG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XG4gICAgICAgICAgYm9keSArPSBjaHVuay50b1N0cmluZygpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXEub24oXCJlbmRcIiwgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgIGhhbmRsZVBheWxvYWQocGF5bG9hZCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBTdHJpbmcoZSkgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5jb25zdCBwbHVnaW5zID0gW3JlYWN0KCksIHRhaWx3aW5kY3NzKCksIGpzeExvY1BsdWdpbigpLCB2aXRlUGx1Z2luTWFudXNSdW50aW1lKCksIHZpdGVQbHVnaW5NYW51c0RlYnVnQ29sbGVjdG9yKCldO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJjbGllbnRcIiwgXCJzcmNcIiksXG4gICAgICBcIkBzaGFyZWRcIjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwic2hhcmVkXCIpLFxuICAgICAgXCJAYXNzZXRzXCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcImF0dGFjaGVkX2Fzc2V0c1wiKSxcbiAgICB9LFxuICB9LFxuICBlbnZEaXI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lKSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiY2xpZW50XCIpLFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4uL2Rpc3QvcHVibGljJyxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLVtoYXNoXS0ke0RhdGUubm93KCl9LmpzYCxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLVtoYXNoXS0ke0RhdGUubm93KCl9LmpzYCxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLVtoYXNoXS0ke0RhdGUubm93KCl9LltleHRdYFxuICAgICAgfVxuICAgIH0sXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7IHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgJy9zb2NrZXQuaW8nOiB7IHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsIHdzOiB0cnVlLCBjaGFuZ2VPcmlnaW46IHRydWUgfSxcbiAgICB9LFxuICAgIGFsbG93ZWRIb3N0czogW1xuICAgICAgXCIubWFudXNwcmUuY29tcHV0ZXJcIixcbiAgICAgIFwiLm1hbnVzLmNvbXB1dGVyXCIsXG4gICAgICBcIi5tYW51cy1hc2lhLmNvbXB1dGVyXCIsXG4gICAgICBcIi5tYW51c2NvbXB1dGVyLmFpXCIsXG4gICAgICBcIi5tYW51c3ZtLmNvbXB1dGVyXCIsXG4gICAgICBcImxvY2FsaG9zdFwiLFxuICAgICAgXCIxMjcuMC4wLjFcIixcbiAgICBdLFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgICBkZW55OiBbXCIqKi8uKlwiXSxcbiAgICB9LFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAvLyBGb3JjZXIgbCdVUkwgUmFpbHdheSBlbiBwcm9kdWN0aW9uXG4gICAgX19WSVRFX0FQSV9VUkxfXzogSlNPTi5zdHJpbmdpZnkoXG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/ICdodHRwczovL2Rhcmt2b2x0LWJhY2tlbmQtcHJvZHVjdGlvbi51cC5yYWlsd2F5LmFwcCdcbiAgICAgICAgOiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJ1xuICAgICksXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1MsU0FBUyxvQkFBb0I7QUFDL1QsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sUUFBUTtBQUNmLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9C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
