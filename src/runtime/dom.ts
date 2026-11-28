import { effect } from "./reactive";

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