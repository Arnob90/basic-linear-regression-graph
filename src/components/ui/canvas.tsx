export class Point {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    add(other: Point): Point {
        return new Point(this.x + other.x, this.y + other.y)
    }
    multiply(scalar: number): Point {
        return new Point(this.x * scalar, this.y * scalar)
    }
    subtract(other: Point): Point {
        return this.add(other.multiply(-1))
    }
}
function clamp(value: number, min: number | null, max: number | null): number {
    if (min && value < min) {
        return min
    }
    if (max && value > max) {
        return max
    }
    return value
}

class Camera {
    position: Point;
    zoom: number;
    constructor(position: Point, zoom: number) {
        this.position = position
        this.zoom = zoom
    }
}

export class InfiniteCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private camera: Camera = new Camera(new Point(0, 0), 1);
    private isDragging = false;
    private dragStart: Point = new Point(0, 0);

    private readonly MIN_ZOOM = 0.05;
    private readonly MAX_ZOOM = 20;
    private readonly GRID_SIZE = 100;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        this.ctx = ctx;

        this.initEvents();
        this.resize();
        this.render();
    }

    // Convert screen coordinates to world coordinates
    public screenToWorld(screenPoint: Point): Point {
        const canvasCenter = new Point(this.canvas.width, this.canvas.height).multiply(1 / 2);
        return screenPoint.subtract(canvasCenter).multiply(1 / this.camera.zoom).add(this.camera.position)
    }

    // Convert world coordinates to screen coordinates
    public worldToScreen(worldPoint: Point): Point {
        const canvasCenter = new Point(this.canvas.width, this.canvas.height).multiply(1 / 2);
        return worldPoint.subtract(this.camera.position).multiply(this.camera.zoom).add(canvasCenter)
    }

    private initEvents(): void {
        window.addEventListener('resize', () => this.resize());

        // Panning (Mouse Drag)
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            this.isDragging = true;
            this.dragStart = new Point(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isDragging) return;
            const currentPos = new Point(e.clientX, e.clientY)
            const dragOffset = currentPos.subtract(this.dragStart)
            // Move camera opposite to mouse movement (scaled by zoom)
            this.camera.position = this.camera.position.subtract(dragOffset.multiply(1 / this.camera.zoom))
            this.dragStart = new Point(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Zooming (Centered on Cursor)
        this.canvas.addEventListener(
            'wheel',
            (e: WheelEvent) => {
                e.preventDefault();
                const mouseScreen = new Point(e.clientX, e.clientY)
                // 1. Get world coordinate under mouse BEFORE zoom
                const mouseWorldBefore = this.screenToWorld(mouseScreen);
                const newZoom = e.deltaY > 0 ? 0.9 : 1.1;
                // 2. Apply new zoom level
                this.camera.zoom = clamp(this.camera.zoom * newZoom, this.MIN_ZOOM, this.MAX_ZOOM);

                // 3. Get world coordinate under mouse AFTER zoom (camera has not moved yet)
                const mouseWorldAfter = this.screenToWorld(mouseScreen);

                // 4. Shift camera by the difference so the point stays pinned under cursor
                this.camera.position = this.camera.position.add(
                    mouseWorldBefore.subtract(mouseWorldAfter)
                );
            },
            { passive: false }
        );
    }

    private resize(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    private drawGrid(): void {
        const { width, height } = this.canvas;
        const { zoom } = this.camera;

        // Determine the world coordinates visible inside the viewport
        const topLeft = this.screenToWorld(new Point(0, 0));
        const bottomRight = this.screenToWorld(new Point(width, height));

        // Calculate start and end grid lines
        const startX = Math.floor(topLeft.x / this.GRID_SIZE) * this.GRID_SIZE;
        const endX = Math.ceil(bottomRight.x / this.GRID_SIZE) * this.GRID_SIZE;
        const startY = Math.floor(topLeft.y / this.GRID_SIZE) * this.GRID_SIZE;
        const endY = Math.ceil(bottomRight.y / this.GRID_SIZE) * this.GRID_SIZE;

        this.ctx.lineWidth = 1 / zoom; // Keep grid lines 1px regardless of zoom
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.beginPath();

        // Vertical lines
        for (let x = startX; x <= endX; x += this.GRID_SIZE) {
            this.ctx.moveTo(x, topLeft.y);
            this.ctx.lineTo(x, bottomRight.y);
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += this.GRID_SIZE) {
            this.ctx.moveTo(topLeft.x, y);
            this.ctx.lineTo(bottomRight.x, y);
        }
        this.ctx.stroke();

        // Draw Main Axes (Origin: 0,0)
        this.ctx.strokeStyle = '#999999';
        this.ctx.lineWidth = 2 / zoom;
        this.ctx.beginPath();
        this.ctx.moveTo(0, topLeft.y);
        this.ctx.lineTo(0, bottomRight.y);
        this.ctx.moveTo(topLeft.x, 0);
        this.ctx.lineTo(bottomRight.x, 0);
        this.ctx.stroke();
    }

    private render = (): void => {
        // Clear screen
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera transform:
        // 1. Move origin to canvas center
        // 2. Scale by zoom
        // 3. Offset by camera position
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.position.x, -this.camera.position.y);

        // Draw world elements
        this.drawGrid();

        requestAnimationFrame(this.render);
    };
}

export function gridToWorldPoint(p: Point) {
    return p.multiply(100)
}
export function worldToGridPoint(p: Point) {
    return p.multiply(1 / 100)
}
