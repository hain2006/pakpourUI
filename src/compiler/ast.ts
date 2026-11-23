
/* =========================================
   Program
========================================= */

export type ProgramNode = {
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

export type SiteNode = {
    type: "Site";
    name: string;
    pages: SitePageNode[];
};

export type SitePageNode = {
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

export type SeoNode = {
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

export type LayoutNode = {
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

export type HeadingNode = {
    type: "Heading";
    level: number;
    text: string;
};

export type ParagraphNode = {
    type: "Paragraph";
    text: string;
};

export type TextNode = {
    type: "Text";
    text: string;
};

export type ActionNode = {
    type: "Action";
    label: string;
    children: ActionCommandNode[];
};

export type ActionCommandNode =
    | NavigateNode;

export type NavigateNode = {
    type: "Navigate";
    path: string;
};

/* =========================================
   Conditional Rendering
========================================= */

export type WhenNode = {
    type: "When";
    condition: ExpressionNode;
    children: LayoutContentNode[];
};

/* =========================================
   Legacy Page
   Backward compatibility with old syntax
========================================= */

export type PageNode = {
    type: "Page";
    name: string;
    children: StatementNode[];
};

export type ElementNode = {
    type: "Element";
    name: string;
    text?: string;
    children: StatementNode[];
};

/* =========================================
   State Management
========================================= */

export type StateNode = {
    type: "State";
    name: string;
    value: ExpressionNode;
};

export type AssignmentNode = {
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

export type NumberLiteralNode = {
    type: "NumberLiteral";
    value: number;
};

export type StringLiteralNode = {
    type: "StringLiteral";
    value: string;
};

export type BooleanLiteralNode = {
    type: "BooleanLiteral";
    value: boolean;
};

export type IdentifierNode = {
    type: "Identifier";
    name: string;
};

export type BinaryExpressionNode = {
    type: "BinaryExpression";
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
};

export type UnaryExpressionNode = {
    type: "UnaryExpression";
    operator: string;
    argument: ExpressionNode;
};
