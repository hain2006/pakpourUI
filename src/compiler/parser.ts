
import { Token, TokenType } from "./token";

import {
    ProgramNode,
    StatementNode,
    PageNode,
    StateNode,
    ElementNode,
    ExpressionNode,
    AssignmentNode
} from "./ast";

export class Parser {
    private position = 0;

    constructor(private tokens: Token[]) {}

    private peek(): Token {
        return this.tokens[this.position];
    }

    private advance(): Token {
        return this.tokens[this.position++];
    }

    private expect(type: TokenType): Token {
        const token = this.peek();

        if (token.type !== type) {
            throw new Error(
                `Expected ${TokenType[type]} but found '${token.value}' ` +
                `at ${token.line}:${token.column}`
            );
        }

        return this.advance();
    }

    public parse(): ProgramNode {
        const body: StatementNode[] = [];

        while (this.peek().type !== TokenType.EOF) {
            body.push(this.parsePage());
        }

        return { type: "Program", body };
    }

    private parsePage(): PageNode {
        this.expect(TokenType.Page);

        const name = this.expect(TokenType.String).value;

        this.expect(TokenType.LeftBrace);

        return {
            type: "Page",
            name,
            children: this.parseBlock()
        };
    }

    private parseBlock(): StatementNode[] {
        const children: StatementNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            children.push(this.parseStatement());
        }

        this.expect(TokenType.RightBrace);

        return children;
    }

    private parseStatement(): StatementNode {
        const token = this.peek();

        switch (token.type) {
            case TokenType.State:
                return this.parseState();

            case TokenType.Column:
            case TokenType.Row:
                return this.parseContainer();

            case TokenType.Heading:
            case TokenType.Text:
            case TokenType.Button:
                return this.parseElement();

            case TokenType.Identifier:
                return this.parseAssignment();

            default:
                throw new Error(
                    `Unexpected token '${token.value}' at ` +
                    `${token.line}:${token.column}`
                );
        }
    }

    private parseState(): StateNode {
        this.expect(TokenType.State);

        const name = this.expect(TokenType.Identifier).value;

        this.expect(TokenType.Equals);

        return {
            type: "State",
            name,
            value: this.parseExpression()
        };
    }

    private parseAssignment(): AssignmentNode {
        const name = this.expect(TokenType.Identifier).value;

        this.expect(TokenType.Equals);

        return {
            type: "Assignment",
            name,
            value: this.parseExpression()
        };
    }

    private parseExpression(): ExpressionNode {
        let left = this.parsePrimary();

        while (this.peek().type === TokenType.Plus) {
            const operator = this.advance().value;
            const right = this.parsePrimary();

            left = {
                type: "BinaryExpression",
                operator,
                left,
                right
            };
        }

        return left;
    }

    private parsePrimary(): ExpressionNode {
        const token = this.advance();

        if (token.type === TokenType.Number) {
            return {
                type: "NumberLiteral",
                value: Number(token.value)
            };
        }

        if (token.type === TokenType.String) {
            return {
                type: "StringLiteral",
                value: token.value
            };
        }

        if (token.type === TokenType.Identifier) {
            return {
                type: "Identifier",
                name: token.value
            };
        }

        throw new Error(
            `Invalid expression at ${token.line}:${token.column}`
        );
    }

    private parseContainer(): ElementNode {
        const token = this.advance();

        this.expect(TokenType.LeftBrace);

        return {
            type: "Element",
            name: token.value,
            children: this.parseBlock()
        };
    }

    private parseElement(): ElementNode {
        const token = this.advance();

        const text = this.expect(TokenType.String).value;

        let children: StatementNode[] = [];

        if (
            token.type === TokenType.Button &&
            this.peek().type === TokenType.LeftBrace
        ) {
            this.advance();
            children = this.parseBlock();
        }

        return {
            type: "Element",
            name: token.value,
            text,
            children
        };
    }
}
