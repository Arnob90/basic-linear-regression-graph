import "./index.css";
import { useEffect, useRef, useState } from "react";
import { InfiniteCanvas } from "./lib/infiniteCanvas.ts";
import { fitPoints } from "./lib/regression.ts";
import { useCameraStore } from "./lib/cameraStore.ts";
import { Label } from "./components/ui/label.tsx";
export function useLinearRegression() {
    const points = useCameraStore((s) => s.points);
    const line = useCameraStore((s) => s.lines); // Or keep it in store
    const [localLine, setLocalLine] = useState<{ m: number; b: number } | null>(null);

    useEffect(() => {
        if (points.length >= 2) {
            fitPoints(points)
                .then((res) => setLocalLine(res))
                .catch((err) => console.warn(err.message));
        } else {
            setLocalLine(null);
        }
        // NO CLEANUP calling clearPoints()!
    }, [points]);

    return localLine;
}
// Sub-component: ONLY this component re-renders when mouse moves
function MouseCoordinates() {
    const mouseScreen = useCameraStore((s) => s.mouseScreen);
    const camera = useCameraStore((s) => s.camera);
    const mouseWorld = camera.screenToWorld(mouseScreen, window.innerWidth, window.innerHeight);

    return (
        <>
            <Label className="m-0 leading-tight">X: {mouseWorld.x.toFixed(2)}</Label>
            <Label className="m-0 leading-tight">Y: {mouseWorld.y.toFixed(2)}</Label>
        </>
    );
}

export function App() {
    const worldRef = useRef<HTMLCanvasElement | null>(null);
    const canvas = useRef<InfiniteCanvas | null>(null);

    const points = useCameraStore((s) => s.points);
    const lineAdder = useCameraStore((s) => s.addLine);
    const lineClearer = useCameraStore((s) => s.clearLines);

    const [line, setLine] = useState<{ m: number; b: number } | null>(null);

    // Calculate regression and update canvas lines directly
    useEffect(() => {
        if (points.length >= 2) {
            fitPoints(points)
                .then((res) => {
                    setLine(res);
                    lineClearer();
                    lineAdder({ m: res.m, b: res.b });
                })
                .catch((err) => console.warn(err.message));
        } else {
            setLine(null);
            lineClearer();
        }
    }, [points]);

    // Canvas lifecycle
    useEffect(() => {
        if (!worldRef.current) return;
        const engine = new InfiniteCanvas(worldRef.current);
        canvas.current = engine;
        return () => engine.destroy();
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden select-none">
            <canvas ref={worldRef} id="world" className="block w-full h-full" />

            <div className="pointer-events-none absolute top-10 left-10 z-10 flex flex-col gap-1 rounded bg-black/75 p-3 font-mono text-xs text-white backdrop-blur">
                <MouseCoordinates />
                <Label className="m-0 leading-tight">
                    Slope: {line ? line.m.toFixed(3) : "—"}
                </Label>
                <Label className="m-0 leading-tight">
                    Intercept: {line ? line.b.toFixed(3) : "—"}
                </Label>
            </div>
        </div>
    );
}

export default App;
