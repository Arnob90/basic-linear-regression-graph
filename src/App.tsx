import React, { useState, useRef, useEffect, useMemo } from "react";
import { InfiniteCanvas } from "./lib/infiniteCanvas";
import { fitPoints } from "./lib/regression";
import { PixelPoint, pixelToVector, Vector } from "./lib/types";
import { GridLayer, ScatterPlotLayer, LineLayer } from "./lib/canvasNodeHooks.tsx"
import { InfoBox } from "./components/infoBox";
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger } from "./components/ui/sidebar";
import { Trash } from "lucide-react";

export function App() {
    const worldRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<InfiniteCanvas | null>(null);

    // --- 1. PURE REACT STATE ---
    const [points, setPoints] = useState<PixelPoint[]>([]);
    const [line, setLine] = useState<{ m: number; b: number } | null>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [mouseCoords, setMouseCoords] = useState<Vector>(new Vector(0, 0));

    const gridSize = 100;

    // --- 2. DERIVED DATA ---
    const mathPoints = useMemo(
        () => points.map((p) => pixelToVector(p, gridSize)),
        [points, gridSize]
    );

    // --- 3. RECOMPUTE REGRESSION WHEN POINTS CHANGE ---
    useEffect(() => {
        if (mathPoints.length >= 2) {
            fitPoints(mathPoints)
                .then(setLine)
                .catch((err) => console.warn(err.message));
        } else {
            setLine(null);
        }
    }, [mathPoints]);

    // --- 4. CANVAS LIFECYCLE & EVENT WIRING ---
    useEffect(() => {
        if (!worldRef.current) return;

        const engine = new InfiniteCanvas(worldRef.current, {
            // Direct callbacks! No Zustand middleman:
            onDoubleClick: (worldPt) => {
                setPoints((prev) => [...prev, worldPt]);
            },
            onPointerMove: (worldPt) => {
                const mathPt = pixelToVector(worldPt, gridSize);
                setMouseCoords(mathPt);
            },
        });

        engineRef.current = engine;
        return () => engine.destroy();
    }, [gridSize]);

    // --- 5. SYNC SCENE TREE NODES WHEN STATE CHANGES ---
    useEffect(() => {
        if (!engineRef.current) return;

        // Repopulate the canvas children directly from props/state:
        engineRef.current.children = [
            new GridNode(gridSize),
            new ScatterPlotNode(points, hoveredIdx),
            ...(line ? [new RegressionLineNode(line.m, line.b)] : []),
        ];
    }, [points, line, hoveredIdx, gridSize]);

    // --- 6. ACTIONS ---
    const handleDelete = (index: number) => {
        setPoints((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 overflow-hidden select-none">
            <canvas ref={worldRef} className="block w-full h-full" />

            {/* Floating Overlays */}
            <div className="pointer-events-none absolute inset-0 z-10">
                <InfoBox
                    coords={mouseCoords}
                    slope={line?.m ?? null}
                    intercept={line?.b ?? null}
                    className="absolute bottom-4 left-4"
                />

                <SidebarTrigger className="pointer-events-auto absolute top-4 left-4 z-20 bg-blue-600 text-white shadow" />

                <Sidebar className="pointer-events-auto">
                    <SidebarHeader className="border-b p-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Points ({points.length})
                        </span>
                    </SidebarHeader>

                    <SidebarContent className="p-2">
                        {mathPoints.map((p, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors ${i === hoveredIdx ? "bg-accent border border-amber-500" : "hover:bg-muted/50"
                                    }`}
                            >
                                <span>#{i + 1}</span>
                                <span>({p.x.toFixed(2)}, {p.y.toFixed(2)})</span>
                                <button
                                    onClick={() => handleDelete(i)}
                                    className="p-1 hover:text-red-500"
                                >
                                    <Trash className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </SidebarContent>
                </Sidebar>
            </div>
        </div>
    );
}
