
/* =========================================
   Program
========================================= */
import type { SourceSpan } from "./source-location";

export type LocatedNode = {
    span?: SourceSpan;
};
export type ProgramNode = LocatedNode & {
    type: "Program";
    body: StatementNode[];
};

/* =========================================
   Statements
========================================= */

export type StatementNode =
    | SiteNode
    | PageNode
    | StateNode
    | ElementNode
    | AssignmentNode
    | SeoNode
    | LayoutNode
    | HeadingNode
    | ParagraphNode
    | TextNode
    | ActionNode
    | NavigateNode
    | WhenNode;

/* =========================================
   Site
========================================= */

export type SiteNode = LocatedNode & {
    type: "Site";
    name: string;
    pages: SitePageNode[];
};

export type SitePageNode = LocatedNode & {
    type: "SitePage";
    name: string;
    children: PageContentNode[];
};

export type PageContentNode =
    | SeoNode
    | StateNode
    | LayoutNode;

/* =========================================
   SEO
========================================= */

export type SeoNode = LocatedNode & {
    type: "Seo";
    title?: string;
    description?: string;
    canonical?: string;
    index?: boolean;
};

/* =========================================
   Layout
========================================= */

export type LayoutDirection = "vertical" | "horizontal";

export type LayoutNode = LocatedNode & {
    type: "Layout";
    direction: LayoutDirection;
    children: LayoutContentNode[];
};

export type LayoutContentNode =
    | HeadingNode
    | ParagraphNode
    | TextNode
    | ActionNode
    | WhenNode
    | ElementNode;

/* =========================================
   UI Elements
========================================= */

export type HeadingNode = LocatedNode & {
    type: "Heading";
    level: number;
    text: string;
};

export type ParagraphNode = LocatedNode & {
    type: "Paragraph";
    text: string;
};

export type TextNode = LocatedNode & {
    type: "Text";
    text: string;
};

export type ActionNode = LocatedNode & {
    type: "Action";
    label: string;
    children: ActionCommandNode[];
};

export type ActionCommandNode =
    | NavigateNode;

export type NavigateNode = LocatedNode & {
    type: "Navigate";
    path: string;
};

/* =========================================
   Conditional Rendering
========================================= */

export type WhenNode = LocatedNode & {
    type: "When";
    condition: ExpressionNode;
    children: LayoutContentNode[];
};

/* =========================================
   Legacy Page
   Backward compatibility with old syntax
========================================= */

export type PageNode = LocatedNode & {
    type: "Page";
    name: string;
    children: StatementNode[];
};

export type ElementNode = LocatedNode & {
    type: "Element";
    name: string;
    text?: string;
    children: StatementNode[];
};

/* =========================================
   State Management
========================================= */

export type StateNode = LocatedNode & {
    type: "State";
    name: string;
    value: ExpressionNode;
};

export type AssignmentNode = LocatedNode & {
    type: "Assignment";
    name: string;
    value: ExpressionNode;
};

/* =========================================
   Expressions
========================================= */

export type ExpressionNode =
    | NumberLiteralNode
    | StringLiteralNode
    | BooleanLiteralNode
    | IdentifierNode
    | BinaryExpressionNode
    | UnaryExpressionNode;

export type NumberLiteralNode = LocatedNode & {
    type: "NumberLiteral";
    value: number;
};

export type StringLiteralNode = LocatedNode & {
    type: "StringLiteral";
    value: string;
};

export type BooleanLiteralNode = LocatedNode & {
    type: "BooleanLiteral";
    value: boolean;
};

export type IdentifierNode = LocatedNode & {
    type: "Identifier";
    name: string;
};

export type BinaryExpressionNode = LocatedNode & {
    type: "BinaryExpression";
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
};

export type UnaryExpressionNode = LocatedNode & {
    type: "UnaryExpression";
    operator: string;
    argument: ExpressionNode;
};
