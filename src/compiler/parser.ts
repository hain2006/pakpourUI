
import type { Token } from "./token";
import { TokenType } from "./token";
import type { SourceSpan } from "./source-location";

import type {
    ProgramNode,
    StatementNode,
    SiteNode,
    SitePageNode,
    PageNode,
    PageContentNode,
    SeoNode,
    LayoutNode,
    LayoutContentNode,
    HeadingNode,
    ParagraphNode,
    TextNode,
    ActionNode,
    ActionCommandNode,
    NavigateNode,
    WhenNode,
    StateNode,
    ElementNode,
    AssignmentNode,
    ExpressionNode
} from "./ast";

export class Parser {
    private position = 0;

    constructor(private tokens: Token[]) { }

    private peek(): Token {
        return this.tokens[this.position]
            ?? this.tokens[this.tokens.length - 1]!;
    }

    private advance(): Token {
        const token = this.peek();

        if (token.type !== TokenType.EOF) {
            this.position++;
        }

        return token;
    }

    private createSpan(
        start: Token,
        end: Token
    ): SourceSpan {
        return {
            start: start.span.start,
            end: end.span.end
        };
    }

    private currentToken(): Token {
        return this.peek();
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

    private error(message: string): never {
        const token = this.peek();

        throw new Error(
            `${message} at ${token.line}:${token.column}`
        );
    }

    public parse(): ProgramNode {
        const body: StatementNode[] = [];

        while (this.peek().type !== TokenType.EOF) {
            switch (this.peek().type) {
                case TokenType.Site:
                    body.push(this.parseSite());
                    break;

                case TokenType.Page:
                    body.push(this.parseLegacyPage());
                    break;

                default:
                    this.error("Expected site or page");
            }
        }

        return {
            type: "Program",
            body
        };
    }

    // =====================================
    // Site
    // =====================================

    private parseSite(): SiteNode {
        this.expect(TokenType.Site);

        const name = this.expect(TokenType.String).value;

        this.expect(TokenType.LeftBrace);

        const pages: SitePageNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            pages.push(this.parseSitePage());
        }

        this.expect(TokenType.RightBrace);

        return {
            type: "Site",
            name,
            pages
        };
    }

    private parseSitePage(): SitePageNode {
        this.expect(TokenType.Page);

        const name = this.expect(TokenType.String).value;

        this.expect(TokenType.LeftBrace);

        const children: PageContentNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            switch (this.peek().type) {
                case TokenType.Seo:
                    children.push(this.parseSeo());
                    break;

                case TokenType.State:
                    children.push(this.parseState());
                    break;

                case TokenType.Layout:
                    children.push(this.parseLayout());
                    break;

                default:
                    this.error("Unexpected page content");
            }
        }

        this.expect(TokenType.RightBrace);

