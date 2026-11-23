
import { describe, it, expect } from "vitest";
import { Lexer } from "./lexer";
import { TokenType } from "./token";

describe("pakpourUI Lexer", () => {

    it("should recognize site and page keywords", () => {
        const lexer = new Lexer(`
            site "Darbastan" {
                page "Home" {}
            }
        `);

        const tokens = lexer.tokenize();

        expect(tokens[0]!.type).toBe(TokenType.Site);
        expect(tokens[1]!.type).toBe(TokenType.String);
        expect(tokens[2]!.type).toBe(TokenType.LeftBrace);
        expect(tokens[3]!.type).toBe(TokenType.Page);
    });

    it("should recognize SEO keywords", () => {
        const lexer = new Lexer(`
            seo {
                title "Home"
                description "Description"
                canonical "/"
                index true
            }
        `);

        const types = lexer.tokenize().map(t => t.type);

        expect(types).toContain(TokenType.Seo);
        expect(types).toContain(TokenType.Title);
        expect(types).toContain(TokenType.Description);
        expect(types).toContain(TokenType.Canonical);
        expect(types).toContain(TokenType.Index);
        expect(types).toContain(TokenType.True);
    });

    it("should recognize layout keywords", () => {
        const lexer = new Lexer(
            "layout vertical { layout horizontal {} }"
        );

        const types = lexer.tokenize().map(t => t.type);

        expect(types).toContain(TokenType.Layout);
        expect(types).toContain(TokenType.Vertical);
        expect(types).toContain(TokenType.Horizontal);
    });

    it("should recognize comparison operators", () => {
        const lexer = new Lexer(
            "10 >= 5 10 <= 20 5 == 5 5 != 3"
        );

        const types = lexer.tokenize().map(t => t.type);

        expect(types).toContain(TokenType.GreaterThanOrEqual);
        expect(types).toContain(TokenType.LessThanOrEqual);
        expect(types).toContain(TokenType.EqualEqual);
        expect(types).toContain(TokenType.NotEquals);
    });

    it("should recognize arithmetic operators", () => {
        const lexer = new Lexer("10 + 5 - 2 * 3 / 1");

        const types = lexer.tokenize().map(t => t.type);

        expect(types).toContain(TokenType.Plus);
        expect(types).toContain(TokenType.Minus);
        expect(types).toContain(TokenType.Multiply);
        expect(types).toContain(TokenType.Divide);
    });

    it("should preserve line and column information", () => {
        const lexer = new Lexer(`site
page`);

        const tokens = lexer.tokenize();

        expect(tokens[0]!.line).toBe(1);
        expect(tokens[1]!.line).toBe(2);
        expect(tokens[1]!.column).toBe(1);
    });

});
