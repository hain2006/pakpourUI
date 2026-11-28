
import type { SourceSpan } from "../source-location";

/* =========================================
   Common
========================================= */

export type IRValueType =
    | "number"
    | "string"
    | "boolean"
    | "unknown";

export type IRNode = {
    id: string;
    span?: SourceSpan;
};

/* =========================================
   Program
========================================= */

export type IRProgram = IRNode & {
    type: "IRProgram";
    sites: IRSite[];
    standalonePages: IRPage[];
};

/* =========================================
   Site
========================================= */

export type IRSite = IRNode & {
    type: "IRSite";
    name: string;
    pages: IRPage[];
};

/* =========================================
   Page Scope
========================================= */

export type IRScope = {
    id: string;
    symbols: IRSymbol[];
};

export type IRSymbol = {
    id: string;
    name: string;
    kind: "state";
    valueType: IRValueType;
    declarationOrder: number;
};

export type IRPage = IRNode & {
    type: "IRPage";
    name: string;
    scope: IRScope;
    seo?: IRSeo;
    children: IRPageContent[];
};

/* =========================================
   SEO
========================================= */

export type IROpenGraph = {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
    siteName?: string;
    locale?: string;
};

export type IRTwitterCard = {
    card?: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
};
export type IRStructuredData = Record<string, unknown>;
export type IRSeo = IRNode & {
    type: "IRSeo";

    // Basic SEO
    title?: string;
    description?: string;
    canonical?: string;
    index?: boolean;

    // Social metadata
    openGraph?: IROpenGraph;
    twitter?: IRTwitterCard;

    // Browser metadata
    favicon?: string;
    themeColor?: string;

    // Structured Data (JSON-LD)
    structuredData?: IRStructuredData | IRStructuredData[];
};

/* =========================================
   State
========================================= */

export type IRState = IRNode & {
    type: "IRState";
    symbolId: string;
    name: string;
    valueType: IRValueType;
    declarationOrder: number;
    initialValue: IRExpression;
};

/* =========================================
   Layout
========================================= */

export type IRLayout = IRNode & {
    type: "IRLayout";
    direction: "vertical" | "horizontal";
    children: IRLayoutContent[];
};

/* =========================================
   UI Elements
========================================= */

export type IRHeading = IRNode & {
    type: "IRHeading";
    level: number;
    content: IRText;
};

export type IRParagraph = IRNode & {
    type: "IRParagraph";
    content: IRText;
};

export type IRTextNode = IRNode & {
    type: "IRText";
    content: IRText;
};

export type IRAttributeValue =
    | {
        type: "StaticAttributeValue";
        value: string;
    }
    | {
        type: "DynamicAttributeValue";
        expression: IRExpression;
    };

export type IRAttribute = {
    name: string;
    value: IRAttributeValue;
};

export type IRElement = IRNode & {
    type: "IRElement";
    name: string;
    attributes?: IRAttribute[];
    text?: IRText;
    children: IRPageContent[];
};

/* =========================================
   Text Segments
========================================= */

export type IRText = {
    segments: IRTextSegment[];
};

export type IRTextSegment =
    | {
        type: "StaticText";
        value: string;
    }
    | {
        type: "DynamicText";
        expression: IRExpression;
    };

/* =========================================
   Actions
========================================= */

export type IRAction = IRNode & {
    type: "IRAction";
    label: string;
    commands: IRActionCommand[];
};

export type IRNavigate = IRNode & {
    type: "IRNavigate";
    path: string;
};

export type IRActionCommand =
    | IRNavigate
    | IRAssignment;

/* =========================================
   Conditional Rendering
========================================= */

export type IRCondition = IRNode & {
    type: "IRCondition";
    expression: IRExpression;
    children: IRLayoutContent[];
};

/* =========================================
   Assignments
========================================= */

export type IRAssignment = IRNode & {
    type: "IRAssignment";
    symbolId: string;
    name: string;
    value: IRExpression;
};

/* =========================================
   Expressions
========================================= */

export type IRExpression =
    | IRNumberLiteral
    | IRStringLiteral
    | IRBooleanLiteral
    | IRIdentifier
    | IRBinaryExpression
    | IRUnaryExpression;

export type IRNumberLiteral = IRNode & {
    type: "IRNumberLiteral";
    value: number;
};

export type IRStringLiteral = IRNode & {
    type: "IRStringLiteral";
    value: string;
};

export type IRBooleanLiteral = IRNode & {
    type: "IRBooleanLiteral";
    value: boolean;
};

export type IRIdentifier = IRNode & {
    type: "IRIdentifier";
    name: string;
    symbolId: string;
    valueType: IRValueType;
};

export type IRBinaryExpression = IRNode & {
    type: "IRBinaryExpression";
    operator: string;
    left: IRExpression;
    right: IRExpression;
    valueType: IRValueType;
};

export type IRUnaryExpression = IRNode & {
    type: "IRUnaryExpression";
    operator: string;
    argument: IRExpression;
    valueType: IRValueType;
};

/* =========================================
   Content Collections
========================================= */


export type IRPageContent =
    | IRState
    | IRLayout
    | IRHeading
    | IRParagraph
    | IRTextNode
    | IRAction
    | IRCondition
    | IRElement
    | IRAssignment;

export type IRLayoutContent =
    | IRLayout
    | IRHeading
    | IRParagraph
    | IRTextNode
    | IRAction
    | IRCondition
    | IRElement
    | IRAssignment;

