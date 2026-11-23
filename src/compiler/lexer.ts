
import { Token, TokenType } from "./token";

export class Lexer {
    private position = 0;
    private line = 1;
    private column = 1;

    constructor(private source: string) {}

    private peek(offset = 0): string {
        return this.source[this.position + offset] ?? "";
    }

    private advance(): string {
        const char = this.source[this.position++];

        if (char === "\n") {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }

        return char;
    }

    private skipWhitespace(): void {
        while (/\s/.test(this.peek()) && this.peek() !== "") {
            this.advance();
        }
    }

    private skipComment(): void {
        if (this.peek() === "/" && this.peek(1) === "/") {
            while (
                this.peek() !== "\n" &&
                this.peek() !== ""
            ) {
                this.advance();
            }
        }
    }

    private readIdentifier(): Token {
        const line = this.line;
        const column = this.column;

        let value = "";

        while (/[a-zA-Z0-9_]/.test(this.peek())) {
            value += this.advance();
        }

        const keywords: Record<string, TokenType> = {
            page: TokenType.Page,
            state: TokenType.State,
            column: TokenType.Column,
            row: TokenType.Row,
            heading: TokenType.Heading,
            text: TokenType.Text,
            button: TokenType.Button
        };

        return {
            type: keywords[value] ?? TokenType.Identifier,
            value,
            line,
            column
        };
    }

    private readNumber(): Token {
        const line = this.line;
        const column = this.column;

        let value = "";

        while (/[0-9]/.test(this.peek())) {
            value += this.advance();
        }

        return {
            type: TokenType.Number,
            value,
            line,
            column
        };
    }

    private readString(): Token {
        const line = this.line;
        const column = this.column;

        this.advance();

        let value = "";

        while (this.peek() !== '"' && this.peek() !== "") {
            if (this.peek() === "\\") {
                this.advance();

                const escaped = this.advance();

                const escapeMap: Record<string, string> = {
                    n: "\n",
                    t: "\t",
                    r: "\r",
                    '"': '"',
                    "\\": "\\"
                };

                value += escapeMap[escaped] ?? escaped;
            } else {
                value += this.advance();
            }
        }

        if (this.peek() !== '"') {
            throw new Error(
                `Unterminated string at ${line}:${column}`
            );
        }

        this.advance();

        return {
            type: TokenType.String,
            value,
            line,
            column
        };
    }

    public tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.position < this.source.length) {
            this.skipWhitespace();

            if (this.position >= this.source.length) {
                break;
            }

            if (
                this.peek() === "/" &&
                this.peek(1) === "/"
            ) {
                this.skipComment();
                continue;
            }

            const char = this.peek();

            if (/[a-zA-Z_]/.test(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            if (/[0-9]/.test(char)) {
                tokens.push(this.readNumber());
                continue;
            }

            if (char === '"') {
                tokens.push(this.readString());
                continue;
            }

            const line = this.line;
            const column = this.column;

            const symbols: Record<string, TokenType> = {
                "{": TokenType.LeftBrace,
                "}": TokenType.RightBrace,
                "+": TokenType.Plus,
                "=": TokenType.Equals
            };

            if (symbols[char] !== undefined) {
                tokens.push({
                    type: symbols[char],
                    value: this.advance(),
                    line,
                    column
                });

                continue;
            }

            throw new Error(
                `Unexpected character '${char}' at ${line}:${column}`
            );
        }

        tokens.push({
            type: TokenType.EOF,
            value: "",
            line: this.line,
            column: this.column
        });

        return tokens;
    }
}
