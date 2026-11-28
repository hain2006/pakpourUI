import { describe, it, expect } from "vitest";
import { HTMLRenderer } from "./html-renderer";
import type { IRProgram } from "../ir/ir";

let testId = 0;

function createTestId(): string {
    return `test_${testId++}`;
}

function addNodeIds(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(addNodeIds);
    }

    if (value === null || typeof value !== "object") {
        return value;
    }

    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(source)) {
        result[key] = addNodeIds(item);
    }

    if (
        typeof result.type === "string" &&
        result.type.startsWith("IR") &&
        typeof result.id !== "string"
    ) {
        result.id = createTestId();
    }

    return result;
}

class TestHTMLRenderer extends HTMLRenderer {
    override render(program: unknown): ReturnType<HTMLRenderer["render"]> {
        const normalized = addNodeIds({
            ...(program as Record<string, unknown>),
            type: "IRProgram"
        }) as IRProgram;

        return super.render(normalized);
    }
}
describe("HTMLRenderer", () => {
    it("should render a complete HTML document", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            id: "program_0",
            sites: [],
            standalonePages: []
        });

        expect(result).toEqual([]);
    });

    it("should render a standalone page with HTML document structure", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    id: createTestId(),
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: []
                }
            ]
        });

        expect(result).toHaveLength(1);
        expect(result[0]!.html).toContain("<!DOCTYPE html>");
        expect(result[0]!.html).toContain('<html lang="en">');
        expect(result[0]!.html).toContain("<title>Home</title>");
        expect(result[0]!.html).toContain("</html>");
    });
    it("should render a heading", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
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
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain("<h1>Welcome</h1>");
    });
    it("should escape HTML in heading text", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRHeading",
                            level: 1,
                            content: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "<script>alert('XSS')</script>"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
        );

        expect(result[0]!.html).not.toContain("<script>");
    });
    it("should render dynamic text from state", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRState",
                            name: "username",
                            symbolId: "symbol_0",
                            valueType: "string",
                            declarationOrder: 0,
                            initialValue: {
                                type: "IRStringLiteral",
                                value: "Hamid"
                            }
                        },
                        {
                            type: "IRHeading",
                            level: 1,
                            content: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Hello "
                                    },
                                    {
                                        type: "DynamicText",
                                        expression: {
                                            type: "IRIdentifier",
                                            name: "username",
                                            symbolId: "symbol_0",
                                            valueType: "string"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain("<h1>Hello Hamid</h1>");
    });
    it("should evaluate binary expressions in dynamic text", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRText",
                            content: {
                                segments: [
                                    {
                                        type: "DynamicText",
                                        expression: {
                                            type: "IRBinaryExpression",
                                            operator: "+",
                                            left: {
                                                type: "IRNumberLiteral",
                                                value: 10
                                            },
                                            right: {
                                                type: "IRNumberLiteral",
                                                value: 5
                                            },
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

        expect(result[0]!.html).toContain("15");
    });
    it("should render condition children when condition is true", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRCondition",
                            expression: {
                                type: "IRBooleanLiteral",
                                value: true
                            },
                            children: [
                                {
                                    type: "IRHeading",
                                    level: 2,
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
        });

        expect(result[0]!.html).toContain(
            "<h2>Visible Content</h2>"
        );
    });
    it("should not render condition children when condition is false", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRCondition",
                            expression: {
                                type: "IRBooleanLiteral",
                                value: false
                            },
                            children: [
                                {
                                    type: "IRHeading",
                                    level: 2,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Hidden Content"
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

        expect(result[0]!.html).not.toContain("Hidden Content");
    });
    it("should render a paragraph", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRParagraph",
                            content: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Welcome to pakpourUI"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "<p>Welcome to pakpourUI</p>"
        );
    });
    it("should render a vertical layout", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRLayout",
                            direction: "vertical",
                            children: [
                                {
                                    type: "IRHeading",
                                    level: 1,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Title"
                                            }
                                        ]
                                    }
                                },
                                {
                                    type: "IRParagraph",
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Description"
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

        expect(result[0]!.html).toContain(
            'style="display: flex; flex-direction: column;"'
        );
        expect(result[0]!.html).toContain("<h1>Title</h1>");
        expect(result[0]!.html).toContain("<p>Description</p>");
    });
    it("should render a horizontal layout", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRLayout",
                            direction: "horizontal",
                            children: [
                                {
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

        expect(result[0]!.html).toContain(
            'style="display: flex; flex-direction: row;"'
        );
        expect(result[0]!.html).toContain("<h2>First</h2>");
    });
    it("should render an action button", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRAction",
                            label: "Submit",
                            commands: []
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            '<button type="button">Submit</button>'
        );
    });
    it("should render an HTML element with children", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "div",
                            text: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Container"
                                    }
                                ]
                            },
                            children: [
                                {
                                    type: "IRParagraph",
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Child content"
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

        expect(result[0]!.html).toContain(
            "<div>Container<p>Child content</p></div>"
        );
    });
    it("should render pages inside a site", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [
                {
                    name: "MyWebsite",
                    pages: [
                        {
                            type: "IRPage",
                            name: "About",
                            scope: {
                                id: "scope_0",
                                symbols: []
                            },
                            children: [
                                {
                                    type: "IRHeading",
                                    level: 1,
                                    content: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "About Us"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            standalonePages: []
        });

        expect(result).toHaveLength(1);
        expect(result[0]!.siteName).toBe("MyWebsite");
        expect(result[0]!.pageName).toBe("About");
        expect(result[0]!.html).toContain("<h1>About Us</h1>");
    });
    it("should escape SEO metadata", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    seo: {
                        title: "<script>alert(1)</script>",
                        description: "<b>Unsafe description</b>"
                    },
                    children: []
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "<title>&lt;script&gt;alert(1)&lt;/script&gt;</title>"
        );

        expect(result[0]!.html).toContain(
            'content="&lt;b&gt;Unsafe description&lt;/b&gt;"'
        );

        expect(result[0]!.html).not.toContain("<script>");
    });
    it("should render noindex robots meta when SEO index is false", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Private",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    seo: {
                        index: false
                    },
                    children: []
                }
            ]
        });

        expect(result[0]!.html).toContain(
            '<meta name="robots" content="noindex">'
        );
    });
    it("should escape canonical URL", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    seo: {
                        canonical: 'https://example.com/?a="test"&b=1'
                    },
                    children: []
                }
            ]
        });

        expect(result[0]!.html).toContain(
            'href="https://example.com/?a=&quot;test&quot;&amp;b=1"'
        );
    });
    it("should render HTML elements inside a layout", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRLayout",
                            direction: "vertical",
                            children: [
                                {
                                    type: "IRElement",
                                    name: "div",
                                    text: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Hello"
                                            }
                                        ]
                                    },
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "<div>Hello</div>"
        );
    });
    it("should render nested layouts", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRLayout",
                            direction: "vertical",
                            children: [
                                {
                                    type: "IRLayout",
                                    direction: "horizontal",
                                    children: [
                                        {
                                            type: "IRHeading",
                                            level: 1,
                                            content: {
                                                segments: [
                                                    {
                                                        type: "StaticText",
                                                        value: "Nested Layout"
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

        expect(result[0]!.html).toContain(
            '<div style="display: flex; flex-direction: column;">'
        );

        expect(result[0]!.html).toContain(
            '<div style="display: flex; flex-direction: row;">'
        );

        expect(result[0]!.html).toContain(
            "<h1>Nested Layout</h1>"
        );
    });
    it("should render nested HTML elements", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "div",
                            children: [
                                {
                                    type: "IRElement",
                                    name: "span",
                                    text: {
                                        segments: [
                                            {
                                                type: "StaticText",
                                                value: "Nested"
                                            }
                                        ]
                                    },
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "<div><span>Nested</span></div>"
        );
    });
    it("should escape HTML inside element text", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "div",
                            text: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "<script>alert('XSS')</script>"
                                    }
                                ]
                            },
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "<div>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>"
        );

        expect(result[0]!.html).not.toContain("<script>");
    });
    it("should render void elements without closing tags", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "br",
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain("<br>");
        expect(result[0]!.html).not.toContain("</br>");
    });
    it("should render img and input as void elements", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "img",
                            children: []
                        },
                        {
                            type: "IRElement",
                            name: "input",
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain("<img>");
        expect(result[0]!.html).toContain("<input>");
        expect(result[0]!.html).not.toContain("</img>");
        expect(result[0]!.html).not.toContain("</input>");
    });
    it("should reject invalid HTML tag names", () => {
        const renderer = new TestHTMLRenderer();

        expect(() => {
            renderer.render({
                sites: [],
                standalonePages: [
                    {
                        type: "IRPage",
                        name: "Home",
                        scope: {
                            id: "scope_0",
                            symbols: []
                        },
                        children: [
                            {
                                type: "IRElement",
                                name: "div><script",
                                children: []
                            }
                        ]
                    }
                ]
            });
        }).toThrow("Invalid HTML tag name: div><script");
    });
    it("should render custom HTML elements", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "my-component",
                            text: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Custom Content"
                                    }
                                ]
                            },
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain(
            "<my-component>Custom Content</my-component>"
        );
    });
    it("should normalize HTML tag names to lowercase", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            sites: [],
            standalonePages: [
                {
                    type: "IRPage",
                    name: "Home",
                    scope: {
                        id: "scope_0",
                        symbols: []
                    },
                    children: [
                        {
                            type: "IRElement",
                            name: "DIV",
                            text: {
                                segments: [
                                    {
                                        type: "StaticText",
                                        value: "Hello"
                                    }
                                ]
                            },
                            children: []
                        }
                    ]
                }
            ]
        });

        expect(result[0]!.html).toContain("<div>Hello</div>");
        expect(result[0]!.html).not.toContain("<DIV>");
    });
    it("should render static HTML attributes", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            standalonePages: [
                {
                    id: createTestId(),
                    name: "Home",
                    children: [
                        {
                            id: createTestId(),
                            type: "IRElement",
                            name: "a",
                            attributes: [
                                {
                                    name: "href",
                                    value: {
                                        type: "StaticAttributeValue",
                                        value: "/about"
                                    }
                                },
                                {
                                    name: "class",
                                    value: {
                                        type: "StaticAttributeValue",
                                        value: "link"
                                    }
                                }
                            ],
                            children: []
                        }
                    ]
                }
            ],
            sites: []
        });

        expect(result[0]!.html).toContain(
            '<a href="/about" class="link"></a>'
        );
    });

    it("should escape HTML in attribute values", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            standalonePages: [
                {
                    id: createTestId(),
                    name: "Home",
                    children: [
                        {
                            id: createTestId(),
                            type: "IRElement",
                            name: "div",
                            attributes: [
                                {
                                    name: "title",
                                    value: {
                                        type: "StaticAttributeValue",
                                        value: '"Hello" & World'
                                    }
                                }
                            ],
                            children: []
                        }
                    ]
                }
            ],
            sites: []
        });

        expect(result[0]!.html).toContain(
            'title="&quot;Hello&quot; &amp; World"'
        );
    });

    it("should render boolean HTML attributes", () => {
        const renderer = new TestHTMLRenderer();

        const result = renderer.render({
            standalonePages: [
                {
                    id: createTestId(),
                    name: "Home",
                    children: [
                        {
                            id: createTestId(),
                            type: "IRElement",
                            name: "input",
                            attributes: [
                                {
                                    name: "disabled",
                                    value: {
                                        type: "StaticAttributeValue",
                                        value: ""
                                    }
                                }
                            ],
                            children: []
                        }
                    ]
                }
            ],
            sites: []
        });

        expect(result[0]!.html).toContain("<input disabled>");
    });
});