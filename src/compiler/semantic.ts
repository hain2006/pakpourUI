
import type {
    ProgramNode,
    StatementNode,
    SiteNode,
    SitePageNode,
    LayoutContentNode,
    ExpressionNode,
    StateNode
} from "./ast";

import { DiagnosticBag } from "./diagnostics";
import type {
    CharacterSpan,
    SourcePosition
} from "./source-location";

import {
    SemanticModel
} from "./semantic-model";
import type { SemanticSymbol } from "./semantic-model";

export class SemanticAnalyzer {
    private diagnostics = new DiagnosticBag();
    private declaredStates = new Set<string>();
    private declaredSymbols = new Map<string, SemanticSymbol>();
    private semanticModel = new SemanticModel();
    private nextSymbolId = 0;
    private nextScopeId = 0;

    public analyze(program: ProgramNode): DiagnosticBag {
        this.diagnostics.clear();
        this.declaredStates.clear();
        this.declaredSymbols.clear();
        this.nextSymbolId = 0;
        this.nextScopeId = 0;

        this.semanticModel = new SemanticModel();

        for (const statement of program.body) {
            if (statement.type === "Site") {
                this.analyzeSite(statement);
            }

            if (statement.type === "Page") {
                this.declaredStates.clear();
                this.declaredSymbols.clear();

                const symbols: SemanticSymbol[] = [];

                this.analyzeStatements(statement.children, symbols);

                this.semanticModel.setPageScope(statement, {
                    id: `scope_${this.nextScopeId++}`,
                    symbols
                });
            }
        }

        this.declaredStates.clear();

        return this.diagnostics;
    }

    public getSemanticModel(): SemanticModel {
        return this.semanticModel;
    }

    private inferValueType(
        expression: ExpressionNode
    ): "number" | "string" | "boolean" | "unknown" {
        switch (expression.type) {
            case "NumberLiteral":
                return "number";

            case "StringLiteral":
                return "string";

            case "BooleanLiteral":
                return "boolean";

            case "BinaryExpression": {
                const comparisonOperators = [
                    "==",
                    "!=",
                    ">",
                    "<",
                    ">=",
                    "<="
                ];

                if (comparisonOperators.includes(expression.operator)) {
                    return "boolean";
                }

                const leftType = this.inferValueType(expression.left);
                const rightType = this.inferValueType(expression.right);

                return leftType === rightType
                    ? leftType
                    : "unknown";
            }

            case "UnaryExpression":
                return expression.operator === "!"
                    ? "boolean"
                    : this.inferValueType(expression.argument);

            case "Identifier": {
                const symbol = this.declaredSymbols.get(expression.name);
                return symbol?.valueType ?? "unknown";
            }
        }
    }


    private createStateSymbol(
        state: StateNode,
        declarationOrder: number
    ) {
        const symbol = {
            id: `symbol_${this.nextSymbolId++}`,
            name: state.name,
            kind: "state" as const,
            valueType: this.inferValueType(state.value),
            declarationOrder
        };

        this.semanticModel.bindState(state, symbol);

        return symbol;
    }

    private analyzeSite(site: SiteNode): void {
        for (const page of site.pages) {
            this.analyzeSitePage(page);
        }
    }

    private analyzeSitePage(page: SitePageNode): void {
        this.declaredStates.clear();
        this.declaredSymbols.clear();

        const symbols: SemanticSymbol[] = [];
        let declarationOrder = 0;

        for (const child of page.children) {

            if (child.type === "State") {

                if (this.declaredStates.has(child.name)) {
                    this.diagnostics.report({
                        code: "PUI1002",
                        message: `Duplicate state declaration: ${child.name}`,
                        severity: "error",
                        category: "semantic",
                        ...(child.nameSpan && {
                            line: child.nameSpan.start.line,
                            column: child.nameSpan.start.column
                        })
                    });
                } else {
                    // Validate initializer before declaring the state.
                    this.analyzeExpression(child.value);

                    // Create and register the symbol.
                    const symbol = this.createStateSymbol(
                        child,
                        declarationOrder++
                    );

                    symbols.push(symbol);
                    this.declaredStates.add(child.name);
                    this.declaredSymbols.set(child.name, symbol);
                }
            }

            if (child.type === "Layout") {
                this.analyzeLayout(child.children);
            }
        }

        // Register the page scope.
        this.semanticModel.setPageScope(page, {
            id: `scope_${this.nextScopeId++}`,
            symbols
        });
    }

