import type { Camera, PixelPoint } from "./types";

export interface RenderContext {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    camera: Camera,
    screenToWorld: (pixel: PixelPoint) => PixelPoint;
    worldToScreen: (math: PixelPoint) => PixelPoint;
}
export interface Node {
    render: (givenContext: RenderContext) => void;
}
