import { useCameraStore } from "@/lib/cameraStore";
import { Label } from "./ui/label";
import { pixelToVector } from "../lib/types.ts"
// Sub-component: ONLY this component re-renders when mouse moves
export function MouseCoordinates() {
	const mouseScreen = useCameraStore((s) => s.mouseScreen);
	const camera = useCameraStore((s) => s.camera);
	const mouseWorld = camera.screenToWorld(mouseScreen, window.innerWidth, window.innerHeight);
	const gridSize = useCameraStore(s => s.gridSize)
	const realPoint = pixelToVector(mouseWorld, gridSize)
	return (
		<>
			<Label className="m-0 leading-tight">X: {realPoint.x.toFixed(2)}</Label>
			<Label className="m-0 leading-tight">Y: {realPoint.y.toFixed(2)}</Label>
		</>
	);
}
