import { create } from 'zustand';
import { Camera, Point, clamp } from './types';

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 20;

interface Line {
    m: number,
    b: number
}

interface CameraStore {
    camera: Camera;
    setCamera: (camera: Camera) => void;
    setPosition: (position: Point) => void;
    setZoom: (zoom: number) => void;
    zoomBy: (factor: number) => void;
    resetCamera: () => void;
    mouseScreen: Point;
    setMouseScreen: (p: Point) => void;
    points: Point[],
    addPoint: (point: Point) => void;
    clearPoints: () => void;
    lines: Line[];
    addLine: (l: Line) => void;
    clearLines: () => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
    camera: new Camera(new Point(0, 0), 1),

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
        set({ camera: new Camera(new Point(0, 0), 1) }),
    mouseScreen: new Point(0, 0),
    setMouseScreen: (p: Point) => set({ mouseScreen: p }),
    points: [],
    addPoint: (p: Point) => set((state) => { return { points: [...state.points, p] } }),
    clearPoints: () => set({ points: [] }),
    lines: [],
    addLine: (l: Line) => set((state) => { return { lines: [...state.lines, l] } }),
    clearLines: () => set({ lines: [] }),
}));
