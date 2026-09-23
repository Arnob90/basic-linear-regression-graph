abstract class CoordinateSystem<Brand extends string> {
	// Phantom type: zero bytes at runtime (erased by compiler)
	declare readonly __brand: Brand;

	constructor(readonly x: number, readonly y: number) { }

	// Polymorphic 'this' guarantees p1.add(p2) returns a PixelPoint,
	// while v1.add(v2) returns a MathVector!
	add(other: this): this {
		return new (this.constructor as new (x: number, y: number) => this)(
			this.x + other.x,
			this.y + other.y
		);
	}

	subtract(other: this): this {
		return new (this.constructor as new (x: number, y: number) => this)(
			this.x - other.x,
			this.y - other.y
		);
	}

	multiply(scalar: number): this {
		return new (this.constructor as new (x: number, y: number) => this)(
			this.x * scalar,
			this.y * scalar
		);
	}
}

// 2. Define as many distinct unit spaces as you want in 1 line:
export class PixelPoint extends CoordinateSystem<"PixelPoint"> { }
export class Vector extends CoordinateSystem<"Vector"> { }
export class Camera {
	readonly position: PixelPoint;
	readonly zoom: number;

	constructor(position: PixelPoint, zoom: number) {
		this.position = position;
		this.zoom = zoom;
	}

	withPosition(position: PixelPoint): Camera {
		return new Camera(position, this.zoom);
	}

	withZoom(zoom: number): Camera {
		return new Camera(this.position, zoom);
	}

	screenToWorld(screenPoint: PixelPoint, viewportWidth: number, viewportHeight: number): PixelPoint {
		const center = new PixelPoint(viewportWidth, viewportHeight).multiply(0.5);
		return screenPoint.subtract(center).multiply(1 / this.zoom).add(this.position);
	}

	worldToScreen(worldPoint: PixelPoint, viewportWidth: number, viewportHeight: number): PixelPoint {
		const center = new PixelPoint(viewportWidth, viewportHeight).multiply(0.5);
		return worldPoint.subtract(this.position).multiply(this.zoom).add(center);
	}
}

export function clamp(value: number, min: number | null, max: number | null): number {
	if (min !== null && value < min) return min;
	if (max !== null && value > max) return max;
	return value;
}

export function pixelToVector(p: PixelPoint, pixelsPerGridUnit: number): Vector {
	const point1 = p.multiply(1 / pixelsPerGridUnit);
	return new Vector(point1.x, -point1.y)
}

export function vectorToPixel(p: Vector, pixelsPerGridUnit: number): PixelPoint {
	const point1 = p.multiply(pixelsPerGridUnit);
	return new PixelPoint(point1.x, -point1.y)
}
// Convert Math Line -> Pixel Line for Canvas rendering:
export function mathLineToPixelLine(line: { m: number; b: number }, gridSize: number) {
	return {
		m: -line.m,                    // Slope is inverted because canvas Y is flipped
		b: -line.b * gridSize,         // Intercept is inverted and scaled by gridSize
	};
}

export function pixelLineToMathLine(line: { m: number; b: number }, gridSize: number) {
	return {
		m: -line.m,                    // Slope is inverted because canvas Y is flipped
		b: -line.b / gridSize,         // Intercept is inverted and scaled by gridSize
	};
}
