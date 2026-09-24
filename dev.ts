import { serve } from "bun";
import { watch } from "fs";
import { join } from "path";

const PORT = 3000;
const DIST_DIR = "./dist";
const SRC_DIR = "./src";

// 1. Build function
async function buildProject() {
    const result = await Bun.build({
        entrypoints: [`${SRC_DIR}/index.html`],
        outdir: DIST_DIR,
        minify: false,
    });

    if (!result.success) {
        console.error("❌ Build failed:");
        for (const msg of result.logs) console.error(msg);
    } else {
        console.log(`✨ Recompiled into ${DIST_DIR} at ${new Date().toLocaleTimeString()}`);
    }
}

// Run initial build
await buildProject();

// 2. Watch src/ folder and rebuild on change
let reloadClients: Set<ServerWebSocket> = new Set();

watch(SRC_DIR, { recursive: true }, async () => {
    await buildProject();
    // Notify all connected browser clients to refresh
    for (const client of reloadClients) {
        client.send("reload");
    }
});

// 3. Serve dist/ with an injected Live-Reload client script
const server = serve({
    port: PORT,
    async fetch(req, server) {
        const url = new URL(req.url);

        // Handle live-reload websocket handshake
        if (url.pathname === "/__live_reload") {
            const upgraded = server.upgrade(req);
            if (upgraded) return;
        }

        let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
        let file = Bun.file(join(DIST_DIR, filePath));

        if (!(await file.exists())) {
            file = Bun.file(join(DIST_DIR, "index.html")); // SPA fallback
        }

        if (await file.exists()) {
            let content = await file.text();

            // If it's an HTML file, inject the auto-reload script automatically
            if (file.type.includes("html") || url.pathname.endsWith(".html") || url.pathname === "/") {
                const injection = `
                    <script>
                        const ws = new WebSocket("ws://" + location.host + "/__live_reload");
                        ws.onmessage = (event) => {
                            if (event.data === "reload") location.reload();
                        };
                    </script>
                `;
                content = content.replace("</body>", injection + "</body>");
            }

            return new Response(content, {
                headers: { "Content-Type": file.type || "text/html" }
            });
        }

        return new Response("Not Found", { status: 404 });
    },
    websocket: {
        open(ws) { reloadClients.add(ws); },
        close(ws) { reloadClients.delete(ws); },
        message() {},
    }
});

console.log(`\n🚀 Asylum Tracker running at http://localhost:${PORT}`);
console.log(`💡 Open this link in VS Code's Simple Browser panel!\n`);