import { describe, it, expect, vi } from "vitest";
import { signal, effect } from "./reactive";
import { createScope, createPageScope } from "./scope";

describe("pakpourUI Scope Runtime", () => {

    it("should dispose scope and its child effects", () => {
        const child = signal(0);
        const childValues: number[] = [];

        const parentElement = {
            children: [] as any[],

            appendChild(element: any) {
                this.children.push(element);
            }
        };

        const scopeElement = {
            children: [] as any[],
            removed: false,

            replaceChildren() {
                this.children = [];
            },

            remove() {
                this.removed = true;
            }
        };

        vi.stubGlobal("document", {
            createElement: () => scopeElement
        });

        const scope = createScope(
            parentElement as unknown as HTMLElement,
            () => {
                effect(() => {
                    childValues.push(child.value);
                });
            }
        );

        expect(parentElement.children).toContain(scopeElement);
        expect(childValues).toEqual([0]);

        scope.dispose();

        child.value = 1;

        expect(childValues).toEqual([0]);
        expect(scopeElement.removed).toBe(true);

        scope.dispose();

        expect(scopeElement.removed).toBe(true);

        vi.unstubAllGlobals();
    });

    it("should rerender scope when its reactive dependencies change", () => {
        const enabled = signal(true);
        const child = signal(0);

        const childValues: number[] = [];
        let renderCount = 0;

        const scopeElement = {
            children: [] as any[],
            removed: false,

            appendChild(element: any) {
                this.children.push(element);
            },

            replaceChildren() {
                this.children = [];
            },

            remove() {
                this.removed = true;
            }
        };

        const parentElement = {
            appendChild() { }
        };

        vi.stubGlobal("document", {
            createElement: () => scopeElement,
            createTextNode: (text: string) => ({ text })
        });

        const scope = createScope(
            parentElement as unknown as HTMLElement,
            (element) => {
                renderCount++;

                if (enabled.value) {
                    element.appendChild(
                        document.createTextNode("Conditional Content")
                    );

                    effect(() => {
                        childValues.push(child.value);
                    });
                }
            }
        );

        expect(renderCount).toBe(1);
        expect(childValues).toEqual([0]);
        expect(scope.element.children).toHaveLength(1);

        enabled.value = false;

        expect(scope.element.children).toHaveLength(0);
        expect(renderCount).toBe(2);

        child.value = 1;

        expect(childValues).toEqual([0]);

        enabled.value = true;

        expect(scope.element.children).toHaveLength(1);
        expect(renderCount).toBe(3);
        expect(childValues).toEqual([0, 1]);

        child.value = 2;

        expect(childValues).toEqual([0, 1, 2]);

        scope.dispose();

        vi.unstubAllGlobals();
    });

    it("should dispose previous page effects when rendering a new page", () => {
        const firstPageState = signal(0);
        const secondPageState = signal(0);

        const firstPageValues: number[] = [];
        const secondPageValues: number[] = [];

        const root = {
            children: [] as any[],

            replaceChildren() {
                this.children = [];
            }
        };

        const page = createPageScope(
            root as unknown as HTMLElement
        );

        page.render(() => {
            effect(() => {
                firstPageValues.push(firstPageState.value);
            });
        });

        expect(firstPageValues).toEqual([0]);

        page.render(() => {
            effect(() => {
                secondPageValues.push(secondPageState.value);
            });
        });

        firstPageState.value = 1;

        expect(firstPageValues).toEqual([0]);

        secondPageState.value = 1;

        expect(secondPageValues).toEqual([0, 1]);

        page.dispose();

        secondPageState.value = 2;

        expect(secondPageValues).toEqual([0, 1]);
        expect(root.children).toHaveLength(0);
    });
    it("should remove child scope elements when rendering a new page", () => {
        const root = {
            children: [] as any[],

            appendChild(element: any) {
                this.children.push(element);
            },

            replaceChildren() {
                this.children = [];
            }
        };

        const scopeElement = {
            children: [] as any[],
            removed: false,

            replaceChildren() {
                this.children = [];
            },

            remove() {
                this.removed = true;
            }
        };

        vi.stubGlobal("document", {
            createElement: () => scopeElement
        });

        const page = createPageScope(
            root as unknown as HTMLElement
        );

        page.render(() => {
            createScope(
                root as unknown as HTMLElement,
                () => { }
            );
        });

        expect(root.children).toContain(scopeElement);
        expect(scopeElement.removed).toBe(false);

        page.render(() => { });

        expect(scopeElement.removed).toBe(true);

        page.dispose();

        vi.unstubAllGlobals();
    });
});