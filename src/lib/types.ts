export class Point {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(other: Point): Point {
        return new Point(this.x + other.x, this.y + other.y);
    }

    multiply(scalar: number): Point {
        return new Point(this.x * scalar, this.y * scalar);
    }

    subtract(other: Point): Point {
        return this.add(other.multiply(-1));
    }
}

export class Camera {
    readonly position: Point;
    readonly zoom: number;

    constructor(position: Point, zoom: number) {
        this.position = position;
        this.zoom = zoom;
    }

    withPosition(position: Point): Camera {
        return new Camera(position, this.zoom);
    }

    withZoom(zoom: number): Camera {
        return new Camera(this.position, zoom);
    }

    screenToWorld(screenPoint: Point, viewportWidth: number, viewportHeight: number): Point {
        const center = new Point(viewportWidth, viewportHeight).multiply(0.5);
        return screenPoint.subtract(center).multiply(1 / this.zoom).add(this.position);
    }

    worldToScreen(worldPoint: Point, viewportWidth: number, viewportHeight: number): Point {
        const center = new Point(viewportWidth, viewportHeight).multiply(0.5);
        return worldPoint.subtract(this.position).multiply(this.zoom).add(center);
    }
}

export function clamp(value: number, min: number | null, max: number | null): number {
    if (min !== null && value < min) return min;
    if (max !== null && value > max) return max;
    return value;
}

export function gridToWorldPoint(p: Point): Point {
    return p.multiply(100);
}

export function worldToGridPoint(p: Point): Point {
    return p.multiply(1 / 100);
}
