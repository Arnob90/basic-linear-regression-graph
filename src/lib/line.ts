import type { Node, RenderContext } from "./node";
import { PixelPoint } from "./types";
export class Line implements Node {
    public constructor(public m: number, public b: number, public color = "#ef4444") { }
    public render({ screenToWorld, ctx, canvas, camera }: RenderContext): void {
        const m = this.m;
        const b = this.b;
        const color = this.color;
        // 1. Find the visible horizontal world bounds
        const topLeft = screenToWorld(new PixelPoint(0, 0));
        const bottomRight = screenToWorld(new PixelPoint(canvas.width, canvas.height));

        const minX = topLeft.x;
        const maxX = bottomRight.x;

        // 2. Compute the corresponding Y values using y = mx + b
        const y1 = m * minX + b;
        const y2 = m * maxX + b;

        // 3. Draw the line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / camera.zoom; // Always 2 screen pixels wide
        ctx.beginPath();
        ctx.moveTo(minX, y1);
        ctx.lineTo(maxX, y2);
        ctx.stroke();
    }
}
