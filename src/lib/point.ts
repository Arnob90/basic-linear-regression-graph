import type { Node, RenderContext } from "./node";
import type { PixelPoint } from "./types";

export class ScatterPlotNode implements Node {
    constructor(public points: PixelPoint[], public color = "#2563eb") { }

    public render({ ctx, camera }: RenderContext): void {
        if (this.points.length === 0) return;

        ctx.fillStyle = this.color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 / camera.zoom;

        const radius = 6 / camera.zoom;

        // 1. Start ONE path for ALL points
        ctx.beginPath();
        for (const p of this.points) {
            // Move pen to point edge to avoid connecting lines
            ctx.moveTo(p.x + radius, p.y);
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        }

        // 2. ONE fill call and ONE stroke call for the entire dataset!
        ctx.fill();
        ctx.stroke();
    }
}
