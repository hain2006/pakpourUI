
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

            Array.from(this.cleanups).forEach(cleanup => cleanup());
            this.cleanups.clear();

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

        Array.from(reactiveEffect.cleanups).forEach(cleanup => cleanup());
        reactiveEffect.cleanups.clear();

        reactiveEffect.dependencies.forEach(dependency => {
            dependency.delete(reactiveEffect);
        });

        reactiveEffect.dependencies.clear();

        ownerEffect?.cleanups.delete(stop);
    };

    ownerEffect?.cleanups.add(stop);

    reactiveEffect.run();

    return stop;
}
