
import type {
    PageNode,
    SitePageNode,
    StateNode,
    IdentifierNode
} from "./ast";

export type SemanticSymbol = {
    id: string;
    name: string;
    kind: "state";
    valueType: "number" | "string" | "boolean" | "unknown";
    declarationOrder: number;
};

export type SemanticScope = {
    id: string;
    symbols: SemanticSymbol[];
};

export type SemanticTextBinding = {
    name: string;
    symbol: SemanticSymbol;
    offset: number;
};

export type SemanticExpressionType = {
    valueType: "number" | "string" | "boolean" | "unknown";
};

export class SemanticModel {
    private pageScopes = new WeakMap<
        PageNode | SitePageNode,
        SemanticScope
    >();

    private stateSymbols = new WeakMap<
        StateNode,
        SemanticSymbol
    >();

    private identifierSymbols = new WeakMap<
        IdentifierNode,
        SemanticSymbol
    >();

    private textBindings = new WeakMap<
        object,
        SemanticTextBinding[]
    >();

    private expressionTypes = new WeakMap<
        object,
        SemanticExpressionType
    >();

    public setPageScope(
        page: PageNode | SitePageNode,
        scope: SemanticScope
    ): void {
        this.pageScopes.set(page, scope);
    }

    public getPageScope(
        page: PageNode | SitePageNode
    ): SemanticScope | undefined {
        return this.pageScopes.get(page);
    }

    public bindState(
        state: StateNode,
        symbol: SemanticSymbol
    ): void {
        this.stateSymbols.set(state, symbol);
    }

    public getStateSymbol(
        state: StateNode
    ): SemanticSymbol | undefined {
        return this.stateSymbols.get(state);
    }

    public bindIdentifier(
        identifier: IdentifierNode,
        symbol: SemanticSymbol
    ): void {
        this.identifierSymbols.set(identifier, symbol);
    }

    public getIdentifierSymbol(
        identifier: IdentifierNode
    ): SemanticSymbol | undefined {
        return this.identifierSymbols.get(identifier);
    }

    public bindTextIdentifier(
        owner: object,
        binding: SemanticTextBinding
    ): void {
        const bindings = this.textBindings.get(owner) ?? [];

        bindings.push(binding);

        this.textBindings.set(owner, bindings);
    }

    public getTextBindings(
        owner: object
    ): SemanticTextBinding[] {
        return this.textBindings.get(owner) ?? [];
    }

    public bindExpressionType(
        expression: object,
        valueType: SemanticExpressionType["valueType"]
    ): void {
        this.expressionTypes.set(expression, { valueType });
    }

    public getExpressionType(
        expression: object
    ): SemanticExpressionType["valueType"] {
        return this.expressionTypes.get(expression)?.valueType ?? "unknown";
    }
}
