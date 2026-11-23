
import { describe, it, expect } from "vitest";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

describe("pakpourUI Parser", () => {

    it("should parse a site with one page", () => {
        const source = `
            site "Darbastan" {
                page "Home" {}
            }
        `;

        const tokens = new Lexer(source).tokenize();
        const ast = new Parser(tokens).parse();

        expect(ast.type).toBe("Program");
        expect(ast.body).toHaveLength(1);

        const site = ast.body[0]!;

        expect(site.type).toBe("Site");

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        expect(site.name).toBe("Darbastan");
        expect(site.pages).toHaveLength(1);
        expect(site.pages[0]!.name).toBe("Home");
    });

    it("should parse SEO properties", () => {
        const source = `
            site "Darbastan" {
                page "Home" {
                    seo {
                        title "Darbastan"
                        description "Scaffolding services"
                        canonical "/"
                        index true
                    }
                }
            }
        `;

        const ast = new Parser(
            new Lexer(source).tokenize()
        ).parse();

        const site = ast.body[0]!;

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        const page = site.pages[0]!;
        const seo = page.children.find(
            child => child.type === "Seo"
        );

        expect(seo).toBeDefined();
        expect(seo).toEqual({
            type: "Seo",
            title: "Darbastan",
            description: "Scaffolding services",
            canonical: "/",
            index: true
        });
    });

    it("should parse vertical layout", () => {
        const source = `
            site "Demo" {
                page "Home" {
                    layout vertical {
                        heading 1 "Hello"
                        paragraph "Welcome"
                    }
                }
            }
        `;

        const ast = new Parser(
            new Lexer(source).tokenize()
        ).parse();

        const site = ast.body[0]!;

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        const layout = site.pages[0]!.children.find(
            child => child.type === "Layout"
        );

        expect(layout).toBeDefined();

        if (layout?.type !== "Layout") {
            throw new Error("Expected LayoutNode");
        }

        expect(layout.direction).toBe("vertical");
        expect(layout.children).toHaveLength(2);
        expect(layout.children[0]!.type).toBe("Heading");
        expect(layout.children[1]!.type).toBe("Paragraph");
    });


    it("should parse state declarations", () => {
        const source = `
            site "Demo" {
                page "Counter" {
                    state count = 0
                }
            }
        `;

        const ast = new Parser(
            new Lexer(source).tokenize()
        ).parse();

        const site = ast.body[0]!;

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        const state = site.pages[0]!.children.find(
            child => child.type === "State"
        );

        expect(state).toEqual({
            type: "State",
            name: "count",
            value: {
                type: "NumberLiteral",
                value: 0
            }
        });
    });

    it("should parse action with navigate command", () => {
        const source = `
            site "Demo" {
                page "Home" {
                    layout vertical {
                        action "Open Scaffolders" {
                            navigate "/scaffolders"
                        }
                    }
                }
            }
        `;

        const ast = new Parser(
            new Lexer(source).tokenize()
        ).parse();

        const site = ast.body[0]!;

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        const layout = site.pages[0]!.children.find(
            child => child.type === "Layout"
        );

        if (layout?.type !== "Layout") {
            throw new Error("Expected LayoutNode");
        }

        const action = layout.children[0]!;

        expect(action).toEqual({
            type: "Action",
            label: "Open Scaffolders",
            children: [
                {
                    type: "Navigate",
                    path: "/scaffolders"
                }
            ]
        });
    });

    it("should parse when conditional blocks", () => {
        const source = `
            site "Demo" {
                page "Counter" {
                    layout vertical {
                        when count >= 10 {
                            text "You reached 10!"
                        }
                    }
                }
            }
        `;

        const ast = new Parser(
            new Lexer(source).tokenize()
        ).parse();

        const site = ast.body[0]!;

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        const layout = site.pages[0]!.children.find(
            child => child.type === "Layout"
        );

        if (layout?.type !== "Layout") {
            throw new Error("Expected LayoutNode");
        }

        const condition = layout.children[0]!;

        expect(condition.type).toBe("When");

        if (condition.type !== "When") {
            throw new Error("Expected WhenNode");
        }

        expect(condition.condition).toEqual({
            type: "BinaryExpression",
            operator: ">=",
            left: {
                type: "Identifier",
                name: "count"
            },
            right: {
                type: "NumberLiteral",
                value: 10
            }
        });

        expect(condition.children[0]!.type).toBe("Text");
    });

    it("should parse arithmetic expressions with precedence", () => {
        const source = `
            site "Demo" {
                page "Counter" {
                    state result = 2 + 3 * 4
                }
            }
        `;

        const ast = new Parser(
            new Lexer(source).tokenize()
        ).parse();

        const site = ast.body[0]!;

        if (site.type !== "Site") {
            throw new Error("Expected SiteNode");
        }

        const state = site.pages[0]!.children.find(
            child => child.type === "State"
        );

        expect(state).toBeDefined();

        if (state?.type !== "State") {
            throw new Error("Expected StateNode");
        }

        expect(state.value).toEqual({
            type: "BinaryExpression",
            operator: "+",
            left: {
                type: "NumberLiteral",
                value: 2
            },
            right: {
                type: "BinaryExpression",
                operator: "*",
                left: {
                    type: "NumberLiteral",
                    value: 3
                },
                right: {
                    type: "NumberLiteral",
                    value: 4
                }
            }
        });
    });


});
