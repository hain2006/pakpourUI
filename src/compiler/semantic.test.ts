
import { describe, it, expect } from "vitest";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { SemanticAnalyzer } from "./semantic";

describe("pakpourUI Semantic Analyzer", () => {

    function analyze(source: string) {
        const tokens = new Lexer(source).tokenize();
        const ast = new Parser(tokens).parse();

        return new SemanticAnalyzer().analyze(ast);
    }

    function analyzeWithModel(source: string) {
        const tokens = new Lexer(source).tokenize();
        const ast = new Parser(tokens).parse();

        const analyzer = new SemanticAnalyzer();
        const diagnostics = analyzer.analyze(ast);

        const site = ast.body.find(
            statement => statement.type === "Site"
        );

        if (!site || site.type !== "Site" || !site.pages[0]) {
            throw new Error("Test source must contain a Site with a Page");
        }

        return {
            diagnostics,
            semanticModel: analyzer.getSemanticModel(),
            page: site.pages[0]
        };
    }

    function getExpectedPosition(source: string, search: string) {
        const offset = source.indexOf(search);

        if (offset === -1) {
            throw new Error(`Text not found: ${search}`);
        }

        const before = source.slice(0, offset);

        return {
            line: before.split("\n").length,
            column: offset - before.lastIndexOf("\n")
        };
    }

    it("should detect undefined variables in text", () => {
        const diagnostics = analyze(`
            site "Demo" {
                page "Home" {
                    layout vertical {
                        text "Hello {userName}"
                    }
                }
            }
        `);

        expect(diagnostics.getErrors()).toHaveLength(1);
        expect(diagnostics.getErrors()[0]!.code)
            .toBe("PUI1001");
    });

    it("should accept declared states", () => {
        const diagnostics = analyze(`
            site "Demo" {
                page "Home" {
                    state userName = "Hamid"

                    layout vertical {
                        text "Hello {userName}"
                    }
                }
            }
        `);

        expect(diagnostics.hasErrors).toBe(false);
    });

    it("should detect undefined variables in conditions", () => {
        const diagnostics = analyze(`
            site "Demo" {
                page "Counter" {
                    layout vertical {
                        when count >= 10 {
                            text "Reached 10"
                        }
                    }
                }
            }
        `);

        expect(diagnostics.getErrors()).toHaveLength(1);
        expect(diagnostics.getErrors()[0]!.message)
            .toContain("count");
    });

    it("should report exact position of duplicate state declaration", () => {
        const source = `
site "Demo" {
    page "Home" {
        state count = 0
        state count = 10
    }
}
`;

        const diagnostics = analyze(source);
        const error = diagnostics.getErrors()[0]!;

        const expected = getExpectedPosition(
            source,
            "state count = 10"
        );

        expected.column += "state ".length;

        expect(error.code).toBe("PUI1002");
        expect(error.line).toBe(expected.line);
        expect(error.column).toBe(expected.column);
    });

    it("should report exact position of undefined variable", () => {
        const source = `
site "Demo" {
    page "Home" {
        layout vertical {
            text "Hello {userName}"
        }
    }
}
`;

        const diagnostics = analyze(source);
        const error = diagnostics.getErrors()[0]!;

        const expected = getExpectedPosition(source, "userName");

        expect(error.code).toBe("PUI1001");
        expect(error.line).toBe(expected.line);
        expect(error.column).toBe(expected.column);
    });

    it("should report exact position after escaped characters", () => {
        const source = `
site "Demo" {
    page "Home" {
        layout vertical {
            text "Hello\\nWorld {userName}"
        }
    }
}
`;

        const diagnostics = analyze(source);
        const error = diagnostics.getErrors()[0]!;

        const expected = getExpectedPosition(source, "userName");

        expect(error.code).toBe("PUI1001");
        expect(error.line).toBe(expected.line);
        expect(error.column).toBe(expected.column);
    });

    it("should report exact position after Persian text", () => {
        const source = `
site "Demo" {
    page "Home" {
        layout vertical {
            text "سلام دنیا {userName}"
        }
    }
}
`;

        const diagnostics = analyze(source);
        const error = diagnostics.getErrors()[0]!;

        const expected = getExpectedPosition(source, "userName");

        expect(error.code).toBe("PUI1001");
        expect(error.line).toBe(expected.line);
        expect(error.column).toBe(expected.column);
    });

    it("should report exact position of undefined variable in condition", () => {
        const source = `
site "Demo" {
    page "Counter" {
        layout vertical {
            when missingCount >= 10 {
                text "Reached 10"
            }
        }
    }
}
`;

        const diagnostics = analyze(source);
        const error = diagnostics.getErrors()[0]!;

        const expected = getExpectedPosition(source, "missingCount");

        expect(error.code).toBe("PUI1001");
        expect(error.line).toBe(expected.line);
        expect(error.column).toBe(expected.column);
    });

    it("should report exact position of undefined variable in assignment", () => {
        const source = `
page "Counter" {
    count = 10
}
`;

        const diagnostics = analyze(source);
        const error = diagnostics.getErrors()[0]!;

        const expected = getExpectedPosition(source, "count");

        expect(error.code).toBe("PUI1001");
        expect(error.line).toBe(expected.line);
        expect(error.column).toBe(expected.column);
    });

    it("should accept previously declared states in initializers", () => {
        const diagnostics = analyze(`
site "Demo" {
    page "Counter" {
        state count = 10
        state total = count + 5
    }
}
`);

        expect(diagnostics.hasErrors).toBe(false);
    });

    it("should reject states declared later in initializers", () => {
        const diagnostics = analyze(`
site "Demo" {
    page "Counter" {
        state total = count + 5
        state count = 10
    }
}
`);

        expect(diagnostics.getErrors()).toHaveLength(1);
        expect(diagnostics.getErrors()[0]!.code).toBe("PUI1001");
        expect(diagnostics.getErrors()[0]!.message).toContain("count");
    });

    it("should not share states between site pages", () => {
        const source = `
site "Demo" {
    page "Home" {
        state count = 10
    }

    page "Counter" {
        layout vertical {
            text "Value: {count}"
        }
    }
}
`;

        const diagnostics = analyze(source);

        expect(diagnostics.getErrors()).toHaveLength(1);
        expect(diagnostics.getErrors()[0]!.code).toBe("PUI1001");
    });

    it("should allow same state name in different site pages", () => {
        const source = `
site "Demo" {
    page "Home" {
        state count = 10
    }

    page "Counter" {
        state count = 20
        layout vertical {
            text "Value: {count}"
        }
    }
}
`;

        const diagnostics = analyze(source);

        expect(diagnostics.getErrors()).toHaveLength(0);
    });

    it("should reset state scope between analyzer runs", () => {
        const analyzer = new SemanticAnalyzer();

        function run(source: string) {
            const tokens = new Lexer(source).tokenize();
            const ast = new Parser(tokens).parse();

            return analyzer.analyze(ast);
        }

        const first = run(`
page "First" {
    state count = 10
}
`);

        expect(first.getErrors()).toHaveLength(0);

        const second = run(`
page "Second" {
    text "Value: {count}"
}
`);

        expect(second.getErrors()).toHaveLength(1);
        expect(second.getErrors()[0]!.code).toBe("PUI1001");
    });

    it("should infer number type through state references", () => {
        const { diagnostics, semanticModel, page } = analyzeWithModel(`
site "Demo" {
    page "Counter" {
        state count = 10
        state total = count + 5
        state result = total
    }
}
`);

        expect(diagnostics.hasErrors).toBe(false);

        const scope = semanticModel.getPageScope(page);

        expect(scope).toBeDefined();

        expect(
            scope!.symbols.map(symbol => symbol.valueType)
        ).toEqual([
            "number",
            "number",
            "number"
        ]);
    });

    it("should bind identifiers to their declared symbols", () => {
        const { diagnostics, semanticModel, page } = analyzeWithModel(`
site "Demo" {
    page "Counter" {
        state count = 10
        state total = count + 5
    }
}
`);

        expect(diagnostics.hasErrors).toBe(false);

        const countState = page.children.find(
            child => child.type === "State" && child.name === "count"
        );

        const totalState = page.children.find(
            child => child.type === "State" && child.name === "total"
        );

        expect(countState?.type).toBe("State");
        expect(totalState?.type).toBe("State");

        if (
            countState?.type !== "State" ||
            totalState?.type !== "State" ||
            totalState.value.type !== "BinaryExpression" ||
            totalState.value.left.type !== "Identifier"
        ) {
            throw new Error("Unexpected test AST structure");
        }

        const countSymbol = semanticModel.getStateSymbol(countState);
        const boundSymbol = semanticModel.getIdentifierSymbol(
            totalState.value.left
        );

        expect(boundSymbol).toBe(countSymbol);
    });

    it("should bind text identifiers to their declared symbols", () => {
        const { diagnostics, semanticModel, page } = analyzeWithModel(`
site "Demo" {
    page "Counter" {
        state count = 10
        state total = 20

        layout vertical {
            text "Count: {count}, Total: {total}"
        }
    }
}
`);

        expect(diagnostics.hasErrors).toBe(false);

        const countState = page.children.find(
            child => child.type === "State" && child.name === "count"
        );

        const layout = page.children.find(
            child => child.type === "Layout"
        );

        if (
            countState?.type !== "State" ||
            layout?.type !== "Layout"
        ) {
            throw new Error("Unexpected test AST structure");
        }

        const textNode = layout.children.find(
            child => child.type === "Text"
        );

        if (textNode?.type !== "Text") {
            throw new Error("Text node not found");
        }

        const bindings = semanticModel.getTextBindings(textNode);

        expect(bindings).toHaveLength(2);

        expect(bindings[0]!.name).toBe("count");
        expect(bindings[1]!.name).toBe("total");

        expect(bindings[0]!.symbol).toBe(
            semanticModel.getStateSymbol(countState)
        );

        const totalState = page.children.find(
            child => child.type === "State" && child.name === "total"
        );

        expect(bindings[1]!.symbol).toBe(
            semanticModel.getStateSymbol(totalState as typeof countState)
        );
    });


    it("should store inferred expression types in semantic model", () => {
        const { diagnostics, semanticModel, page } = analyzeWithModel(`
site "Demo" {
    page "Counter" {
        state count = 10
        state total = count + 5
        state result = total
    }
}
`);

        expect(diagnostics.hasErrors).toBe(false);

        const totalState = page.children.find(
            child => child.type === "State" && child.name === "total"
        );

        if (
            totalState?.type !== "State" ||
            totalState.value.type !== "BinaryExpression"
        ) {
            throw new Error("Unexpected test AST structure");
        }

        const expression = totalState.value;

        expect(
            semanticModel.getExpressionType(expression)
        ).toBe("number");

        expect(
            semanticModel.getExpressionType(expression.left)
        ).toBe("number");

        expect(
            semanticModel.getExpressionType(expression.right)
        ).toBe("number");
    });


});
