import { describe, it, expect, vi } from "vitest";
import { createElement, bindText } from "./dom";
import { signal } from "./reactive";

describe("pakpourUI DOM Runtime", () => {

    it("should create a DOM element", () => {
        const mockElement = {
            tagName: "DIV"
        };

        const createElementSpy = vi.fn(() => mockElement);

        vi.stubGlobal("document", {
            createElement: createElementSpy
        });

        const element = createElement("div");

        expect(element).toBe(mockElement);
        expect(createElementSpy).toHaveBeenCalledWith("div");

        vi.unstubAllGlobals();
    });

    it("should bind reactive text to a DOM element", () => {
        const count = signal(0);

        const element = {
            textContent: ""
        };

        bindText(
            element as unknown as HTMLElement,
            () => `Count: ${count.value}`
        );

        expect(element.textContent).toBe("Count: 0");

        count.value = 5;

        expect(element.textContent).toBe("Count: 5");
    });
});