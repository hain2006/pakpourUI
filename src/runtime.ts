
type ReactiveEffect = {
    callback: () => void;
    dependencies: Set<Set<ReactiveEffect>>;
    active: boolean;
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

export function effect(callback: () => void): () => void {
    const reactiveEffect: ReactiveEffect = {
        callback,
        dependencies: new Set(),
        active: true,

        run() {
            if (!this.active) return;
            if (activeEffect === this) return;

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

    reactiveEffect.run();
    return () => {
        reactiveEffect.active = false;

        reactiveEffect.dependencies.forEach(dependency => {
            dependency.delete(reactiveEffect);
        });

        reactiveEffect.dependencies.clear();
    };
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
