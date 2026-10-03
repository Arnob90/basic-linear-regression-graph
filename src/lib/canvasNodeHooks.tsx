import { useEffect, useRef } from "react";
import type { InfiniteCanvas } from "./infiniteCanvas";
import { ScatterPlotNode } from "./point";
import { Grid } from "./grid";
import { Line } from "./line.ts"
import { PixelPoint } from "./types";
import type { CanvasNode } from "./node.ts";
/**
 * Mounts a Node instance to the engine once, handles cleanup,
 * and updates its properties whenever dependencies change.
 */
export function useNodeLayer<T extends CanvasNode>(
    engine: InfiniteCanvas | null,
    createNode: () => T,
    updateProps: (node: T) => void,
    deps: React.DependencyList
): void {
    const nodeRef = useRef<T | null>(null);

    // 1. Mount once & cleanup by reference
    useEffect(() => {
        if (!engine) return;

        const node = createNode();
        nodeRef.current = node;
        engine.children.push(node);

        return () => {
            engine.children = engine.children.filter((c) => c !== node);
            nodeRef.current = null;
        };
    }, [engine]);

    // 2. Synchronize props whenever `deps` change
    useEffect(() => {
        if (nodeRef.current) {
            updateProps(nodeRef.current);
        }
    }, [deps]);
}

export function GridLayer({ engine, size = 100 }: { engine: InfiniteCanvas | null; size?: number }) {
    useNodeLayer(
        engine,
        () => new Grid(size),
        (node) => { node.gridSize = size; },
        [size]
    );
    return null;
}
export interface ScatterPlotLayerProps {
    engine: InfiniteCanvas | null,
    points: PixelPoint[],
    color: string,
    specialColors: Map<number, string>
}
export function ScatterPlotLayer({ engine, points, color, specialColors }: ScatterPlotLayerProps) {
    useNodeLayer(
        engine,
        () => new ScatterPlotNode(points, color, specialColors),
        (node) => { node.points = points; node.color = color; node.specialColors = specialColors },
        [points]
    );
    return null;
}

export function LineLayer({ engine, m, b }: { engine: InfiniteCanvas | null; m: number; b: number }) {
    useNodeLayer(
        engine,
        () => new Line(m, b),
        (node) => {
            node.m = m;
            node.b = b;
        },
        [m, b]
    );
    return null;
}

