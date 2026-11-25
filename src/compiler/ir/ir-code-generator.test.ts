
import { describe, it, expect } from "vitest";
import { IRCodeGenerator } from "./ir-code-generator";
import type {
    IRProgram
} from "./ir";

describe("pakpourUI IR Code Generator", () => {

    it("should generate JavaScript module", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_1",
            type: "IRProgram",
            sites: [],
            standalonePages: [
            ]
        });

        expect(output).toContain(
            'import { signal, createElement, bindText, createScope, createPageScope } from "./runtime.js";'
        );

        expect(output).toContain("export function render(root, pageId)");
    });


    it("should generate state declarations", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_2",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_1",
                    type: "IRPage",
                    name: "Counter",
                    scope: {
                        id: "scope_1",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_1",
                            type: "IRState",
                            symbolId: "symbol_1",
                            name: "count",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "number_1",
                                type: "IRNumberLiteral",
                                value: 0
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            "const state0 = signal(0);"
        );
    });


    it("should generate independent state variables for different pages", () => {
        const generator = new IRCodeGenerator();

        const createPage = (id: string, symbolId: string) => ({
            id,
            type: "IRPage" as const,
            name: id,
            scope: {
                id: `scope_${id}`,
                symbols: []
            },
            children: [
                {
                    id: `state_${id}`,
                    type: "IRState" as const,
                    symbolId,
                    name: "count",
                    valueType: "number" as const,
                    declarationOrder: 0,
                    initialValue: {
                        id: `number_${id}`,
                        type: "IRNumberLiteral" as const,
                        value: 0
                    }
                }
            ]
        });

        const output = generator.generate({
            id: "program_3",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                createPage("page1", "symbol1"),
                createPage("page2", "symbol2")
            ]
        });

        expect(output).toContain("const state0 = signal(0);");
        expect(output).toContain("const state1 = signal(0);");
    });


    it("should generate binary expressions in state initialization", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_4",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_4",
                    type: "IRPage",
                    name: "Calculator",
                    scope: {
                        id: "scope_4",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_4",
                            type: "IRState",
                            symbolId: "symbol_4",
                            name: "total",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "binary_1",
                                type: "IRBinaryExpression",
                                operator: "+",
                                valueType: "number",
                                left: {
                                    id: "number_1",
                                    type: "IRNumberLiteral",
                                    value: 10
                                },
                                right: {
                                    id: "number_2",
                                    type: "IRNumberLiteral",
                                    value: 20
                                }
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            "const state0 = signal((10 + 20));"
        );
    });

    it("should resolve state identifiers by symbol ID", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_5",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_5",
                    type: "IRPage",
                    name: "Counter",
                    scope: {
                        id: "scope_5",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_count",
                            type: "IRState",
                            symbolId: "symbol_count",
                            name: "count",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "number_1",
                                type: "IRNumberLiteral",
                                value: 10
                            }
                        },
                        {
                            id: "state_total",
                            type: "IRState",
                            symbolId: "symbol_total",
                            name: "total",
                            valueType: "number",
                            declarationOrder: 1,
                            initialValue: {
                                id: "binary_1",
                                type: "IRBinaryExpression",
                                operator: "+",
                                valueType: "number",
                                left: {
                                    id: "identifier_1",
                                    type: "IRIdentifier",
                                    name: "count",
                                    symbolId: "symbol_count",
                                    valueType: "number"
                                },
                                right: {
                                    id: "number_2",
                                    type: "IRNumberLiteral",
                                    value: 5
                                }
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain("const state0 = signal(10);");
        expect(output).toContain(
            "const state1 = signal((state0.value + 5));"
        );
    });

    it("should generate reactive conditional rendering based on state", () => {
        const program: IRProgram = {
            id: "program_reactive_condition",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_reactive_condition",
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_reactive_condition",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_enabled",
                            type: "IRState",
                            symbolId: "symbol_enabled",
                            name: "enabled",
                            valueType: "boolean",
                            declarationOrder: 0,
                            initialValue: {
                                id: "boolean_false",
                                type: "IRBooleanLiteral",
                                value: false
                            }
                        },
                        {
                            id: "condition_enabled",
                            type: "IRCondition",
                            expression: {
                                id: "identifier_enabled",
                                type: "IRIdentifier",
                                name: "enabled",
                                symbolId: "symbol_enabled",
                                valueType: "boolean"
                            },
                            children: [
                                {
                                    id: "heading_visible",
                                    type: "IRHeading",
                                    level: 1,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
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
        const output = generator.generate(program);

        expect(output).toContain(
            "const state0 = signal(false);"
        );

        expect(output).toContain(
            "createScope(root, scopeElement0 => {"
        );

        expect(output).toContain(
            "if (state0.value) {"
        );

        expect(output).toContain(
            'createElement("h1")'
        );

        expect(output).toContain(
            "scopeElement0.appendChild"
        );

        expect(output).toContain(
            "Visible Content"
        );
    });

    it("should generate unary expressions", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_6",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_6",
                    type: "IRPage",
                    name: "UnaryTest",
                    scope: {
                        id: "scope_6",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_6",
                            type: "IRState",
                            symbolId: "symbol_6",
                            name: "negative",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "unary_1",
                                type: "IRUnaryExpression",
                                operator: "-",
                                valueType: "number",
                                argument: {
                                    id: "number_1",
                                    type: "IRNumberLiteral",
                                    value: 10
                                }
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            "const state0 = signal((-10));"
        );
    });


    it("should generate dynamic text expressions", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_7",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_7",
                    type: "IRPage",
                    name: "TextTest",
                    scope: {
                        id: "scope_7",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_7",
                            type: "IRState",
                            symbolId: "symbol_7",
                            name: "count",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "number_7",
                                type: "IRNumberLiteral",
                                value: 10
                            }
                        },
                        {
                            id: "text_7",
                            type: "IRText",
                            content: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Current count: "
                                    },
                                    {
                                        type: "DynamicText",
                                        expression: {
                                            id: "identifier_7",
                                            type: "IRIdentifier",
                                            name: "count",
                                            symbolId: "symbol_7",
                                            valueType: "number"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            "() => `Current count: ${state0.value}`"
        );
        expect(output).toContain(
            'const text0 = createElement("span");'
        );

        expect(output).toContain(
            'bindText(text0, () => `Current count: ${state0.value}`);'
        );
    });

    it("should generate independent render functions for different pages", () => {
        const generator = new IRCodeGenerator();

        const createPage = (id: string, name: string) => ({
            id,
            type: "IRPage" as const,
            name,
            scope: {
                id: `scope_${id}`,
                symbols: []
            },
            children: []
        });

        const output = generator.generate({
            id: "program_pages",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                createPage("page1", "Home"),
                createPage("page2", "About")
            ]
        });

        expect(output).toContain(
            "export function renderPage0(root) {"
        );

        expect(output).toContain(
            "export function renderPage1(root) {"
        );

        expect(output).toContain(
            "renderPage0(root);"
        );
    });

    it("should generate page selection by page ID", () => {
        const generator = new IRCodeGenerator();

        const createPage = (id: string, name: string) => ({
            id,
            type: "IRPage" as const,
            name,
            scope: {
                id: `scope_${id}`,
                symbols: []
            },
            children: []
        });

        const output = generator.generate({
            id: "program_pages",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                createPage("page1", "Home"),
                createPage("page2", "About")
            ]
        });

        expect(output).toContain(
            "export function render(root, pageId)"
        );

        expect(output).toContain(
            'case "page1":'
        );

        expect(output).toContain(
            "renderPage0(root);"
        );

        expect(output).toContain(
            'case "page2":'
        );

        expect(output).toContain(
            "renderPage1(root);"
        );

        expect(output).toContain(
            "throw new Error(`Unknown page: ${pageId}`);"
        );
    });

    it("should clear root before rendering selected page", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_clear",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_home",
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_home",
                        symbols: []
                    },
                    children: []
                }
            ]
        });

        expect(output).toContain(
            "pageScope.render(() => {"
        );
    });

    it("should generate heading elements", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_heading",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_heading",
                    type: "IRPage",
                    name: "HeadingTest",
                    scope: {
                        id: "scope_heading",
                        symbols: []
                    },
                    children: [
                        {
                            id: "heading_1",
                            type: "IRHeading",
                            level: 1,
                            content: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Hello World"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'createElement("h1")'
        );

        expect(output).toContain(
            'bindText(element0, () => `Hello World`);'
        );

        expect(output).toContain(
            "root.appendChild(element0);"
        );
    });

    it("should generate paragraph elements", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_paragraph",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_paragraph",
                    type: "IRPage",
                    name: "ParagraphTest",
                    scope: {
                        id: "scope_paragraph",
                        symbols: []
                    },
                    children: [
                        {
                            id: "paragraph_1",
                            type: "IRParagraph",
                            content: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "This is a paragraph."
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'createElement("p")'
        );

        expect(output).toContain(
            'bindText(element0, () => `This is a paragraph.`);'
        );

        expect(output).toContain(
            "root.appendChild(element0);"
        );
    });

    it("should generate vertical layout with child elements", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_layout",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_layout",
                    type: "IRPage",
                    name: "LayoutTest",
                    scope: {
                        id: "scope_layout",
                        symbols: []
                    },
                    children: [
                        {
                            id: "layout_1",
                            type: "IRLayout",
                            direction: "vertical",
                            children: [
                                {
                                    id: "heading_1",
                                    type: "IRHeading",
                                    level: 1,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Welcome"
                                            }
                                        ]
                                    }
                                },
                                {
                                    id: "paragraph_1",
                                    type: "IRParagraph",
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Hello pakpourUI"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'const element0 = createElement("div");'
        );

        expect(output).toContain(
            'element0.style.flexDirection = "column";'
        );

        expect(output).toContain(
            'element1 = createElement("h1")'
        );

        expect(output).toContain(
            'element2 = createElement("p")'
        );

        expect(output).toContain(
            "element0.appendChild(element1);"
        );

        expect(output).toContain(
            "element0.appendChild(element2);"
        );
    });

    it("should generate horizontal layout", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_horizontal",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_horizontal",
                    type: "IRPage",
                    name: "HorizontalTest",
                    scope: {
                        id: "scope_horizontal",
                        symbols: []
                    },
                    children: [
                        {
                            id: "layout_horizontal",
                            type: "IRLayout",
                            direction: "horizontal",
                            children: [
                                {
                                    id: "heading_horizontal",
                                    type: "IRHeading",
                                    level: 2,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "First"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'element0.style.display = "flex";'
        );

        expect(output).toContain(
            'element0.style.flexDirection = "row";'
        );
    });

    it("should generate nested layouts", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_nested",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_nested",
                    type: "IRPage",
                    name: "NestedLayoutTest",
                    scope: {
                        id: "scope_nested",
                        symbols: []
                    },
                    children: [
                        {
                            id: "layout_outer",
                            type: "IRLayout",
                            direction: "vertical",
                            children: [
                                {
                                    id: "layout_inner",
                                    type: "IRLayout",
                                    direction: "horizontal",
                                    children: [
                                        {
                                            id: "heading_nested",
                                            type: "IRHeading",
                                            level: 2,
                                            content: {
                                                segments: [
                                                    {
                                                        type: "StaticText",
                                                        value: "Nested Heading"
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'const element0 = createElement("div");'
        );

        expect(output).toContain(
            'const element1 = createElement("div");'
        );

        expect(output).toContain(
            'element0.style.flexDirection = "column";'
        );

        expect(output).toContain(
            'element1.style.flexDirection = "row";'
        );

        expect(output).toContain(
            "element0.appendChild(element1);"
        );

        expect(output).toContain(
            'createElement("h2")'
        );

        expect(output).toContain(
            "element1.appendChild(element2);"
        );
    });

    it("should generate custom elements", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_element",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_element",
                    type: "IRPage",
                    name: "ElementTest",
                    scope: {
                        id: "scope_element",
                        symbols: []
                    },
                    children: [
                        {
                            id: "element_1",
                            type: "IRElement",
                            name: "section",
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'const element0 = createElement("section");'
        );

        expect(output).toContain(
            "root.appendChild(element0);"
        );
    });

    it("should generate element text and nested children", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_element_children",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_element_children",
                    type: "IRPage",
                    name: "ElementChildrenTest",
                    scope: {
                        id: "scope_element_children",
                        symbols: []
                    },
                    children: [
                        {
                            id: "element_1",
                            type: "IRElement",
                            name: "section",
                            text: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Section content"
                                    }
                                ]
                            },
                            children: [
                                {
                                    id: "paragraph_1",
                                    type: "IRParagraph",
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Nested paragraph"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            'const element0 = createElement("section");'
        );

        expect(output).toContain(
            'bindText(element0, () => `Section content`);'
        );

        expect(output).toContain(
            'const element1 = createElement("p");'
        );

        expect(output).toContain(
            "element0.appendChild(element1);"
        );
    });

    it("should generate state assignments", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_assignment",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_assignment",
                    type: "IRPage",
                    name: "AssignmentTest",
                    scope: {
                        id: "scope_assignment",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state_count",
                            type: "IRState",
                            symbolId: "symbol_count",
                            name: "count",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "number_initial",
                                type: "IRNumberLiteral",
                                value: 10
                            }
                        },
                        {
                            id: "assignment_count",
                            type: "IRAssignment",
                            symbolId: "symbol_count",
                            name: "count",
                            value: {
                                id: "number_new",
                                type: "IRNumberLiteral",
                                value: 20
                            }
                        }
                    ]
                }
            ]
        });

        expect(output).toContain(
            "const state0 = signal(10);"
        );

        expect(output).toContain(
            "state0.value = 20;"
        );
    });

    it("should generate reactive conditional rendering", () => {
        const program: IRProgram = {
            id: "program",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page",
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope",
                        symbols: []
                    },
                    children: [
                        {
                            id: "condition",
                            type: "IRCondition",
                            expression: {
                                id: "expression",
                                type: "IRBooleanLiteral",
                                value: true
                            },
                            children: [
                                {
                                    id: "heading",
                                    type: "IRHeading",
                                    level: 1,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Hello"
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
        const output = generator.generate(program);

        expect(output).toContain("createScope(root, scopeElement");
        expect(output).toContain("if (true) {");
        expect(output).toContain('createElement("h1")');
        expect(output).toContain("scopeElement0.appendChild");
        expect(output).toContain("Hello");
    });

    it("should generate navigation actions", () => {
        const program: IRProgram = {
            id: "program",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page",
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope",
                        symbols: []
                    },
                    children: [
                        {
                            id: "action",
                            type: "IRAction",
                            label: "Go to About",
                            commands: [
                                {
                                    id: "navigate",
                                    type: "IRNavigate",
                                    path: "/about"
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const generator = new IRCodeGenerator();
        const output = generator.generate(program);

        expect(output).toContain('createElement("button")');
        expect(output).toContain('textContent = "Go to About"');
        expect(output).toContain('addEventListener("click"');
        expect(output).toContain('window.location.href = "/about"');
    });

    it("should generate state assignments inside actions", () => {
        const program: IRProgram = {
            id: "program",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page",
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope",
                        symbols: []
                    },
                    children: [
                        {
                            id: "state",
                            type: "IRState",
                            symbolId: "count-symbol",
                            name: "count",
                            valueType: "number",
                            declarationOrder: 0,
                            initialValue: {
                                id: "initial",
                                type: "IRNumberLiteral",
                                value: 0
                            }
                        },
                        {
                            id: "action",
                            type: "IRAction",
                            label: "Increment",
                            commands: [
                                {
                                    id: "assignment",
                                    type: "IRAssignment",
                                    symbolId: "count-symbol",
                                    name: "count",
                                    value: {
                                        id: "value",
                                        type: "IRNumberLiteral",
                                        value: 1
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const generator = new IRCodeGenerator();
        const output = generator.generate(program);

        expect(output).toContain('textContent = "Increment"');
        expect(output).toContain('addEventListener("click"');
        expect(output).toContain("state0.value = 1;");
    });


    it("should create a page scope for each root element", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_page_scope",
            type: "IRProgram",
            sites: [],
            standalonePages: []
        });

        expect(output).toContain(
            "const pageScopes = new WeakMap();"
        );

        expect(output).toContain(
            "pageScopes.get(root)"
        );

        expect(output).toContain(
            "createPageScope(root)"
        );

        expect(output).toContain(
            "pageScopes.set(root, pageScope)"
        );
    });

    it("should render pages inside their page scope", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_scoped_render",
            type: "IRProgram",
            sites: [],
            standalonePages: [
                {
                    id: "page_home",
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_home",
                        symbols: []
                    },
                    children: []
                }
            ]
        });

        expect(output).toContain(
            "pageScope.render(() => {"
        );

        expect(output).toContain(
            "renderPage0(root);"
        );
    });

    it("should generate disposePage to clean up page scope", () => {
        const generator = new IRCodeGenerator();

        const output = generator.generate({
            id: "program_dispose_page",
            type: "IRProgram",
            sites: [],
            standalonePages: []
        });

        expect(output).toContain(
            "export function disposePage(root)"
        );

        expect(output).toContain(
            "pageScopes.get(root)"
        );

        expect(output).toContain(
            "pageScope.dispose()"
        );

        expect(output).toContain(
            "pageScopes.delete(root)"
        );
    });






});
