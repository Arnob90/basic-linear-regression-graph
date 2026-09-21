// dev.ts
import index from "./index.html";

Bun.serve({
    routes: {
        // 1. SPA fallback serves your React index.html
        "/": index,

        // 2. Explicitly serve your .wasm binary with the correct application/wasm MIME type!
        "/wasm_math_bg.wasm": new Response(
            Bun.file("./wasm-math/pkg/wasm_math_bg.wasm"),
            {
                headers: { "Content-Type": "application/wasm" },
            }
        ),
    },
    development: true,
});
