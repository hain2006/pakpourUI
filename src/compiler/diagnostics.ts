
export type DiagnosticSeverity =
    | "error"
    | "warning"
    | "info";

export type DiagnosticCategory =
    | "syntax"
    | "semantic"
    | "seo"
    | "accessibility"
    | "performance";

export interface Diagnostic {
    code: string;
    message: string;
    severity: DiagnosticSeverity;
    category: DiagnosticCategory;

    line?: number;
    column?: number;
}

export class DiagnosticBag {
    private diagnostics: Diagnostic[] = [];

    public report(diagnostic: Diagnostic): void {
        this.diagnostics.push(diagnostic);
    }

    public getAll(): Diagnostic[] {
        return [...this.diagnostics];
    }

    public getErrors(): Diagnostic[] {
        return this.diagnostics.filter(
            item => item.severity === "error"
        );
    }

    public getWarnings(): Diagnostic[] {
        return this.diagnostics.filter(
            item => item.severity === "warning"
        );
    }

    public get hasErrors(): boolean {
        return this.diagnostics.some(
            item => item.severity === "error"
        );
    }

    public get count(): number {
        return this.diagnostics.length;
    }

    public clear(): void {
        this.diagnostics = [];
    }
}
