export type Listener<T> = (data: T) => void;
export type Unsubscribe = () => void;

/**
 * Read-only interface if you want to expose only subscription capabilities
 * and prevent external consumers from emitting events.
 */
export interface ReadonlySignal<T> {
    subscribe(listener: Listener<T>): Unsubscribe;
    once(listener: Listener<T>): Unsubscribe;
    readonly size: number;
}

export class EventSignal<T = void> implements ReadonlySignal<T> {
    private listeners = new Set<Listener<T>>();

    /**
     * Subscribes a listener to the signal.
     * Returns a cleanup function directly compatible with React's `useEffect`.
     */
    public subscribe(listener: Listener<T>): Unsubscribe {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Subscribes a listener that will automatically unsubscribe after firing once.
     */
    public once(listener: Listener<T>): Unsubscribe {
        const unsubscribe = this.subscribe((data) => {
            unsubscribe();
            listener(data);
        });
        return unsubscribe;
    }

    /**
     * Emits data to all registered listeners.
     * If T is void, you can call emit() with no arguments.
     */
    public emit(...args: T extends void ? [] : [data: T]): void {
        const data = args[0] as T;

        // Snapshot listeners so unsubscribing during an emit does not break iteration
        const snapshot = Array.from(this.listeners);
        for (const listener of snapshot) {
            listener(data);
        }
    }

    /**
     * Removes all active listeners. Call this when tearing down the parent engine.
     */
    public clear(): void {
        this.listeners.clear();
    }

    /**
     * Returns the number of currently active listeners.
     */
    public get size(): number {
        return this.listeners.size;
    }

    /**
     * Exposes only the subscribe methods, hiding `.emit()` and `.clear()`.
     */
    public asReadonly(): ReadonlySignal<T> {
        return this;
    }
}
