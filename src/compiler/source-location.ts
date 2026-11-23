
export type SourcePosition = {
    offset: number;
    line: number;
    column: number;
};

export type SourceSpan = {
    start: SourcePosition;
    end: SourcePosition;
};

export type CharacterSpan = {
    start: SourcePosition;
    end: SourcePosition;
};