
export type ProgramNode = {
    type: "Program";
    body: StatementNode[];
};

export type StatementNode =
    | PageNode
    | StateNode
    | ElementNode
    | AssignmentNode;

export type PageNode = {
    type: "Page";
    name: string;
    children: StatementNode[];
};

export type StateNode = {
    type: "State";
    name: string;
    value: ExpressionNode;
};

export type ElementNode = {
    type: "Element";
    name: string;
    text?: string;
    children: StatementNode[];
};

export type AssignmentNode = {
    type: "Assignment";
    name: string;
    value: ExpressionNode;
};

export type ExpressionNode =
    | NumberLiteralNode
    | StringLiteralNode
    | IdentifierNode
    | BinaryExpressionNode;

export type NumberLiteralNode = {
    type: "NumberLiteral";
    value: number;
};

export type StringLiteralNode = {
    type: "StringLiteral";
    value: string;
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
