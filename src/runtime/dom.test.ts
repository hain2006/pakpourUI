
import { describe, it, expect, vi } from "vitest";
import { createElement, bindText, bindChildren } from "./dom";
import { signal } from "./reactive";


class MockElement {
    tagName: string;
    className = "";
    textContent = "";
    style: Record<string, string> = {};
    attributes: Record<string, string> = {};
    children: unknown[] = [];
    events: Record<string, EventListener> = {};
    parentNode: MockElement | null = null;

    constructor(tag: string) {
        this.tagName = tag.toUpperCase();
    }

    setAttribute(name: string, value: string) {
        this.attributes[name] = value;
    }

    appendChild(child: Node) {
        const mockChild = child as unknown as {
            parentNode: MockElement | null;
        };

        mockChild.parentNode = this;
        this.children.push(child);

        return child;
    }

    removeChild(child: Node) {
        const index = this.children.indexOf(child);

        if (index !== -1) {
            this.children.splice(index, 1);

            const mockChild = child as unknown as {
                parentNode: MockElement | null;
            };

            mockChild.parentNode = null;
        }

        return child;
    }

    addEventListener(event: string, handler: EventListener) {
        this.events[event] = handler;
    }
}


function setupMockDocument() {
    const documentMock = {
        createElement: vi.fn((tag: string) => new MockElement(tag)),
        createTextNode: vi.fn((text: string) => ({
            textContent: text
        }))
    };

    vi.stubGlobal("document", documentMock);

    return documentMock;
}

describe("pakpourUI DOM Runtime", () => {

    it("should create a DOM element", () => {
        const documentMock = setupMockDocument();

        const element = createElement("div");

        expect(element).toBeInstanceOf(MockElement);
        expect(documentMock.createElement).toHaveBeenCalledWith("div");

        vi.unstubAllGlobals();
    });

    it("should set element attributes", () => {
        setupMockDocument();

        const element = createElement("input", {
            attributes: {
                type: "text",
                placeholder: "Enter name",
                disabled: true,
                hidden: false
            }
        }) as unknown as MockElement;

        expect(element.attributes).toEqual({
            type: "text",
            placeholder: "Enter name",
            disabled: ""
        });

        vi.unstubAllGlobals();
    });

    it("should set element classes", () => {
        setupMockDocument();

        const element = createElement("div", {
            class: ["container", "active"]
        }) as unknown as MockElement;

        expect(element.className).toBe("container active");

        vi.unstubAllGlobals();
    });

    it("should set element styles", () => {
        setupMockDocument();

        const element = createElement("div", {
            style: {
                color: "red",
                backgroundColor: "blue"
            }
        }) as unknown as MockElement;

        expect(element.style).toEqual({
            color: "red",
            backgroundColor: "blue"
        });

        vi.unstubAllGlobals();
    });

    it("should register event listeners", () => {
        setupMockDocument();

        const handler = vi.fn();

        const element = createElement("button", {
            events: {
                click: handler
            }
        }) as unknown as MockElement;

        expect(element.events.click).toBe(handler);

        vi.unstubAllGlobals();
    });

    it("should append text and element children", () => {
        const documentMock = setupMockDocument();

        const childElement = new MockElement("span");

        const element = createElement("div", {
            children: ["Hello", 123, childElement as unknown as Node]
        }) as unknown as MockElement;

        expect(element.children).toHaveLength(3);
        expect(documentMock.createTextNode).toHaveBeenCalledWith("Hello");
        expect(documentMock.createTextNode).toHaveBeenCalledWith("123");
        expect(element.children[2]).toBe(childElement);

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


    it("should update children when signal changes", () => {
        const count = signal(0);

        const documentMock = setupMockDocument();
        const element = new MockElement("div") as unknown as HTMLElement;

        const stop = bindChildren(element, () => [
            `Count: ${count.value}`
        ]);

        const mockElement = element as unknown as MockElement;

        expect(mockElement.children).toHaveLength(1);
        expect(documentMock.createTextNode)
            .toHaveBeenLastCalledWith("Count: 0");

        count.value = 5;

        expect(mockElement.children).toHaveLength(1);
        expect(documentMock.createTextNode)
            .toHaveBeenLastCalledWith("Count: 5");

        stop();

        expect(mockElement.children).toHaveLength(0);

        vi.unstubAllGlobals();
    });

    it("should preserve static children when updating reactive children", () => {
        const count = signal(0);

        const documentMock = setupMockDocument();
        const element = new MockElement("div");

        const staticChild = new MockElement("span");

        element.appendChild(staticChild as unknown as Node);

        const stop = bindChildren(
            element as unknown as HTMLElement,
            () => [`Count: ${count.value}`]
        );

        expect(element.children).toHaveLength(2);
        expect(element.children[0]).toBe(staticChild);

        count.value = 1;

        expect(element.children).toHaveLength(2);
        expect(element.children[0]).toBe(staticChild);
        expect(documentMock.createTextNode)
            .toHaveBeenLastCalledWith("Count: 1");

        stop();

        expect(element.children).toHaveLength(1);
        expect(element.children[0]).toBe(staticChild);

        vi.unstubAllGlobals();
    });

});
