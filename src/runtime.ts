
type ReactiveEffect = {
    callback: () => void;
    dependencies: Set<Set<ReactiveEffect>>;
    cleanups: Set<() => void>;
    active: boolean;
    ownsChildren: boolean;
    run: () => void;
};

let activeEffect: ReactiveEffect | undefined;
const effectStack: ReactiveEffect[] = [];

export function signal<T>(initialValue: T) {
    let value = initialValue;

    const subscribers = new Set<ReactiveEffect>();

    return {
        get value(): T {
            if (activeEffect) {
                subscribers.add(activeEffect);
                activeEffect.dependencies.add(subscribers);
            }

            return value;
        },

        set value(newValue: T) {
            if (Object.is(value, newValue)) return;

            value = newValue;

            Array.from(subscribers).forEach(effect => effect.run());
        }
    };
}

export function effect(
    callback: () => void,
    options?: { scope?: boolean }
): () => void {
    const ownerEffect = activeEffect?.ownsChildren
        ? activeEffect
        : undefined;

    const reactiveEffect: ReactiveEffect = {
        callback,
        dependencies: new Set(),
        cleanups: new Set(),
        active: true,
        ownsChildren: options?.scope ?? false,
        run() {
            if (!this.active) return;
            if (activeEffect === this) return;

            // Clean up nested effects from the previous execution.
            Array.from(this.cleanups).forEach(cleanup => cleanup());
            this.cleanups.clear();

            // Remove previous reactive dependencies.
            this.dependencies.forEach(dependency => {
                dependency.delete(this);
            });

            this.dependencies.clear();

            effectStack.push(this);
            activeEffect = this;

            try {
                this.callback();
            } catch (error) {
                console.error("pakpourUI Effect Error:", error);
            } finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };

    const stop = () => {
        if (!reactiveEffect.active) return;

        reactiveEffect.active = false;

        // Stop all nested effects.
        Array.from(reactiveEffect.cleanups).forEach(cleanup => cleanup());
        reactiveEffect.cleanups.clear();

        // Remove reactive dependencies.
        reactiveEffect.dependencies.forEach(dependency => {
            dependency.delete(reactiveEffect);
        });

        reactiveEffect.dependencies.clear();

        ownerEffect?.cleanups.delete(stop);
    };

    // Register this effect as a child of its active parent.
    ownerEffect?.cleanups.add(stop);

    reactiveEffect.run();

    return stop;
}

export function createElement(tag: string): HTMLElement {
    return document.createElement(tag);
}

export function bindText(
    element: HTMLElement,
    getter: () => string
): void {
    effect(() => {
        element.textContent = getter();
    });
}



export function createScope(
    parent: HTMLElement,
    render: (element: HTMLElement) => void
): {
    element: HTMLElement;
    dispose: () => void;
} {
    const element = createElement("div");

    parent.appendChild(element);

    const stop = effect(() => {
        element.replaceChildren();

        render(element);
    }, { scope: true });

    let disposed = false;

    return {
        element,

        dispose() {
            if (disposed) return;

            disposed = true;

            stop();
            element.remove();
        }
    };
}


export function createPageScope(root: HTMLElement): {
    render: (callback: () => void) => void;
    dispose: () => void;
} {
    let stopRender: (() => void) | undefined;
    let disposed = false;

    return {
        render(callback) {
            if (disposed) {
                throw new Error(
                    "Cannot render a disposed page scope."
                );
            }

            // Stop effects belonging to the previous render.
            stopRender?.();

            // Clear previous page content.
            root.replaceChildren();

            // Create a new reactive scope for this page.
            stopRender = effect(callback, {
                scope: true
            });
        },

        dispose() {
            if (disposed) return;

            disposed = true;

            // Stop all effects owned by this page.
            stopRender?.();
            stopRender = undefined;

            // Remove all page content.
            root.replaceChildren();
        }
    };
}



