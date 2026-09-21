import { Point, Camera, clamp } from './types';
import { useCameraStore, MIN_ZOOM, MAX_ZOOM } from './cameraStore';

export class InfiniteCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private isDragging = false;
    private dragStart: Point = new Point(0, 0);
    private animationFrameId: number | null = null;

    public readonly GRID_SIZE = 100;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        this.ctx = ctx;

        this.initEvents();
        this.resize();
        this.render();
    }

    // Convenience accessors that delegate to the Camera class
    public get camera(): Camera {
        return useCameraStore.getState().camera;
    }

    public screenToWorld(screenPoint: Point): Point {
        return this.camera.screenToWorld(screenPoint, this.canvas.width, this.canvas.height);
    }

    public worldToScreen(worldPoint: Point): Point {
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
        // 1. Get exact pixel coordinates relative to the canvas
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // 2. Convert to world/math space!
        const worldPoint = this.screenToWorld(new Point(screenX, screenY));

        // 3. Add to Zustand store
        useCameraStore.getState().addPoint(worldPoint);
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
        this.dragStart = new Point(e.clientX, e.clientY);
    };

    private onMouseMove = (e: MouseEvent): void => {
        const currentPos = new Point(e.clientX, e.clientY);
        useCameraStore.getState().setMouseScreen(currentPos);
        if (!this.isDragging) return;

        const dragOffset = currentPos.subtract(this.dragStart);
        const currentCamera = this.camera;

        // Shift position by scaled drag delta
        const newPosition = currentCamera.position.subtract(
            dragOffset.multiply(1 / currentCamera.zoom)
        );

        // Update Zustand store
        useCameraStore.getState().setCamera(currentCamera.withPosition(newPosition));
        this.dragStart = currentPos;
    };

    private onMouseUp = (): void => {
        this.isDragging = false;
    };

    private onWheel = (e: WheelEvent): void => {
        e.preventDefault();

        const mouseScreen = new Point(e.clientX, e.clientY);
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

    private drawGrid(): void {
        const { width, height } = this.canvas;
        const camera = this.camera;

        const topLeft = this.screenToWorld(new Point(0, 0));
        const bottomRight = this.screenToWorld(new Point(width, height));

        const startX = Math.floor(topLeft.x / this.GRID_SIZE) * this.GRID_SIZE;
        const endX = Math.ceil(bottomRight.x / this.GRID_SIZE) * this.GRID_SIZE;
        const startY = Math.floor(topLeft.y / this.GRID_SIZE) * this.GRID_SIZE;
        const endY = Math.ceil(bottomRight.y / this.GRID_SIZE) * this.GRID_SIZE;

        this.ctx.lineWidth = 1 / camera.zoom;
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.beginPath();

        for (let x = startX; x <= endX; x += this.GRID_SIZE) {
            this.ctx.moveTo(x, topLeft.y);
            this.ctx.lineTo(x, bottomRight.y);
        }

        for (let y = startY; y <= endY; y += this.GRID_SIZE) {
            this.ctx.moveTo(topLeft.x, y);
            this.ctx.lineTo(bottomRight.x, y);
        }
        this.ctx.stroke();

        // Draw origin axes
        this.ctx.strokeStyle = '#999999';
        this.ctx.lineWidth = 2 / camera.zoom;
        this.ctx.beginPath();
        this.ctx.moveTo(0, topLeft.y);
        this.ctx.lineTo(0, bottomRight.y);
        this.ctx.moveTo(topLeft.x, 0);
        this.ctx.lineTo(bottomRight.x, 0);
        this.ctx.stroke();
    }
    private drawDataPoints(): void {
        const points = useCameraStore.getState().points;
        const zoom = this.camera.zoom;

        this.ctx.fillStyle = "#2563eb"; // Blue
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2 / zoom; // Keep 2px outline regardless of zoom

        // Point radius: 6 screen pixels -> convert to world size
        const radius = 6 / zoom;

        for (const p of points) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
    public drawLine(m: number, b: number, color = "#ef4444"): void {
        // 1. Find the visible horizontal world bounds
        const topLeft = this.screenToWorld(new Point(0, 0));
        const bottomRight = this.screenToWorld(new Point(this.canvas.width, this.canvas.height));

        const minX = topLeft.x;
        const maxX = bottomRight.x;

        // 2. Compute the corresponding Y values using y = mx + b
        const y1 = m * minX + b;
        const y2 = m * maxX + b;

        // 3. Draw the line
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2 / this.camera.zoom; // Always 2 screen pixels wide

        this.ctx.beginPath();
        this.ctx.moveTo(minX, y1);
        this.ctx.lineTo(maxX, y2);
        this.ctx.stroke();
    }
    private renderLines() {
        const lines = useCameraStore.getState().lines
        for (const line of lines) {
            this.drawLine(line.m, line.b)
        }
    }
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

        this.drawGrid();
        this.drawDataPoints();
        this.renderLines()

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
