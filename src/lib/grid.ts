import { PixelPoint } from "./types";
import type { Node, RenderContext } from "./node";
export class Grid implements Node {
    public constructor(public gridSize: number) { }
    public render({ screenToWorld, camera, ctx, canvas }: RenderContext) {
        const { width, height } = canvas;
        const topLeftScreen = new PixelPoint(0, 0);
        const bottomRightScreen = new PixelPoint(width, height);
        const topLeft = screenToWorld(topLeftScreen);
        const bottomRight = screenToWorld(bottomRightScreen);
        const leftEdgeX = topLeft.x;
        const rightEdgeX = bottomRight.x;
        const upEdgeY = topLeft.y;
        const downEdgeY = bottomRight.y;
        const startX = Math.floor(topLeft.x / this.gridSize) * this.gridSize;
        const endX = Math.ceil(bottomRight.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(topLeft.y / this.gridSize) * this.gridSize;
        const endY = Math.ceil(bottomRight.y / this.gridSize) * this.gridSize;
        // 1. Vertical lines (Loop across X, span from bottom to top)
        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.moveTo(x, downEdgeY);
            ctx.lineTo(x, upEdgeY);
        }
        // 2. Horizontal lines (Loop across Y, span from left to right)
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.moveTo(leftEdgeX, y);
            ctx.lineTo(rightEdgeX, y);
        }
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.beginPath();
        ctx.moveTo(0, topLeft.y);
        ctx.lineTo(0, bottomRight.y);
        ctx.moveTo(topLeft.x, 0);
        ctx.lineTo(bottomRight.x, 0);
        ctx.stroke();
    }
}
