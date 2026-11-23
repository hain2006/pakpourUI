
export enum TokenType {
    Identifier,
    String,
    Number,

    Page,
    State,

    Column,
    Row,
    Heading,
    Text,
    Button,

    LeftBrace,
    RightBrace,
    Equals,
    Plus,

    EOF
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