    private analyzeLayout(
        children: LayoutContentNode[]
    ): void {
        for (const child of children) {
            switch (child.type) {
                case "Text":
                case "Paragraph":
                case "Heading":
                    this.analyzeText(
                        child.text,
                        child.characterSpans,
                        child
                    );
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

    private analyzeText(
        text: string,
        characterSpans?: CharacterSpan[],
        owner?: object
    ): void {
        const matches = text.matchAll(
            /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
        );

        for (const match of matches) {
            const name = match[1];

            if (!name) {
                continue;
            }

            const variableOffset = (match.index ?? 0) + 1;
            const position = characterSpans?.[variableOffset]?.start;

            const symbol = this.declaredSymbols.get(name);

            if (!symbol) {
                this.reportUndefinedVariable(name, position);
                continue;
            }

            if (owner) {
                this.semanticModel.bindTextIdentifier(owner, {
                    name,
                    symbol,
                    offset: variableOffset
                });
            }
        }
    }


    private analyzeExpression(
        expression: ExpressionNode
    ): void {
        switch (expression.type) {
            case "Identifier": {
                const symbol = this.declaredSymbols.get(expression.name);

                if (!symbol) {
                    this.reportUndefinedVariable(
                        expression.name,
                        expression.span?.start
                    );
                } else {
                    this.semanticModel.bindIdentifier(
                        expression,
                        symbol
                    );
                }
                break;
            }

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

        const valueType = this.inferValueType(expression);

        this.semanticModel.bindExpressionType(
            expression,
            valueType
        );
    }


    private analyzeStatements(
        statements: StatementNode[],
        symbols: SemanticSymbol[] = []
    ): void {
        for (const statement of statements) {
            if (statement.type === "State") {

                if (this.declaredStates.has(statement.name)) {
                    this.diagnostics.report({
                        code: "PUI1002",
                        message: `Duplicate state declaration: ${statement.name}`,
                        severity: "error",
                        category: "semantic",
                        ...(statement.nameSpan && {
                            line: statement.nameSpan.start.line,
                            column: statement.nameSpan.start.column
                        })
                    });

                    this.analyzeExpression(statement.value);
                } else {
                    // Validate initializer before declaring the state.
                    this.analyzeExpression(statement.value);

                    // Create and register the symbol.
                    const symbol = this.createStateSymbol(
                        statement,
                        symbols.length
                    );

                    symbols.push(symbol);
                    this.declaredStates.add(statement.name);
                    this.declaredSymbols.set(statement.name, symbol);
                }
            }

            if (statement.type === "Element") {
                if (statement.text !== undefined) {
                    this.analyzeText(
                        statement.text,
                        undefined,
                        statement
                    );
                }

                // Nested elements share the current page scope.
                this.analyzeStatements(statement.children, symbols);
            }

            if (statement.type === "Assignment") {
                if (!this.declaredStates.has(statement.name)) {
                    this.reportUndefinedVariable(
                        statement.name,
                        statement.nameSpan?.start
                    );
                }

                this.analyzeExpression(statement.value);
            }
        }
    }

    private reportUndefinedVariable(
        name: string,
        position?: SourcePosition
    ): void {
        this.diagnostics.report({
            code: "PUI1001",
            message: `Undefined variable: ${name}`,
            severity: "error",
            category: "semantic",
            ...(position && {
                line: position.line,
                column: position.column
            })
        });
    }
}
