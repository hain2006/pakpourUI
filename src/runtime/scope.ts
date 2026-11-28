import { effect, registerCleanup } from "./reactive";
import { createElement } from "./dom";

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
    const dispose = () => {
        if (disposed) return;

        disposed = true;

        stop();
        element.remove();
    };

    registerCleanup(dispose);

    return {
        element,
        dispose
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

            stopRender?.();

            root.replaceChildren();

            stopRender = effect(callback, {
                scope: true
            });
        },

        dispose() {
            if (disposed) return;

            disposed = true;

            stopRender?.();
            stopRender = undefined;

            root.replaceChildren();
        }
    };
}