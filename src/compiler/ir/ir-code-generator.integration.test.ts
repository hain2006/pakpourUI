
import { describe, it, expect, vi } from "vitest";
import { IRCodeGenerator } from "./ir-code-generator";

import {
    signal,
    createElement,
    bindText,
    createScope,
    createPageScope
} from "../../runtime";


class MockElement {
    tagName: string;
    textContent = "";
    children: MockElement[] = [];
    style: Record<string, string> = {};
    parent: MockElement | undefined;

    constructor(tagName: string) {
        this.tagName = tagName;
        this.parent = undefined;
    }

    appendChild(child: MockElement) {
        child.parent = this;
        this.children.push(child);
        return child;
    }

    getChild(index: number): MockElement {
        const child = this.children[index];

        if (!child) {
            throw new Error(
                `MockElement child at index ${index} does not exist.`
            );
        }

        return child;
    }

    replaceChildren(...children: MockElement[]) {
        this.children.forEach(child => {
            child.parent = undefined;
        });

        this.children = [];

        children.forEach(child => this.appendChild(child));
    }

    remove() {
        if (!this.parent) return;

        this.parent.children = this.parent.children.filter(
            child => child !== this
        );

        this.parent = undefined;
    }

    private eventListeners = new Map<string, Function>();

    addEventListener(event: string, callback: Function) {
        this.eventListeners.set(event, callback);
    }

    click() {
        this.eventListeners.get("click")?.();
    }
}


