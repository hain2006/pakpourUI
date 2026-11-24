
import type {
    ProgramNode,
    SiteNode,
    SitePageNode,
    PageNode,
    ExpressionNode,
    StatementNode,
    ElementNode
} from "../ast";

import type { SemanticModel } from "../semantic-model";

import type {
    IRProgram,
    IRSite,
    IRPage,
    IRExpression,
    IRLayout,
    IRLayoutContent,
    IRHeading,
    IRParagraph,
    IRTextNode,
    IRIdentifier,
    IRAction,
    IRNavigate,
    IRCondition,
    IRSymbol,
    IRPageContent,
    IRElement,
    IRAssignment,
    IRState
} from "./ir";

function assertNever(value: never): never {
    throw new Error(
        `Unexpected expression: ${JSON.stringify(value)}`
    );
}

export class IRBuilder {
    constructor(
        private semanticModel: SemanticModel
    ) { }


    public build(program: ProgramNode): IRProgram {
        const sites: IRSite[] = [];
        const standalonePages: IRPage[] = [];

        for (const statement of program.body) {
            switch (statement.type) {
                case "Site":
                    sites.push(this.buildSite(statement));
                    break;

                case "Page":
                    standalonePages.push(
                        this.buildLegacyPage(statement)
                    );
                    break;
            }
        }

        return {
            id: "ir_program",
            type: "IRProgram",
            sites,
            standalonePages
        };
    }




