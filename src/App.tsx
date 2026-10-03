import { useState, useRef, useEffect, useMemo } from "react";
import { InfiniteCanvas } from "./lib/infiniteCanvas";
import { Input } from "./components/ui/input";
import { fitPoints } from "./lib/regression";
import { PixelPoint, pixelToVector } from "./lib/types";
import { CircleChevronRight } from "lucide-react";
import { GridLayer, ScatterPlotLayer, LineLayer } from "./lib/canvasNodeHooks";
import { InfoBox } from "./components/infoBox";
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, useSidebar } from "./components/ui/sidebar";
import { useSignal } from "./lib/useSignal";
import { Trash } from "lucide-react";
import './index.css'
import { Button } from "./components/ui/button";

export function App() {
    const worldRef = useRef<HTMLCanvasElement | null>(null);
    const [engine, setEngine] = useState<InfiniteCanvas | null>(null);
    const [color, setColor] = useState("rgba(134, 134, 255, 1)")

    // --- 1. APPLICATION DATA STATE ---
    const [points, setPoints] = useState<PixelPoint[]>([]);
    const [line, setLine] = useState<{ m: number; b: number } | null>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const specialColors = useMemo(() => {
        if (hoveredIdx === null) {
            return new Map()
        }
        return new Map([[hoveredIdx, "rgba(255, 154, 0, 0.64)"]])
    }, [hoveredIdx])

    const gridSize = 100;
    const { open } = useSidebar()

    // --- 2. ENGINE LIFECYCLE ---
    useEffect(() => {
        if (!worldRef.current) return;

        // Clean, zero-callback instantiation:
        const instance = new InfiniteCanvas(worldRef.current);
        setEngine(instance);

        return () => instance.destroy();
    }, []);

    // --- 3. SIGNAL SUBSCRIPTION (Double-click to add points) ---
    useSignal(engine?.doubleClick, ({ world }) => {
        setPoints((prev) => [...prev, world]);
    });

    // --- 4. DERIVED DATA (Math coordinates for UI and Rust) ---
    const mathPoints = useMemo(
        () => points.map((p) => pixelToVector(p, gridSize)),
        [points, gridSize]
    );

    // Convert mathematical line to pixel space for the canvas renderer
    const pixelLine = useMemo(() => {
        if (!line) return null;
        return {
            m: -line.m,             // Invert slope because canvas Y is flipped
            b: -line.b * gridSize,  // Invert and scale intercept by grid size
        };
    }, [line, gridSize]);

    // --- 5. RUN RUST LEAST SQUARES ---
    useEffect(() => {
        if (mathPoints.length >= 2) {
            fitPoints(mathPoints)
                .then(setLine)
                .catch((err) => console.warn(err.message));
        } else {
            setLine(null);
        }
    }, [mathPoints]);

    const handleDelete = (index: number) => {
        setPoints((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 overflow-hidden select-none">
            {/* 1. Underlying Canvas */}
            <canvas ref={worldRef} className="block w-full h-full" />

            {/* 2. Declarative Canvas Layers */}
            <GridLayer engine={engine} size={gridSize} />
            <ScatterPlotLayer engine={engine} points={points} color={color} specialColors={specialColors} />
            {pixelLine && <LineLayer engine={engine} m={pixelLine.m} b={pixelLine.b} />}

            {/* 3. Floating UI Overlay */}
            <div className="pointer-events-none absolute inset-0 z-10">

                {/* InfoBox subscribes directly to the signal. App NEVER re-renders on mouse movements! */}
                {engine && <InfoBox
                    pointerMoveSignal={engine.pointerMove}
                    gridSize={gridSize}
                    slope={line?.m ?? null}
                    intercept={line?.b ?? null}
                    className="absolute bottom-4 left-4"
                />}

                {!open && <SidebarTrigger className="pointer-events-auto absolute top-4 left-4 z-20 bg-blue-600/80 text-white shadow-md backdrop-blur hover:bg-blue-600" />}

                <Sidebar className="pointer-events-auto">
                    <SidebarHeader className="border-b p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Points ({points.length})
                            </span>
                            <SidebarTrigger className="h-7 w-7" />
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-2">
                        {mathPoints.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground">
                                Double-click canvas to place points
                            </div>
                        ) : (
                            mathPoints.map((p, i) => (
                                <div
                                    key={i}
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors ${i === hoveredIdx
                                        ? "bg-accent border border-amber-500"
                                        : "hover:bg-muted/50 border border-transparent"
                                        }`}
                                >
                                    <span className="text-muted-foreground/60 w-4">#{i + 1}</span>
                                    <span className="font-medium">
                                        ({p.x.toFixed(2)}, {p.y.toFixed(2)})
                                    </span>
                                    <button
                                        onClick={() => handleDelete(i)}
                                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                                    >
                                        <Trash className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                        <div className="mt-2 flex items-center gap-1.5 p-1 border-t border-border/40">
                            <Input
                                placeholder="e.g. 2.5, 4.0"
                                className="h-8 text-xs font-mono"
                            />

                            <Button
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                title="Add point"
                            >
                                {/* Clean icon: let it inherit text color naturally */}
                                <CircleChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </SidebarContent>
                </Sidebar>

            </div>
        </div>
    );
}

export default App;
