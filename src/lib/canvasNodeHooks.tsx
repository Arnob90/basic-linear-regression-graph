import { useEffect, useMemo } from "react";
import type { Node } from "./node";
import type { InfiniteCanvas } from "./infiniteCanvas";
import { ScatterPlotNode } from "./point";
import { Grid } from "./grid";
import { Line } from "./line.ts"
import { PixelPoint } from "./types";

export function useCanvasNode(engine: InfiniteCanvas | null, node: Node) {
    useEffect(() => {
        if (!engine) return;

        // Mount node to scene tree
        engine.children.push(node);

        // Cleanup: remove node on unmount
        return () => {
            engine.children = engine.children.filter((c) => c !== node);
        };
    }, [engine, node]);
}
export function GridLayer({ engine, size = 100 }: { engine: InfiniteCanvas | null; size?: number }) {
    // Automatically creates, mounts, and unmounts the node!
    useCanvasNode(engine, useMemo(() => new Grid(size), [size]));
    return null;
}
export function ScatterPlotLayer({ engine, points }: { engine: InfiniteCanvas | null; points: PixelPoint[] }) {
    useCanvasNode(engine, useMemo(() => new ScatterPlotNode(points), [points]));
    return null;
}

export function LineLayer({ engine, m, b }: { engine: InfiniteCanvas | null, m: number, b: number }) {
    useCanvasNode(engine, useMemo(() => new Line(m, b), [m, b]))
    return null
}
