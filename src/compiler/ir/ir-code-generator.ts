
import type {
    IRProgram,
    IRPage,
    IRExpression,
    IRText,
    IRPageContent,
    IRLayoutContent
} from "./ir";


export class IRCodeGenerator {

    private lines: string[] = [];
    private stateVariables = new Map<string, string>();
    private stateCounter = 0;
    private elementCounter = 0;

    private emit(code: string): void {
        this.lines.push(code);
    }


    public generate(program: IRProgram): string {
        this.lines = [];
        this.stateVariables.clear();
        this.stateCounter = 0;
        this.elementCounter = 0;

        this.emit(
            `import { signal, createElement, bindText } from "./runtime.js";`
        );

        this.emit("");

        const pages: IRPage[] = [
            ...program.standalonePages,
            ...program.sites.flatMap(site => site.pages)
        ];

        // Generate an independent function for each page.
        pages.forEach((page, index) => {
            this.generatePage(page, index);
            this.emit("");
        });

        // Generate page selection entry point.
        this.emit("export function render(root, pageId) {");
        this.emit("  root.replaceChildren();");

        this.emit("  switch (pageId) {");

        pages.forEach((page, index) => {
            this.emit(`    case ${JSON.stringify(page.id)}:`);
            this.emit(`      renderPage${index}(root);`);
            this.emit("      break;");
        });

        this.emit("    default:");
        this.emit('      throw new Error(`Unknown page: ${pageId}`);');
        this.emit("  }");

        this.emit("}");

        return this.lines.join("\n");
    }


    private generatePage(page: IRPage, index: number): void {
        this.emit(`export function renderPage${index}(root) {`);
        this.emit(`  // Page: ${page.name}`);

        this.stateVariables.clear();

        const states = page.children.filter(
            child => child.type === "IRState"
        );

        // First pass: register all state variables.
        for (const state of states) {
            const variableName = `state${this.stateCounter++}`;

            this.stateVariables.set(
                state.symbolId,
                variableName
            );
        }

        // Second pass: generate state declarations.
        for (const state of states) {
            const variableName = this.stateVariables.get(
                state.symbolId
            )!;

            const initialValue = this.generateExpression(
                state.initialValue
            );

            this.emit(
                `  const ${variableName} = signal(${initialValue});`
            );
        }

        // Generate page content through the recursive renderer.
        this.generateChildren(page.children, "root");
        this.emit("}");

    }

    private generateChildren(
        children: (IRPageContent | IRLayoutContent)[],
        parent: string
    ): void {

        for (const child of children) {
            switch (child.type) {

                case "IRState":
                    break;

                case "IRAssignment": {
                    const variableName = this.stateVariables.get(
                        child.symbolId
                    );

                    if (!variableName) {
                        throw new Error(
                            `Unknown state symbol: ${child.symbolId}`
                        );
                    }

                    const value = this.generateExpression(child.value);

                    this.emit(
                        `  ${variableName}.value = ${value};`
                    );

                    break;
                }

                case "IRLayout": {
                    const element = `element${this.elementCounter++}`;

                    this.emit(
                        `  const ${element} = createElement("div");`
                    );

                    this.emit(
                        `  ${element}.style.display = "flex";`
                    );

                    this.emit(
                        `  ${element}.style.flexDirection = "${child.direction === "vertical" ? "column" : "row"}";`
                    );

                    this.emit(
                        `  ${parent}.appendChild(${element});`
                    );

                    this.generateChildren(child.children, element);

                    break;
                }

                case "IRHeading": {
                    const element = `element${this.elementCounter++}`;

                    this.emit(
                        `  const ${element} = createElement("h${child.level}");`
                    );

                    this.emit(
                        `  bindText(${element}, ${this.generateText(child.content)});`
                    );

                    this.emit(
                        `  ${parent}.appendChild(${element});`
                    );

                    break;
                }

                case "IRParagraph": {
                    const element = `element${this.elementCounter++}`;

                    this.emit(
                        `  const ${element} = createElement("p");`
                    );

                    this.emit(
                        `  bindText(${element}, ${this.generateText(child.content)});`
                    );

                    this.emit(
                        `  ${parent}.appendChild(${element});`
                    );

                    break;
                }

                case "IRText": {
                    const element = `text${this.elementCounter++}`;

                    this.emit(
                        `  const ${element} = createElement("span");`
                    );

                    this.emit(
                        `  bindText(${element}, ${this.generateText(child.content)});`
                    );

                    this.emit(
                        `  ${parent}.appendChild(${element});`
                    );

                    break;
                }

                case "IRAction": {
                    this.generateAction(child, parent);
                    break;
                }

                case "IRCondition": {
                    const condition = this.generateExpression(
                        child.expression
                    );

                    this.emit(`  if (${condition}) {`);

                    this.generateChildren(
                        child.children,
                        parent
                    );

                    this.emit("  }");

                    break;
                }

                case "IRElement": {
                    const element = `element${this.elementCounter++}`;

                    this.emit(
                        `  const ${element} = createElement(${JSON.stringify(child.name)});`
                    );

                    if (child.text) {
                        this.emit(
                            `  bindText(${element}, ${this.generateText(child.text)});`
                        );
                    }

                    this.emit(
                        `  ${parent}.appendChild(${element});`
                    );

                    this.generateChildren(child.children, element);

                    break;
                }

                default: {
                    const exhaustiveCheck: never = child;

                    throw new Error(
                        `Unknown IR node: ${exhaustiveCheck}`
                    );
                }
            }
        }
    }


