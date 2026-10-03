// useSignal.ts
import { useEffect } from "react";
import type { ReadonlySignal } from "./eventSignal";

export function useSignal<T>(
    signal: ReadonlySignal<T> | undefined,
    listener: (data: T) => void
): void {
    useEffect(() => {
        if (!signal) return;
        return signal.subscribe(listener); // Subscribes and auto-unsubscribes on unmount
    }, [signal, listener]);
}
