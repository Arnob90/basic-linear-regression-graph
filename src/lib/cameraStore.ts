import { create } from 'zustand';
import { List } from "immutable"
import { Camera, PixelPoint, clamp } from './types';

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 20;

interface Line {
	m: number,
	b: number
}
type UpdaterFunc<T> = (prev: T) => T;
interface CameraStore {
	camera: Camera;
	setCamera: (camera: Camera) => void;
	setPosition: (position: PixelPoint) => void;
	setZoom: (zoom: number) => void;
	zoomBy: (factor: number) => void;
	resetCamera: () => void;
	mouseScreen: PixelPoint;
	setMouseScreen: (p: PixelPoint) => void;
	points: List<PixelPoint>,
	setPoints: (updater: UpdaterFunc<List<PixelPoint>>) => void,
	lines: List<Line>;
	setLines: (updater: UpdaterFunc<List<Line>>) => void;
	gridSize: number;
}

export const useCameraStore = create<CameraStore>((set) => ({
	camera: new Camera(new PixelPoint(0, 0), 1),

	setCamera: (camera) => set({ camera }),

	setPosition: (position) =>
		set((state) => ({ camera: state.camera.withPosition(position) })),

	setZoom: (zoom) =>
		set((state) => ({
			camera: state.camera.withZoom(clamp(zoom, MIN_ZOOM, MAX_ZOOM)),
		})),

	zoomBy: (factor) =>
		set((state) => ({
			camera: state.camera.withZoom(
				clamp(state.camera.zoom * factor, MIN_ZOOM, MAX_ZOOM)
			),
		})),

	resetCamera: () =>
		set({ camera: new Camera(new PixelPoint(0, 0), 1) }),
	mouseScreen: new PixelPoint(0, 0),
	setMouseScreen: (p: PixelPoint) => set({ mouseScreen: p }),
	points: List(),
	lines: List(),
	setPoints: ((updater) => {
		return set((state) => ({ points: updater(state.points) }))
	}),
	setLines: ((updater) => {
		return set((state) => ({ lines: updater(state.lines) }))
	}),
	gridSize: 100
}));
