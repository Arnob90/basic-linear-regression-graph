import { PixelPoint, Camera, clamp } from './types';
import { useCameraStore, MIN_ZOOM, MAX_ZOOM } from './cameraStore';
import type { Node, RenderContext } from './node';

export interface CanvasEvents {
    onCameraChange?: (camera: Camera) => void;
    onPointerMove?: (world: PixelPoint, screen: PixelPoint) => void;
    onDoubleClick?: (world: PixelPoint, screen: PixelPoint) => void;
}

export class InfiniteCanvas {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    private isDragging = false;
    private dragStart: PixelPoint = new PixelPoint(0, 0);
    private animationFrameId: number | null = null;
    public children: Node[]
    public camera: Camera

    constructor(canvas: HTMLCanvasElement, private events: CanvasEvents = {}) {
        this.canvas = canvas;
        this.children = []
        this.camera = new Camera(new PixelPoint(0, 0), 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        this.ctx = ctx;
        this.initEvents();
        this.resize();
        this.render();
    }

    public screenToWorld(screenPoint: PixelPoint): PixelPoint {
        return this.camera.screenToWorld(screenPoint, this.canvas.width, this.canvas.height);
    }

    public worldToScreen(worldPoint: PixelPoint): PixelPoint {
        return this.camera.worldToScreen(worldPoint, this.canvas.width, this.canvas.height);
    }

    private initEvents(): void {
        window.addEventListener('resize', this.onResize);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
        this.canvas.addEventListener("dblclick", this.onDoubleClick)
    }
    private onDoubleClick = (e: MouseEvent): void => {
        const rect = this.canvas.getBoundingClientRect();
        const screen = new PixelPoint(e.clientX - rect.left, e.clientY - rect.top);
        const world = this.screenToWorld(screen);

        // Let the outside world decide what double-click does!
        this.events.onDoubleClick?.(world, screen);
    };

    private onResize = (): void => {
        this.resize();
    };

    private resize(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    private onMouseDown = (e: MouseEvent): void => {
        this.isDragging = true;
        this.dragStart = new PixelPoint(e.clientX, e.clientY);
    };

    private onMouseMove = (e: MouseEvent): void => {
        const screenPos = new PixelPoint(e.clientX, e.clientY);
        const worldPos = this.screenToWorld(screenPos);

        // 1. Always notify app of pointer movement:
        this.events.onPointerMove?.(worldPos, screenPos);

        if (!this.isDragging) return;

        // 2. Pan calculation:
        const dragOffset = screenPos.subtract(this.dragStart);
        const newPosition = this.camera.position.subtract(
            dragOffset.multiply(1 / this.camera.zoom)
        );
        this.camera = this.camera.withPosition(newPosition);
        this.dragStart = screenPos;

        // 3. Notify app of camera update:
        this.events.onCameraChange?.(this.camera);
    };

    private onMouseUp = (): void => {
        this.isDragging = false;
    };

    private onWheel = (e: WheelEvent): void => {
        e.preventDefault();

        const mouseScreen = new PixelPoint(e.clientX, e.clientY);
        const currentCamera = this.camera;
        // 1. World point before zoom
        const mouseWorld = currentCamera.screenToWorld(
            mouseScreen,
            this.canvas.width,
            this.canvas.height
        );

        // 2. Calculate new zoom
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = clamp(currentCamera.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
        const tempCamera = currentCamera.withZoom(newZoom)
        const newMouseWorld = tempCamera.screenToWorld(mouseScreen, this.canvas.width, this.canvas.height)
        const drift = newMouseWorld.subtract(mouseWorld)
        const newCamera = tempCamera.withPosition(tempCamera.position.subtract(drift))
        useCameraStore.getState().setCamera(newCamera);
    };
    private render = (): void => {
        const camera = this.camera;

        // Reset & clear
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply Camera Transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(camera.zoom, camera.zoom);
        this.ctx.translate(-camera.position.x, -camera.position.y);
        const renderCtx = {
            ctx: this.ctx,
            canvas: this.canvas,
            camera: this.camera,
            screenToWorld: (p) => this.screenToWorld(p),
            worldToScreen: (v) => this.worldToScreen(v),
        } satisfies RenderContext;
        for (const node of this.children) {
            node.render(renderCtx);
        }
        this.animationFrameId = requestAnimationFrame(this.render);
    };

    public destroy(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener('resize', this.onResize);
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
        this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    }
}
