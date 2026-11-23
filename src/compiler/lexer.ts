
import type { Token } from "./token";
import { TokenType } from "./token";

export class Lexer {
    private position = 0;
    private line = 1;
    private column = 1;

    constructor(private source: string) {}

    private peek(offset = 0): string {
        return this.source[this.position + offset] ?? "";
    }

    private advance(): string {
        const char = this.source[this.position++] ?? "";

        if (char === "\n") {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }

        return char;
    }

    private createToken(
        type: TokenType,
        value: string,
        line: number,
        column: number
    ): Token {
        return { type, value, line, column };
    }

    private skipWhitespace(): void {
        while (
            this.peek() !== "" &&
            /\s/.test(this.peek())
        ) {
            this.advance();
        }
    }

    private skipComment(): void {
        while (
            this.peek() !== "" &&
            this.peek() !== "\n"
        ) {
            this.advance();
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
            site: TokenType.Site,
            page: TokenType.Page,

            seo: TokenType.Seo,
            title: TokenType.Title,
            description: TokenType.Description,
            canonical: TokenType.Canonical,
            index: TokenType.Index,

            layout: TokenType.Layout,
            vertical: TokenType.Vertical,
            horizontal: TokenType.Horizontal,

            heading: TokenType.Heading,
            paragraph: TokenType.Paragraph,
            text: TokenType.Text,
            action: TokenType.Action,

            state: TokenType.State,
            when: TokenType.When,
            navigate: TokenType.Navigate,

            true: TokenType.True,
            false: TokenType.False,

            // Legacy keywords
            column: TokenType.Column,
            row: TokenType.Row,
            button: TokenType.Button
        };

        return this.createToken(
            keywords[value] ?? TokenType.Identifier,
            value,
            line,
            column
        );
    }

    private readNumber(): Token {
        const line = this.line;
        const column = this.column;

        let value = "";

        while (/[0-9]/.test(this.peek())) {
            value += this.advance();
        }

        return this.createToken(
            TokenType.Number,
            value,
            line,
            column
        );
    }

    private readString(): Token {
        const line = this.line;
        const column = this.column;

        this.advance();

        let value = "";

        while (
            this.peek() !== '"' &&
            this.peek() !== ""
        ) {
            if (this.peek() === "\\") {
                this.advance();

                if (this.peek() === "") {
                    break;
                }

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

        return this.createToken(
            TokenType.String,
            value,
            line,
            column
        );
    }

    private readOperator(): Token | null {
        const line = this.line;
        const column = this.column;

        const operators: Record<string, TokenType> = {
            ">=": TokenType.GreaterThanOrEqual,
            "<=": TokenType.LessThanOrEqual,
            "==": TokenType.EqualEqual,
            "!=": TokenType.NotEquals,

            "{": TokenType.LeftBrace,
            "}": TokenType.RightBrace,

            "=": TokenType.Equals,
            "+": TokenType.Plus,
            "-": TokenType.Minus,
            "*": TokenType.Multiply,
            "/": TokenType.Divide,

            ">": TokenType.GreaterThan,
            "<": TokenType.LessThan
        };

        const twoCharacters = this.peek() + this.peek(1);

        if (operators[twoCharacters] !== undefined) {
            this.advance();
            this.advance();

            return this.createToken(
                operators[twoCharacters],
                twoCharacters,
                line,
                column
            );
        }

        const oneCharacter = this.peek();

        if (operators[oneCharacter] !== undefined) {
            this.advance();

            return this.createToken(
                operators[oneCharacter],
                oneCharacter,
                line,
                column
            );
        }

        return null;
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

            const operator = this.readOperator();

            if (operator) {
                tokens.push(operator);
                continue;
            }

            throw new Error(
                `Unexpected character '${char}' at ${this.line}:${this.column}`
            );
        }

        tokens.push(
            this.createToken(
                TokenType.EOF,
                "",
                this.line,
                this.column
            )
        );

        return tokens;
    }
}
