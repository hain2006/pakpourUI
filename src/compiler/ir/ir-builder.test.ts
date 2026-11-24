
import { describe, it, expect } from "vitest";
import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { SemanticAnalyzer } from "../semantic";
import { IRBuilder } from "./ir-builder";

function getAt<T>(
    items: readonly T[],
    index: number
): T {
    const item = items[index];

    if (item === undefined) {
        throw new Error(`Expected item at index ${index}`);
    }

    return item;
}

function getByType<
    T extends { type: string },
    K extends T["type"]
>(
    items: readonly T[],
    type: K
): Extract<T, { type: K }> {
    const item = items.find(
        (node): node is Extract<T, { type: K }> =>
            node.type === type
    );

    if (!item) {
        throw new Error(`Expected node with type ${type}`);
    }

    return item;
}

describe("pakpourUI IR Builder", () => {

    function buildIR(source: string) {
        const tokens = new Lexer(source).tokenize();
        const ast = new Parser(tokens).parse();

        const analyzer = new SemanticAnalyzer();
        const diagnostics = analyzer.analyze(ast);

        expect(diagnostics.hasErrors).toBe(false);

        const builder = new IRBuilder(
            analyzer.getSemanticModel()
        );

        return builder.build(ast);
    }

    it("should build an IR program", () => {
        const ir = buildIR(`
            site "Demo" {
                page "Home" {
                    layout vertical {
                        heading 1 "Hello"
                    }
                }
            }
        `);

        expect(ir.type).toBe("IRProgram");
        expect(ir.sites).toHaveLength(1);
        expect(getAt(ir.sites, 0).name).toBe("Demo");
    });

    it("should build layout and heading nodes", () => {
        const ir = buildIR(`
            site "Demo" {
                page "Home" {
                    layout vertical {
                        heading 1 "Hello World"
                    }
                }
            }
        `);

        const page = getAt(getAt(ir.sites, 0).pages, 0);

        expect(page.children).toHaveLength(1);

        const layout = getByType(page.children, "IRLayout");

        expect(layout.direction).toBe("vertical");
        expect(layout.children).toHaveLength(1);

        const heading = getByType(layout.children, "IRHeading");

        expect(heading.level).toBe(1);
        expect(getAt(heading.content.segments, 0)).toEqual({
            type: "StaticText",
            value: "Hello World"
        });
    });

    it("should bind dynamic text to its state symbol", () => {
        const ir = buildIR(`
            site "Demo" {
                page "Counter" {
                    state count = 10

                    layout vertical {
                        text "Current value: {count}"
                    }
                }
            }
        `);

        const page = getAt(getAt(ir.sites, 0).pages, 0);

        expect(page.scope.symbols).toHaveLength(1);

        const symbol = getAt(page.scope.symbols, 0);

        expect(symbol.name).toBe("count");
        expect(symbol.valueType).toBe("number");

        const layout = getByType(page.children, "IRLayout");
        const text = getByType(layout.children, "IRText");

        expect(text.content.segments).toHaveLength(2);

        expect(getAt(text.content.segments, 0)).toEqual({
            type: "StaticText",
            value: "Current value: "
        });

        const dynamicSegment = getAt(text.content.segments, 1);

        expect(dynamicSegment.type).toBe("DynamicText");

        if (dynamicSegment.type !== "DynamicText") {
            throw new Error("Expected DynamicText");
        }

        expect(dynamicSegment.expression.type).toBe("IRIdentifier");

        if (dynamicSegment.expression.type !== "IRIdentifier") {
            throw new Error("Expected IRIdentifier");
        }

        expect(dynamicSegment.expression.name).toBe("count");
        expect(dynamicSegment.expression.symbolId).toBe(symbol.id);
        expect(dynamicSegment.expression.valueType).toBe("number");
    });

    it("should build conditions and binary expressions", () => {
        const ir = buildIR(`
            site "Demo" {
                page "Counter" {
                    state count = 10

                    layout vertical {
                        when count >= 10 {
                            text "You reached 10!"
                        }
                    }
                }
            }
        `);

        const page = getAt(getAt(ir.sites, 0).pages, 0);
        const layout = getByType(page.children, "IRLayout");
        const condition = getByType(layout.children, "IRCondition");

        expect(condition.expression.type).toBe("IRBinaryExpression");

        if (condition.expression.type !== "IRBinaryExpression") {
            throw new Error("Expected IRBinaryExpression");
        }

        expect(condition.expression.operator).toBe(">=");
        expect(condition.expression.valueType).toBe("boolean");

        expect(condition.expression.left.type).toBe("IRIdentifier");
        expect(condition.expression.right.type).toBe("IRNumberLiteral");

        expect(condition.children).toHaveLength(1);
        expect(getAt(condition.children, 0).type).toBe("IRText");
    });

    it("should build action and navigate nodes", () => {
        const ir = buildIR(`
        site "Demo" {
            page "Home" {
                layout vertical {
                    action "Open Scaffolders" {
                        navigate "/scaffolders"
                    }
                }
            }
        }
    `);

        const page = getAt(getAt(ir.sites, 0).pages, 0);
        const layout = getByType(page.children, "IRLayout");
        const action = getByType(layout.children, "IRAction");

        expect(action.label).toBe("Open Scaffolders");
        expect(action.commands).toHaveLength(1);

        const navigate = getAt(action.commands, 0);

        expect(navigate.type).toBe("IRNavigate");
        expect(navigate.path).toBe("/scaffolders");
    });

    it("should build SEO metadata", () => {
        const ir = buildIR(`
        site "Demo" {
            page "Home" {
                seo {
                    title "Home Page"
                    description "Welcome to our website."
                    canonical "/"
                    index true
                }

                layout vertical {
                    heading 1 "Welcome"
                }
            }
        }
    `);

        const page = getAt(getAt(ir.sites, 0).pages, 0);

        expect(page.seo).toBeDefined();
        expect(page.seo?.title).toBe("Home Page");
        expect(page.seo?.description).toBe("Welcome to our website.");
        expect(page.seo?.canonical).toBe("/");
        expect(page.seo?.index).toBe(true);
    });

    it("should keep page state scopes independent", () => {
        const ir = buildIR(`
        site "Demo" {
            page "Home" {
                state count = 10

                layout vertical {
                    text "Home"
                }
            }

            page "About" {
                state count = 20

                layout vertical {
                    text "About"
                }
            }
        }
    `);

        const pages = getAt(ir.sites, 0).pages;

        expect(pages).toHaveLength(2);

        const home = getAt(pages, 0);
        const about = getAt(pages, 1);

        expect(home.name).toBe("Home");
        expect(about.name).toBe("About");

        expect(home.scope.symbols).toHaveLength(1);
        expect(about.scope.symbols).toHaveLength(1);

        const homeSymbol = getAt(home.scope.symbols, 0);
        const aboutSymbol = getAt(about.scope.symbols, 0);

        expect(homeSymbol.name).toBe("count");
        expect(aboutSymbol.name).toBe("count");

        expect(homeSymbol.id).not.toBe(aboutSymbol.id);
    });

    it("should build state assignments", () => {
        const ir = buildIR(`
        page "Counter" {
            state count = 10
            count = count + 1
        }
    `);

        const page = getAt(ir.standalonePages, 0);

        expect(page.scope.symbols).toHaveLength(1);

        const symbol = getAt(page.scope.symbols, 0);

        expect(symbol.name).toBe("count");

        const assignment = getByType(
            page.children,
            "IRAssignment"
        );

        expect(assignment.name).toBe("count");
        expect(assignment.symbolId).toBe(symbol.id);
        expect(assignment.value.type).toBe("IRBinaryExpression");
    });

    it("should build nested legacy elements", () => {
        const ir = buildIR(`
        page "Home" {
            column {
                heading "Welcome"
                text "Hello pakpourUI"
                row {
                    text "Nested content"
                }
            }
        }
    `);

        const page = getAt(ir.standalonePages, 0);

        const column = getByType(
            page.children,
            "IRElement"
        );

        expect(column.name.toLowerCase()).toBe("column");
        expect(column.children).toHaveLength(3);

        const heading = getAt(column.children, 0);

        expect(heading.type).toBe("IRElement");

        if (heading.type !== "IRElement") {
            throw new Error("Expected heading element");
        }

        expect(heading.name.toLowerCase()).toBe("heading");

        const row = getAt(column.children, 2);

        expect(row.type).toBe("IRElement");

        if (row.type !== "IRElement") {
            throw new Error("Expected row element");
        }

        expect(row.name.toLowerCase()).toBe("row");
        expect(row.children).toHaveLength(1);
    });

});
