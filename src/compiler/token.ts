
export enum TokenType {
    Identifier,
    String,
    Number,

    // Site structure
    Site,
    Page,

    // SEO
    Seo,
    Title,
    Description,
    Canonical,
    Index,

    // Layout
    Layout,
    Vertical,
    Horizontal,

    // Elements
    Heading,
    Paragraph,
    Text,
    Action,

    // Application logic
    State,
    When,
    Navigate,
    True,
    False,

    // Legacy elements
    Column,
    Row,
    Button,

    // Braces
    LeftBrace,
    RightBrace,

    // Arithmetic
    Equals,
    Plus,
    Minus,
    Multiply,
    Divide,

    // Comparison
    EqualEqual,
    NotEquals,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,

    EOF
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
