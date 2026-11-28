import { effect, onCleanup } from "./reactive";

export type ElementOptions = {
    attributes?: Record<string, string | number | boolean>;
    class?: string | string[];
    style?: Partial<CSSStyleDeclaration>;
    events?: Record<string, EventListener>;
    children?: Array<Node | string | number>;
};

export function createElement(
    tag: string,
    options?: ElementOptions
): HTMLElement {
    const element = document.createElement(tag);

    if (!options) {
        return element;
    }

    // Attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(
            ([name, value]) => {
                if (value === false) return;

                element.setAttribute(
                    name,
                    value === true ? "" : String(value)
                );
            }
        );
    }

    // Classes
    if (options.class) {
        element.className = Array.isArray(options.class)
            ? options.class.join(" ")
            : options.class;
    }

    // Styles
    if (options.style) {
        Object.assign(element.style, options.style);
    }

    // Events
    if (options.events) {
        Object.entries(options.events).forEach(
            ([event, handler]) => {
                element.addEventListener(event, handler);
            }
        );
    }

    // Children
    if (options.children) {
        options.children.forEach(child => {
            if (typeof child === "string" || typeof child === "number") {
                element.appendChild(
                    document.createTextNode(String(child))
                );
            } else {
                element.appendChild(child);
            }
        });
    }

    return element;
}

export function bindText(
    element: HTMLElement,
    getter: () => string
): void {
    effect(() => {
        element.textContent = getter();
    });
}


export function bindChildren(
    element: HTMLElement,
    getter: () => Array<Node | string | number>
): () => void {
    return effect(() => {
        const children = getter();
        const renderedNodes: Node[] = [];

        children.forEach(child => {
            const node =
                typeof child === "string" || typeof child === "number"
                    ? document.createTextNode(String(child))
                    : child;

            element.appendChild(node);
            renderedNodes.push(node);
        });

        onCleanup(() => {
            renderedNodes.forEach(node => {
                if (node.parentNode === element) {
                    element.removeChild(node);
                }
            });
        });
    });
}
