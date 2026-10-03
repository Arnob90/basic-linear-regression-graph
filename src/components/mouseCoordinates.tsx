import { useCameraStore } from "@/lib/cameraStore";
import { useState } from "react";
import { useSignal } from "@/lib/useSignal.ts";
import { Label } from "./ui/label";
import { pixelToVector, Vector } from "../lib/types.ts"
import type { ReadonlySignal } from "@/lib/eventSignal.ts";
import type { PointerEventPayload } from "@/lib/infiniteCanvas.ts";
export interface MouseCoordinatesProps {
    pointerMoveSignal: ReadonlySignal<PointerEventPayload>,
    gridSize: number
}
export function MouseCoordinates({ pointerMoveSignal, gridSize }: MouseCoordinatesProps) {
    const [mathPos, setMathPos] = useState<Vector>(new Vector(0, 0));

    // Subscribes directly to the signal!
    useSignal(pointerMoveSignal, ({ world }) => {
        setMathPos(pixelToVector(world, gridSize));
    });
    return (
        <>
            <Label className="m-0 leading-tight">X: {mathPos.x.toFixed(2)}</Label>
            <Label className="m-0 leading-tight">Y: {mathPos.y.toFixed(2)}</Label>
        </>
    );
}
