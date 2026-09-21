// Adjust path to where your pkg folder is located
import init, { least_squares, FitResult } from "../../wasm-math/pkg/wasm_math.js";
import { Point } from "./types";
// Cache the initialization promise so it only runs once
let wasmInitPromise: Promise<unknown> | null = null;

export async function ensureWasmLoaded(): Promise<void> {
    if (!wasmInitPromise) {
        // Just point directly to the static public URL:
        wasmInitPromise = init("/wasm_math_bg.wasm").catch((err) => {
            wasmInitPromise = null;
            throw err;
        });
    }
    await wasmInitPromise;
}

export async function fitPoints(points: Point[]): Promise<{ m: number; b: number }> {
    await ensureWasmLoaded();

    if (points.length < 2) {
        throw new Error("At least 2 points are required to fit a line");
    }

    // 1. Flatten your Point[] into a Float64Array [x0, y0, x1, y1, ...]
    const flat = new Float64Array(points.length * 2);
    for (let i = 0; i < points.length; i++) {
        flat[i * 2] = points[i]!.x;
        flat[i * 2 + 1] = points[i]!.y;
    }

    // 2. Call the Rust WASM function!
    try {
        const result: FitResult = least_squares(flat);
        return { m: result.m, b: result.b };
    } catch (err: unknown) {
        // Rust JsError arrives here as a standard Error
        if (err instanceof Error) {
            throw new Error(`WASM Error: ${err.message}`);
        }
        throw err;
    }
}