        return {
            type: "SitePage",
            name,
            children
        };
    }

    // =====================================
    // SEO
    // =====================================

    private parseSeo(): SeoNode {
        this.expect(TokenType.Seo);
        this.expect(TokenType.LeftBrace);

        const seo: SeoNode = {
            type: "Seo"
        };

        const seen = new Set<TokenType>();

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            const token = this.peek();

            if (seen.has(token.type)) {
                this.error(`Duplicate SEO property '${token.value}'`);
            }

            seen.add(token.type);

            switch (token.type) {
                case TokenType.Title:
                    this.advance();
                    seo.title = this.expect(TokenType.String).value;
                    break;

                case TokenType.Description:
                    this.advance();
                    seo.description = this.expect(TokenType.String).value;
                    break;

                case TokenType.Canonical:
                    this.advance();
                    seo.canonical = this.expect(TokenType.String).value;
                    break;

                case TokenType.Index:
                    this.advance();

                    if (this.peek().type === TokenType.True) {
                        this.advance();
                        seo.index = true;
                    } else if (this.peek().type === TokenType.False) {
                        this.advance();
                        seo.index = false;
                    } else {
                        this.error("Expected true or false for index");
                    }

                    break;

                default:
                    this.error("Unknown SEO property");
            }
        }

        this.expect(TokenType.RightBrace);

        return seo;
    }

    // =====================================
    // Layout
    // =====================================

    private parseLayout(): LayoutNode {
        this.expect(TokenType.Layout);

        let direction: "vertical" | "horizontal";

        if (this.peek().type === TokenType.Vertical) {
            this.advance();
            direction = "vertical";
        } else if (this.peek().type === TokenType.Horizontal) {
            this.advance();
            direction = "horizontal";
        } else {
            this.error("Expected vertical or horizontal");
        }

        this.expect(TokenType.LeftBrace);

        const children: LayoutContentNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            children.push(this.parseLayoutContent());
        }

        this.expect(TokenType.RightBrace);

        return {
            type: "Layout",
            direction,
            children
        };
    }

    private parseLayoutContent(): LayoutContentNode {
        switch (this.peek().type) {
            case TokenType.Heading:
                return this.parseHeading();

            case TokenType.Paragraph:
                return this.parseParagraph();

            case TokenType.Text:
                return this.parseText();

            case TokenType.Action:
                return this.parseAction();

            case TokenType.When:
                return this.parseWhen();

            default:
                this.error("Unexpected layout element");
        }
    }

    private parseHeading(): HeadingNode {
        const start = this.expect(TokenType.Heading);

        const levelToken = this.expect(TokenType.Number);
        const level = Number(levelToken.value);

        if (!Number.isInteger(level) || level < 1 || level > 6) {
            throw new Error(
                `Heading level must be between 1 and 6 at ` +
                `${levelToken.line}:${levelToken.column}`
            );
        }

        const textToken = this.expect(TokenType.String);

        return {
            type: "Heading",
            level,
            text: textToken.value,
            span: this.createSpan(start, textToken)
        };
    }

    private parseParagraph(): ParagraphNode {
        const start = this.expect(TokenType.Paragraph);
        const textToken = this.expect(TokenType.String);

        return {
            type: "Paragraph",
            text: textToken.value,
            span: this.createSpan(start, textToken)
        };
    }

    private parseText(): TextNode {
        const start = this.expect(TokenType.Text);
        const textToken = this.expect(TokenType.String);

        return {
            type: "Text",
            text: textToken.value,
            span: this.createSpan(start, textToken)
        };
    }

    // =====================================
    // Actions
    // =====================================

    private parseAction(): ActionNode {
        this.expect(TokenType.Action);

        const label = this.expect(TokenType.String).value;

        this.expect(TokenType.LeftBrace);

        const children: ActionCommandNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            children.push(this.parseActionCommand());
        }

        this.expect(TokenType.RightBrace);

        if (children.length === 0) {
            this.error("Action must contain at least one command");
        }

        return {
            type: "Action",
            label,
            children
        };
    }

    private parseActionCommand(): NavigateNode {
        this.expect(TokenType.Navigate);

        return {
            type: "Navigate",
            path: this.expect(TokenType.String).value
        };
    }

    // =====================================
    // Conditional Rendering
    // =====================================

    private parseWhen(): WhenNode {
        this.expect(TokenType.When);

        const condition = this.parseExpression();

        this.expect(TokenType.LeftBrace);

        const children: LayoutContentNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            children.push(this.parseLayoutContent());
        }

        this.expect(TokenType.RightBrace);

        return {
            type: "When",
            condition,
            children
        };
    }

    // =====================================
    // State
    // =====================================

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

    // =====================================
    // Expressions
    // =====================================

    private getPrecedence(type: TokenType): number {
        switch (type) {
            case TokenType.EqualEqual:
            case TokenType.NotEquals:
            case TokenType.GreaterThan:
            case TokenType.LessThan:
            case TokenType.GreaterThanOrEqual:
            case TokenType.LessThanOrEqual:
                return 1;

            case TokenType.Plus:
            case TokenType.Minus:
                return 2;

            case TokenType.Multiply:
            case TokenType.Divide:
                return 3;

            default:
                return -1;
        }
    }

    private parseExpression(minPrecedence = 0): ExpressionNode {
        let left = this.parseUnary();

        while (true) {
            const precedence = this.getPrecedence(
                this.peek().type
            );

            if (precedence < minPrecedence) {
                break;
            }

            const operator = this.advance().value;

            const right = this.parseExpression(precedence + 1);

            left = {
                type: "BinaryExpression",
                operator,
                left,
                right
            };
        }

        return left;
    }

    private parseUnary(): ExpressionNode {
        if (this.peek().type === TokenType.Minus) {
            const operator = this.advance().value;

            return {
                type: "UnaryExpression",
                operator,
                argument: this.parseUnary()
            };
        }

        return this.parsePrimary();
    }

    private parsePrimary(): ExpressionNode {
        const token = this.advance();

        switch (token.type) {
            case TokenType.Number:
                return {
                    type: "NumberLiteral",
                    value: Number(token.value)
                };

            case TokenType.String:
                return {
                    type: "StringLiteral",
                    value: token.value
                };

            case TokenType.True:
                return {
                    type: "BooleanLiteral",
                    value: true
                };

            case TokenType.False:
                return {
                    type: "BooleanLiteral",
                    value: false
                };

            case TokenType.Identifier:
                return {
                    type: "Identifier",
                    name: token.value
                };

            default:
                throw new Error(
                    `Invalid expression at ${token.line}:${token.column}`
                );
        }
    }

    // =====================================
    // Legacy Parser
    // =====================================

    private parseLegacyPage(): PageNode {
        this.expect(TokenType.Page);

        const name = this.expect(TokenType.String).value;

        this.expect(TokenType.LeftBrace);

        return {
            type: "Page",
            name,
            children: this.parseLegacyBlock()
        };
    }

    private parseLegacyBlock(): StatementNode[] {
        const children: StatementNode[] = [];

        while (
            this.peek().type !== TokenType.RightBrace &&
            this.peek().type !== TokenType.EOF
        ) {
            children.push(this.parseLegacyStatement());
        }

        this.expect(TokenType.RightBrace);

        return children;
    }

    private parseLegacyStatement(): StatementNode {
        switch (this.peek().type) {
            case TokenType.State:
                return this.parseState();

            case TokenType.Column:
            case TokenType.Row:
                return this.parseLegacyContainer();

            case TokenType.Heading:
            case TokenType.Text:
            case TokenType.Button:
                return this.parseLegacyElement();

            case TokenType.Identifier:
                return this.parseAssignment();

            default:
                this.error("Unexpected legacy statement");
        }
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

    private parseLegacyContainer(): ElementNode {
        const token = this.advance();

        this.expect(TokenType.LeftBrace);

        return {
            type: "Element",
            name: token.value,
            children: this.parseLegacyBlock()
        };
    }

    private parseLegacyElement(): ElementNode {
        const token = this.advance();

        const text = this.expect(TokenType.String).value;

        let children: StatementNode[] = [];

        if (
            token.type === TokenType.Button &&
            this.peek().type === TokenType.LeftBrace
        ) {
            this.advance();
            children = this.parseLegacyBlock();
        }

        return {
            type: "Element",
            name: token.value,
            text,
            children
        };
    }
}
