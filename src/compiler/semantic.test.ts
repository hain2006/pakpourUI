
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

    it("should detect duplicate state declarations", () => {
        const diagnostics = analyze(`
            site "Demo" {
                page "Home" {
                    state count = 0
                    state count = 10
                }
            }
        `);

        expect(diagnostics.getErrors()).toHaveLength(1);
        expect(diagnostics.getErrors()[0]!.code)
            .toBe("PUI1002");
    });

});
