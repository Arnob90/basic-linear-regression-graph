import { MouseCoordinates } from "./mouseCoordinates"
import { Label } from "./ui/label"
import { cn } from "@/lib/utils"
import type { ReadonlySignal } from "@/lib/eventSignal"
import type { PointerEventPayload } from "@/lib/infiniteCanvas"
export interface Information {
    slope: number | null,
    intercept: number | null,
    className?: string,
    pointerMoveSignal: ReadonlySignal<PointerEventPayload>,
    gridSize: number
}
export function InfoBox({ slope, intercept, className: classname, pointerMoveSignal, gridSize }: Information) {
    return (
        <div className={cn("flex flex-col gap-1 rounded bg-black/75 p-3 font-mono text-xs text-white backdrop-blur w-fit", classname)}>
            <MouseCoordinates pointerMoveSignal={pointerMoveSignal} gridSize={gridSize} />
            <Label className="m-0 leading-tight">
                Slope: {slope !== null ? slope.toFixed(3) : "—"}
            </Label>
            <Label className="m-0 leading-tight">
                Intercept: {intercept !== null ? intercept.toFixed(3) : "—"}
            </Label>
        </div>
    )
}