    private generateExpression(
        expression: IRExpression
    ): string {

        switch (expression.type) {

            case "IRNumberLiteral":
                return String(expression.value);

            case "IRStringLiteral":
                return JSON.stringify(expression.value);

            case "IRBooleanLiteral":
                return String(expression.value);

            case "IRIdentifier": {
                const variableName = this.stateVariables.get(
                    expression.symbolId
                );

                if (!variableName) {
                    throw new Error(
                        `Unknown state symbol: ${expression.symbolId}`
                    );
                }

                return `${variableName}.value`;
            }

            case "IRBinaryExpression": {
                const allowedOperators = [
                    "+", "-", "*", "/", "%",
                    "==", "!=", "===", "!==",
                    "<", ">", "<=", ">=",
                    "&&", "||"
                ];

                if (!allowedOperators.includes(expression.operator)) {
                    throw new Error(
                        `Unsupported binary operator: ${expression.operator}`
                    );
                }

                const left = this.generateExpression(expression.left);
                const right = this.generateExpression(expression.right);

                return `(${left} ${expression.operator} ${right})`;
            }

            case "IRUnaryExpression": {
                const allowedOperators = ["!", "+", "-"];

                if (!allowedOperators.includes(expression.operator)) {
                    throw new Error(
                        `Unsupported unary operator: ${expression.operator}`
                    );
                }

                const argument = this.generateExpression(
                    expression.argument
                );

                return `(${expression.operator}${argument})`;
            }

            default: {
                const exhaustiveCheck: never = expression;
                throw new Error(
                    `Unknown expression: ${exhaustiveCheck}`
                );
            }
        }
    }

    private generateText(text: IRText): string {
        const segments = text.segments.map(segment => {
            if (segment.type === "StaticText") {
                return segment.value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
            }

            return `\${${this.generateExpression(segment.expression)}}`;
        });

        return `() => \`${segments.join("")}\``;
    }

    private generateAction(
        action: Extract<IRPageContent, { type: "IRAction" }>,
        parent: string
    ): void {
        const element = `element${this.elementCounter++}`;

        this.emit(`  const ${element} = createElement("button");`);
        this.emit(`  ${element}.textContent = ${JSON.stringify(action.label)};`);
        this.emit(`  ${element}.addEventListener("click", () => {`);

        for (const command of action.commands) {
            switch (command.type) {
                case "IRNavigate":
                    this.emit(
                        `    window.location.href = ${JSON.stringify(command.path)};`
                    );
                    break;
            }
        }

        this.emit("  });");
        this.emit(`  ${parent}.appendChild(${element});`);
    }

}