describe("pakpourUI IR Generator Integration", () => {

    it("should execute generated code and render DOM elements", () => {

        vi.stubGlobal("document", {
            createElement: (tagName: string) => {
                return new MockElement(tagName);
            }
        });

        try {
            const program = {
                id: "integration_program",
                type: "IRProgram" as const,
                sites: [],
                standalonePages: [
                    {
                        id: "home",
                        type: "IRPage" as const,
                        name: "Home",
                        scope: {
                            id: "home_scope",
                            symbols: []
                        },
                        children: [
                            {
                                id: "heading",
                                type: "IRHeading" as const,
                                level: 1,
                                content: {
                                    segments: [
                                        {
                                            type: "StaticText" as const,
                                            value: "Hello pakpourUI"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            const generator = new IRCodeGenerator();
            const generatedCode = generator.generate(program);

            // Convert generated ES module into an executable function.
            const executableCode = generatedCode
                .replace(/^import .*;\r?\n/m, "")
                .replace(/^export function /gm, "function ");

            const generatedModule = new Function(
                "signal",
                "createElement",
                "bindText",
                "createScope",
                "createPageScope",
                `${executableCode}\nreturn { render, disposePage };`
            )(
                signal,
                createElement,
                bindText,
                createScope,
                createPageScope
            ) as {
                render: (root: MockElement, pageId: string) => void;
                disposePage: (root: MockElement) => void;
            };

            const root = new MockElement("root");

            generatedModule.render(root, "home");

            expect(root.children).toHaveLength(1);
            expect(root.getChild(0).tagName).toBe("h1");
            expect(root.getChild(0).textContent).toBe("Hello pakpourUI");

        } finally {
            vi.unstubAllGlobals();
        }
    });


    it("should update dynamic text when state changes", () => {

        vi.stubGlobal("document", {
            createElement: (tagName: string) => {
                return new MockElement(tagName);
            }
        });

        try {
            const program = {
                id: "dynamic_text_program",
                type: "IRProgram" as const,
                sites: [],
                standalonePages: [
                    {
                        id: "counter",
                        type: "IRPage" as const,
                        name: "Counter",
                        scope: {
                            id: "counter_scope",
                            symbols: []
                        },
                        children: [
                            {
                                id: "count_state",
                                type: "IRState" as const,
                                symbolId: "count_symbol",
                                name: "count",
                                valueType: "number" as const,
                                declarationOrder: 0,
                                initialValue: {
                                    id: "initial_count",
                                    type: "IRNumberLiteral" as const,
                                    value: 10
                                }
                            },
                            {
                                id: "increment_action",
                                type: "IRAction" as const,
                                label: "Increment",
                                commands: [
                                    {
                                        id: "increment_assignment",
                                        type: "IRAssignment" as const,
                                        symbolId: "count_symbol",
                                        name: "count",
                                        value: {
                                            id: "new_count",
                                            type: "IRNumberLiteral" as const,
                                            value: 20
                                        }
                                    }
                                ]
                            },
                            {
                                id: "count_text",
                                type: "IRText" as const,
                                content: {
                                    segments: [
                                        {
                                            type: "StaticText" as const,
                                            value: "Current count: "
                                        },
                                        {
                                            type: "DynamicText" as const,
                                            expression: {
                                                id: "count_identifier",
                                                type: "IRIdentifier" as const,
                                                name: "count",
                                                symbolId: "count_symbol",
                                                valueType: "number" as const
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            const generator = new IRCodeGenerator();
            const generatedCode = generator.generate(program);

            const executableCode = generatedCode
                .replace(/^import .*;\r?\n/m, "")
                .replace(/^export function /gm, "function ");

            const generatedModule = new Function(
                "signal",
                "createElement",
                "bindText",
                "createScope",
                "createPageScope",
                `${executableCode}\nreturn { render, disposePage };`
            )(
                signal,
                createElement,
                bindText,
                createScope,
                createPageScope
            ) as {
                render: (root: MockElement, pageId: string) => void;
                disposePage: (root: MockElement) => void;
            };

            const root = new MockElement("root");

            generatedModule.render(root, "counter");
            expect(root.getChild(0).textContent)
                .toBe("Increment");

            expect(root.getChild(1).textContent)
                .toBe("Current count: 10");

            // Click the increment button.
            root.getChild(0).click();

            expect(root.getChild(1).textContent)
                .toBe("Current count: 20");

            // Find the generated state signal through the runtime.
            // The state update will be tested through a generated action later.

        } finally {
            vi.unstubAllGlobals();
        }
    });


    it("should update conditional rendering when state changes", () => {

        vi.stubGlobal("document", {
            createElement: (tagName: string) => {
                return new MockElement(tagName);
            }
        });

        try {
            const program = {
                id: "condition_program",
                type: "IRProgram" as const,
                sites: [],
                standalonePages: [
                    {
                        id: "home",
                        type: "IRPage" as const,
                        name: "Home",
                        scope: {
                            id: "home_scope",
                            symbols: []
                        },
                        children: [
                            {
                                id: "enabled_state",
                                type: "IRState" as const,
                                symbolId: "enabled_symbol",
                                name: "enabled",
                                valueType: "boolean" as const,
                                declarationOrder: 0,
                                initialValue: {
                                    id: "initial_enabled",
                                    type: "IRBooleanLiteral" as const,
                                    value: false
                                }
                            },
                            {
                                id: "toggle_action",
                                type: "IRAction" as const,
                                label: "Enable",
                                commands: [
                                    {
                                        id: "enable_assignment",
                                        type: "IRAssignment" as const,
                                        symbolId: "enabled_symbol",
                                        name: "enabled",
                                        value: {
                                            id: "true_value",
                                            type: "IRBooleanLiteral" as const,
                                            value: true
                                        }
                                    }
                                ]
                            },
                            {
                                id: "disable_action",
                                type: "IRAction" as const,
                                label: "Disable",
                                commands: [
                                    {
                                        id: "disable_assignment",
                                        type: "IRAssignment" as const,
                                        symbolId: "enabled_symbol",
                                        name: "enabled",
                                        value: {
                                            id: "false_value",
                                            type: "IRBooleanLiteral" as const,
                                            value: false
                                        }
                                    }
                                ]
                            },
                            {
                                id: "condition",
                                type: "IRCondition" as const,
                                expression: {
                                    id: "enabled_identifier",
                                    type: "IRIdentifier" as const,
                                    name: "enabled",
                                    symbolId: "enabled_symbol",
                                    valueType: "boolean" as const
                                },
                                children: [
                                    {
                                        id: "heading",
                                        type: "IRHeading" as const,
                                        level: 1,
                                        content: {
                                            segments: [
                                                {
                                                    type: "StaticText" as const,
                                                    value: "Visible Content"
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            const generator = new IRCodeGenerator();
            const generatedCode = generator.generate(program);

            const executableCode = generatedCode
                .replace(/^import .*;\r?\n/m, "")
                .replace(/^export function /gm, "function ");

            const generatedModule = new Function(
                "signal",
                "createElement",
                "bindText",
                "createScope",
                "createPageScope",
                `${executableCode}\nreturn { render, disposePage };`
            )(
                signal,
                createElement,
                bindText,
                createScope,
                createPageScope
            ) as {
                render: (root: MockElement, pageId: string) => void;
                disposePage: (root: MockElement) => void;
            };

            const root = new MockElement("root");

            generatedModule.render(root, "home");

            // Initially, the condition is false.
            expect(root.children).toHaveLength(3);

            const enableButton = root.getChild(0);
            const disableButton = root.getChild(1);
            const scopeElement = root.children[2];
            if (!scopeElement) {
                throw new Error("Scope element was not created.");
            }

            expect(enableButton.textContent).toBe("Enable");
            expect(disableButton.textContent).toBe("Disable");
            expect(scopeElement.tagName).toBe("div");
            expect(scopeElement.children).toHaveLength(0);

            // Enable the condition.
            enableButton.click();

            expect(scopeElement.children).toHaveLength(1);
            expect(scopeElement.getChild(0).textContent)
                .toBe("Visible Content");

            // Disable the condition.
            disableButton.click();

            expect(scopeElement.children).toHaveLength(0);

        } finally {
            vi.unstubAllGlobals();
        }
    });

    it("should clean up previous page effects when rendering a new page", () => {
        vi.stubGlobal("document", {
            createElement: (tagName: string) => {
                return new MockElement(tagName);
            }
        });

        try {
            const program = {
                id: "page_replacement_program",
                type: "IRProgram" as const,
                sites: [],
                standalonePages: [
                    {
                        id: "home",
                        type: "IRPage" as const,
                        name: "Home",
                        scope: { id: "home_scope", symbols: [] },
                        children: [
                            {
                                id: "count_state",
                                type: "IRState" as const,
                                symbolId: "count_symbol",
                                name: "count",
                                valueType: "number" as const,
                                declarationOrder: 0,
                                initialValue: {
                                    id: "initial_count",
                                    type: "IRNumberLiteral" as const,
                                    value: 10
                                }
                            },
                            {
                                id: "increment_action",
                                type: "IRAction" as const,
                                label: "Increment",
                                commands: [
                                    {
                                        id: "increment_assignment",
                                        type: "IRAssignment" as const,
                                        symbolId: "count_symbol",
                                        name: "count",
                                        value: {
                                            id: "new_count",
                                            type: "IRNumberLiteral" as const,
                                            value: 20
                                        }
                                    }
                                ]
                            },
                            {
                                id: "count_text",
                                type: "IRText" as const,
                                content: {
                                    segments: [
                                        {
                                            type: "StaticText" as const,
                                            value: "Count: "
                                        },
                                        {
                                            type: "DynamicText" as const,
                                            expression: {
                                                id: "count_identifier",
                                                type: "IRIdentifier" as const,
                                                name: "count",
                                                symbolId: "count_symbol",
                                                valueType: "number" as const
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        id: "about",
                        type: "IRPage" as const,
                        name: "About",
                        scope: { id: "about_scope", symbols: [] },
                        children: [
                            {
                                id: "about_heading",
                                type: "IRHeading" as const,
                                level: 1,
                                content: {
                                    segments: [
                                        {
                                            type: "StaticText" as const,
                                            value: "About Page"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            const generator = new IRCodeGenerator();
            const generatedCode = generator.generate(program);

            const executableCode = generatedCode
                .replace(/^import .*;\r?\n/m, "")
                .replace(/^export function /gm, "function ");

            const generatedModule = new Function(
                "signal",
                "createElement",
                "bindText",
                "createScope",
                "createPageScope",
                `${executableCode}\nreturn { render, disposePage };`
            )(
                signal,
                createElement,
                bindText,
                createScope,
                createPageScope
            ) as {
                render: (root: MockElement, pageId: string) => void;
                disposePage: (root: MockElement) => void;
            };

            const root = new MockElement("root");

            generatedModule.render(root, "home");

            expect(root.children).toHaveLength(2);
            expect(root.getChild(0).textContent).toBe("Increment");
            expect(root.getChild(1).textContent).toBe("Count: 10");

            // Keep references to the old page elements.
            const oldButton = root.getChild(0);
            const oldText = root.getChild(1);

            // Replace Home with About.
            generatedModule.render(root, "about");

            expect(root.children).toHaveLength(1);
            expect(root.getChild(0).tagName).toBe("h1");
            expect(root.getChild(0).textContent).toBe("About Page");

            // Trigger an action from the detached old page.
            oldButton.click();

            // The old page effect must remain stopped.
            expect(oldText.textContent).toBe("Count: 10");

            // The new page must remain unchanged.
            expect(root.getChild(0).textContent).toBe("About Page");

        } finally {
            vi.unstubAllGlobals();
        }

    });
    it("should clean up all effects when disposing a page", () => {
        vi.stubGlobal("document", {
            createElement: (tagName: string) => {
                return new MockElement(tagName);
            }
        });

        try {
            const program = {
                id: "dispose_program",
                type: "IRProgram" as const,
                sites: [],
                standalonePages: [
                    {
                        id: "home",
                        type: "IRPage" as const,
                        name: "Home",
                        scope: { id: "home_scope", symbols: [] },
                        children: [
                            {
                                id: "count_state",
                                type: "IRState" as const,
                                symbolId: "count_symbol",
                                name: "count",
                                valueType: "number" as const,
                                declarationOrder: 0,
                                initialValue: {
                                    id: "initial_count",
                                    type: "IRNumberLiteral" as const,
                                    value: 10
                                }
                            },
                            {
                                id: "increment_action",
                                type: "IRAction" as const,
                                label: "Increment",
                                commands: [
                                    {
                                        id: "increment_assignment",
                                        type: "IRAssignment" as const,
                                        symbolId: "count_symbol",
                                        name: "count",
                                        value: {
                                            id: "new_count",
                                            type: "IRNumberLiteral" as const,
                                            value: 20
                                        }
                                    }
                                ]
                            },
                            {
                                id: "count_text",
                                type: "IRText" as const,
                                content: {
                                    segments: [
                                        {
                                            type: "StaticText" as const,
                                            value: "Count: "
                                        },
                                        {
                                            type: "DynamicText" as const,
                                            expression: {
                                                id: "count_identifier",
                                                type: "IRIdentifier" as const,
                                                name: "count",
                                                symbolId: "count_symbol",
                                                valueType: "number" as const
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            const generator = new IRCodeGenerator();
            const generatedCode = generator.generate(program);

            const executableCode = generatedCode
                .replace(/^import .*;\r?\n/m, "")
                .replace(/^export function /gm, "function ");

            const generatedModule = new Function(
                "signal",
                "createElement",
                "bindText",
                "createScope",
                "createPageScope",
                `${executableCode}\nreturn { render, disposePage };`
            )(
                signal,
                createElement,
                bindText,
                createScope,
                createPageScope
            ) as {
                render: (root: MockElement, pageId: string) => void;
                disposePage: (root: MockElement) => void;
            };

            const root = new MockElement("root");

            generatedModule.render(root, "home");

            expect(root.children).toHaveLength(2);
            expect(root.getChild(1).textContent).toBe("Count: 10");

            // Keep references to the page elements.
            const oldButton = root.getChild(0);
            const oldText = root.getChild(1);

            // Dispose the page.
            generatedModule.disposePage(root);

            expect(root.children).toHaveLength(0);

            // Trigger an action from the disposed page.
            oldButton.click();

            // The disposed effect must not update the old DOM.
            expect(oldText.textContent).toBe("Count: 10");

        } finally {
            vi.unstubAllGlobals();
        }

    });



});
