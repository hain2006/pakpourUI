
import type {
    ProgramNode,
    StatementNode,
    SiteNode,
    SitePageNode,
    LayoutContentNode,
    ExpressionNode
} from "./ast";

import { DiagnosticBag } from "./diagnostics";

export class SemanticAnalyzer {
    private diagnostics = new DiagnosticBag();
    private declaredStates = new Set<string>();

    public analyze(program: ProgramNode): DiagnosticBag {
        this.diagnostics.clear();

        for (const statement of program.body) {
            if (statement.type === "Site") {
                this.analyzeSite(statement);
            }

            if (statement.type === "Page") {
                this.analyzeStatements(statement.children);
            }
        }

        return this.diagnostics;
    }

    private analyzeSite(site: SiteNode): void {
        for (const page of site.pages) {
            this.analyzeSitePage(page);
        }
    }

    private analyzeSitePage(page: SitePageNode): void {
        this.declaredStates.clear();

        // First pass: collect declared states
        for (const child of page.children) {
            if (child.type === "State") {
                if (this.declaredStates.has(child.name)) {
                    this.diagnostics.report({
                        code: "PUI1002",
                        message: `Duplicate state declaration: ${child.name}`,
                        severity: "error",
                        category: "semantic"
                    });
                }

                this.declaredStates.add(child.name);
            }
        }

        // Second pass: validate expressions and elements
        for (const child of page.children) {
            if (child.type === "State") {
                this.analyzeExpression(child.value);
            }

            if (child.type === "Layout") {
                this.analyzeLayout(child.children);
            }
        }
    }

    private analyzeLayout(
        children: LayoutContentNode[]
    ): void {
        for (const child of children) {
            switch (child.type) {
                case "Text":
                case "Paragraph":
                case "Heading":
                    this.analyzeText(child.text);
                    break;

                case "Action":
                    break;

                case "When":
                    this.analyzeExpression(child.condition);
                    this.analyzeLayout(child.children);
                    break;

                case "Element":
                    this.analyzeStatements(child.children);
                    break;
            }
        }
    }

    private analyzeText(text: string): void {
        const matches = text.matchAll(
            /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
        );

        for (const match of matches) {
            const name = match[1];

            if (name && !this.declaredStates.has(name)) {
                this.reportUndefinedVariable(name);
            }
        }
    }

    private analyzeExpression(
        expression: ExpressionNode
    ): void {
        switch (expression.type) {
            case "Identifier":
                if (!this.declaredStates.has(expression.name)) {
                    this.reportUndefinedVariable(expression.name);
                }
                break;

            case "BinaryExpression":
                this.analyzeExpression(expression.left);
                this.analyzeExpression(expression.right);
                break;

            case "UnaryExpression":
                this.analyzeExpression(expression.argument);
                break;

            case "NumberLiteral":
            case "StringLiteral":
            case "BooleanLiteral":
                break;
        }
    }

    private analyzeStatements(
        statements: StatementNode[]
    ): void {
        for (const statement of statements) {
            if (statement.type === "State") {
                this.declaredStates.add(statement.name);
                this.analyzeExpression(statement.value);
            }

            if (statement.type === "Element") {
                if (statement.text) {
                    this.analyzeText(statement.text);
                }

                this.analyzeStatements(statement.children);
            }

            if (statement.type === "Assignment") {
                if (!this.declaredStates.has(statement.name)) {
                    this.reportUndefinedVariable(statement.name);
                }

                this.analyzeExpression(statement.value);
            }
        }
    }

    private reportUndefinedVariable(name: string): void {
        this.diagnostics.report({
            code: "PUI1001",
            message: `Undefined variable: ${name}`,
            severity: "error",
            category: "semantic"
        });
    }
}
