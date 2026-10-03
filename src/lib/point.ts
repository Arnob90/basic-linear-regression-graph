import type { CanvasNode, RenderContext } from "./node";
import type { PixelPoint } from "./types";

export class ScatterPlotNode implements CanvasNode {
    constructor(
        public points: PixelPoint[],
        public color = "#2563eb",
        public specialColors = new Map<number, string>()
    ) { }

    public render({ ctx, camera }: RenderContext): void {
        if (this.points.length === 0) return;

        const radius = 6 / camera.zoom;
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeStyle = "#ffffff";

        // === PASS 1: Batch draw all normal points in ONE call ===
        ctx.fillStyle = this.color;
        ctx.beginPath();

        for (let i = 0; i < this.points.length; ++i) {
            // Skip points that have a special color (they are drawn in Pass 2)
            if (this.specialColors.has(i)) continue;

            const p = this.points[i]!;
            ctx.moveTo(p.x + radius, p.y);
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        // === PASS 2: Draw the special/highlighted points ===
        // (Usually only 1 or 2 points, e.g. hovered/selected)
        for (const [index, color] of this.specialColors) {
            const p = this.points[index];
            if (!p) continue;

            const specialRadius = 8 / camera.zoom; // Make hovered points slightly larger!

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, specialRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
}