    private buildTextNode(
        text: import("../ast").TextNode
    ): IRTextNode {
        const segments: IRTextNode["content"]["segments"] = [];

        const bindings = this.semanticModel.getTextBindings(text);

        const pattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text.text)) !== null) {
            const name = match[1];
            const offset = match.index + 1;

            if (match.index > lastIndex) {
                segments.push({
                    type: "StaticText",
                    value: text.text.slice(lastIndex, match.index)
                });
            }

            const binding = bindings.find(
                item => item.name === name && item.offset === offset
            );

            if (!binding) {
                throw new Error(
                    `Missing semantic binding for text identifier: ${name}`
                );
            }

            segments.push({
                type: "DynamicText",
                expression: {
                    id: `ir_text_identifier_${offset}`,
                    type: "IRIdentifier",
                    name: binding.name,
                    symbolId: binding.symbol.id,
                    valueType: binding.symbol.valueType
                }
            });

            lastIndex = pattern.lastIndex;
        }

        if (lastIndex < text.text.length) {
            segments.push({
                type: "StaticText",
                value: text.text.slice(lastIndex)
            });
        }

        if (segments.length === 0) {
            segments.push({
                type: "StaticText",
                value: text.text
            });
        }

        return {
            id: "ir_text",
            type: "IRText",
            content: { segments },
            ...(text.span && {
                span: text.span
            })
        };
    }





    private buildSite(site: SiteNode): IRSite {
        return {
            id: "ir_site",
            type: "IRSite",
            name: site.name,
            pages: site.pages.map(page =>
                this.buildSitePage(page)
            )
        };
    }



    private buildSitePage(page: SitePageNode): IRPage {
        const scope = this.semanticModel.getPageScope(page);

        if (!scope) {
            throw new Error(
                `Missing semantic scope for page: ${page.name}`
            );
        }

        const seoNode = page.children.find(
            child => child.type === "Seo"
        );


        const children: IRPage["children"] = [];
        for (const child of page.children) {
            if (child.type === "State") {
                const symbol = this.semanticModel.getStateSymbol(child);

                if (!symbol) {
                    throw new Error(
                        `Missing semantic symbol for state: ${child.name}`
                    );
                }

                children.push({
                    id: symbol.id,
                    type: "IRState",
                    symbolId: symbol.id,
                    name: symbol.name,
                    valueType: symbol.valueType,
                    declarationOrder: symbol.declarationOrder,
                    initialValue: this.buildExpression(child.value)
                });
            }

            if (child.type === "Layout") {
                children.push(this.buildLayout(child));
            }
        }



        return {
            id: `ir_page_${page.name}`,
            type: "IRPage",
            name: page.name,
            scope: {
                id: scope.id,
                symbols: scope.symbols.map(symbol => ({
                    id: symbol.id,
                    name: symbol.name,
                    kind: symbol.kind,
                    valueType: symbol.valueType,
                    declarationOrder: symbol.declarationOrder
                }))
            },
            ...(seoNode && {
                seo: {
                    id: `ir_seo_${page.name}`,
                    type: "IRSeo" as const,
                    ...(seoNode.title !== undefined && {
                        title: seoNode.title
                    }),
                    ...(seoNode.description !== undefined && {
                        description: seoNode.description
                    }),
                    ...(seoNode.canonical !== undefined && {
                        canonical: seoNode.canonical
                    }),
                    ...(seoNode.index !== undefined && {
                        index: seoNode.index
                    })
                }
            }),
            children
        };
    }


    private buildHeading(
        heading: import("../ast").HeadingNode
    ): IRHeading {
        return {
            id: "ir_heading",
            type: "IRHeading",
            level: heading.level,
            content: {
                segments: [
                    {
                        type: "StaticText",
                        value: heading.text
                    }
                ]
            },
            ...(heading.span && {
                span: heading.span
            })
        };
    }


    private buildParagraph(
        paragraph: import("../ast").ParagraphNode
    ): IRParagraph {
        return {
            id: "ir_paragraph",
            type: "IRParagraph",
            content: {
                segments: [
                    {
                        type: "StaticText",
                        value: paragraph.text
                    }
                ]
            },
            ...(paragraph.span && {
                span: paragraph.span
            })
        };
    }



    private buildLayout(
        layout: import("../ast").LayoutNode
    ): IRLayout {
        const children: IRLayoutContent[] = [];

        for (const child of layout.children) {
            switch (child.type) {
                case "Heading":
                    children.push(this.buildHeading(child));
                    break;

                case "Paragraph":
                    children.push(this.buildParagraph(child));
                    break;

                case "Text":
                    children.push(this.buildTextNode(child));
                    break;

                case "Action":
                    children.push(this.buildAction(child));
                    break;

                case "When":
                    children.push(this.buildCondition(child));
                    break;
            }
        }

        return {
            id: "ir_layout",
            type: "IRLayout",
            direction: layout.direction,
            children
        };
    }


    private buildAction(
        action: import("../ast").ActionNode
    ): IRAction {
        const commands: IRNavigate[] = action.children.map(
            (command, index) => ({
                id: `ir_navigate_${index}`,
                type: "IRNavigate",
                path: command.path,
                ...(command.span && {
                    span: command.span
                })
            })
        );

        return {
            id: "ir_action",
            type: "IRAction",
            label: action.label,
            commands,
            ...(action.span && {
                span: action.span
            })
        };
    }


    private buildCondition(
        condition: import("../ast").WhenNode
    ): IRCondition {
        const children: IRLayoutContent[] = [];

        for (const child of condition.children) {
            switch (child.type) {
                case "Heading":
                    children.push(this.buildHeading(child));
                    break;

                case "Paragraph":
                    children.push(this.buildParagraph(child));
                    break;

                case "Text":
                    children.push(this.buildTextNode(child));
                    break;

                case "Action":
                    children.push(this.buildAction(child));
                    break;

                case "When":
                    children.push(this.buildCondition(child));
                    break;
            }
        }

        return {
            id: "ir_condition",
            type: "IRCondition",
            expression: this.buildExpression(condition.condition),
            children,
            ...(condition.span && {
                span: condition.span
            })
        };
    }







    private nextLegacyNodeId = 0;

    private buildLegacyStatement(
        statement: StatementNode,
        symbols: IRSymbol[]
    ): IRPageContent {
        switch (statement.type) {
            case "State": {
                const symbol = this.semanticModel.getStateSymbol(statement);

                if (!symbol) {
                    throw new Error(
                        `Missing semantic symbol for state: ${statement.name}`
                    );
                }

                return {
                    id: symbol.id,
                    type: "IRState",
                    symbolId: symbol.id,
                    name: symbol.name,
                    valueType: symbol.valueType,
                    declarationOrder: symbol.declarationOrder,
                    initialValue: this.buildExpression(statement.value),
                    ...(statement.span && {
                        span: statement.span
                    })
                };
            }

            case "Assignment": {
                const symbol = symbols.find(
                    item => item.name === statement.name
                );

                if (!symbol) {
                    throw new Error(
                        `Missing semantic symbol for assignment: ${statement.name}`
                    );
                }

                return {
                    id: `ir_assignment_${this.nextLegacyNodeId++}`,
                    type: "IRAssignment",
                    symbolId: symbol.id,
                    name: statement.name,
                    value: this.buildExpression(statement.value),
                    ...(statement.span && {
                        span: statement.span
                    })
                };
            }

            case "Element":
                return this.buildLegacyElement(statement, symbols);

            default:
                throw new Error(
                    `Unsupported legacy statement: ${statement.type}`
                );
        }
    }

    private buildLegacyElement(
        element: ElementNode,
        symbols: IRSymbol[]
    ): IRElement {
        const children: IRPageContent[] = element.children.map(
            statement => this.buildLegacyStatement(statement, symbols)
        );

        return {
            id: `ir_element_${this.nextLegacyNodeId++}`,
            type: "IRElement",
            name: element.name,
            ...(element.text !== undefined && {
                text: {
                    segments: [
                        {
                            type: "StaticText",
                            value: element.text
                        }
                    ]
                }
            }),
            children,
            ...(element.span && {
                span: element.span
            })
        };
    }



    private buildLegacyPage(page: PageNode): IRPage {
        const scope = this.semanticModel.getPageScope(page);

        if (!scope) {
            throw new Error(
                `Missing semantic scope for page: ${page.name}`
            );
        }

        const symbols: IRSymbol[] = scope.symbols.map(symbol => ({
            id: symbol.id,
            name: symbol.name,
            kind: symbol.kind,
            valueType: symbol.valueType,
            declarationOrder: symbol.declarationOrder
        }));

        const children: IRPageContent[] = page.children.map(
            statement => this.buildLegacyStatement(statement, symbols)
        );

        return {
            id: `ir_legacy_page_${page.name}`,
            type: "IRPage",
            name: page.name,
            scope: {
                id: scope.id,
                symbols
            },
            children
        };
    }




    private buildExpression(
        expression: ExpressionNode
    ): IRExpression {
        switch (expression.type) {
            case "NumberLiteral":
                return {
                    id: "ir_number",
                    type: "IRNumberLiteral",
                    value: expression.value,
                    ...(expression.span && {
                        span: expression.span
                    })
                };

            case "StringLiteral":
                return {
                    id: "ir_string",
                    type: "IRStringLiteral",
                    value: expression.value,
                    ...(expression.span && {
                        span: expression.span
                    })
                };

            case "BooleanLiteral":
                return {
                    id: "ir_boolean",
                    type: "IRBooleanLiteral",
                    value: expression.value,
                    ...(expression.span && {
                        span: expression.span
                    })
                };
            case "Identifier": {
                const symbol = this.semanticModel.getIdentifierSymbol(expression);

                if (!symbol) {
                    throw new Error(
                        `Missing semantic symbol for identifier: ${expression.name}`
                    );
                }

                return {
                    id: `ir_identifier_${symbol.id}`,
                    type: "IRIdentifier",
                    name: expression.name,
                    symbolId: symbol.id,
                    valueType: this.semanticModel.getExpressionType(expression),
                    ...(expression.span && {
                        span: expression.span
                    })
                };
            }
            case "BinaryExpression":
                return {
                    id: "ir_binary",
                    type: "IRBinaryExpression",
                    operator: expression.operator,
                    left: this.buildExpression(expression.left),
                    right: this.buildExpression(expression.right),
                    valueType: this.semanticModel.getExpressionType(expression),
                    ...(expression.span && {
                        span: expression.span
                    })
                };
            case "UnaryExpression":
                return {
                    id: "ir_unary",
                    type: "IRUnaryExpression",
                    operator: expression.operator,
                    argument: this.buildExpression(expression.argument),
                    valueType: this.semanticModel.getExpressionType(expression),
                    ...(expression.span && {
                        span: expression.span
                    })
                };

            default:
                return assertNever(expression);
        }
    }

}
