
import {
    ProgramNode,
    PageNode,
    StatementNode,
    ElementNode,
    ExpressionNode,
    StateNode
} from "./ast";

export class CodeGenerator {
    private lines: string[] = [];
    private id = 0;
    private stateNames = new Set<string>();

    private emit(code: string): void {
        this.lines.push(code);
    }

    private nextId(): string {
        return `el${this.id++}`;
    }

    public generate(program: ProgramNode): string {
        this.lines = [];
        this.id = 0;

        this.emit(
            `import { signal, createElement, bindText } from "./runtime.js";`
        );

        this.emit("");
        this.emit("export function render(root) {");

        for (const statement of program.body) {
            if (statement.type === "Page") {
                this.generatePage(statement);
            }
        }

        this.emit("}");

        return this.lines.join("\n");
    }

    private generatePage(page: PageNode): void {
        this.emit(`  document.title = ${JSON.stringify(page.name)};`);

        this.stateNames.clear();
        this.collectStates(page.children);

        for (const statement of page.children) {
            if (statement.type === "State") {
                this.generateState(statement);
            }
        }

        const root = this.nextId();

        this.emit(`  const ${root} = createElement("main");`);

        for (const child of page.children) {
            if (child.type !== "State") {
                this.generateNode(child, root, 2);
            }
        }

        this.emit(`  root.replaceChildren(${root});`);
    }

    private collectStates(nodes: StatementNode[]): void {
        for (const node of nodes) {
            if (node.type === "State") {
                this.stateNames.add(node.name);
            }

            if (node.type === "Element") {
                this.collectStates(node.children);
            }
        }
    }

    private generateState(node: StateNode): void {
        this.emit(
            `  const ${node.name} = signal(${this.generateExpression(node.value)});`
        );
    }

    private generateNode(
        node: StatementNode,
        parent: string,
        indent: number
    ): void {
        if (node.type !== "Element") return;

        const spaces = " ".repeat(indent);
        const id = this.nextId();

        const tags: Record<string, string> = {
            column: "div",
            row: "div",
            heading: "h2",
            text: "span",
            button: "button"
        };

        const tag = tags[node.name];

        if (!tag) {
            throw new Error(`Unknown element: ${node.name}`);
        }

        this.emit(
            `${spaces}const ${id} = createElement(${JSON.stringify(tag)});`
        );

        if (node.name === "column") {
            this.emit(
                `${spaces}${id}.style.display = "flex";`
            );
            this.emit(
                `${spaces}${id}.style.flexDirection = "column";`
            );
        }

        if (node.name === "row") {
            this.emit(
                `${spaces}${id}.style.display = "flex";`
            );
            this.emit(
                `${spaces}${id}.style.flexDirection = "row";`
            );
        }

        if (node.name === "text" || node.name === "heading") {
            const expression = this.generateTextExpression(
                node.text ?? ""
            );

            this.emit(
                `${spaces}bindText(${id}, () => ${expression});`
            );
        }

        if (node.name === "button") {
            this.emit(
                `${spaces}${id}.textContent = ${JSON.stringify(node.text ?? "")};`
            );

            this.emit(
                `${spaces}${id}.addEventListener("click", () => {`
            );

            for (const child of node.children) {
                if (child.type === "Assignment") {
                    const value = this.generateExpression(child.value);

                    this.emit(
                        `${spaces}  ${child.name}.value = ${value};`
                    );
                }
            }

            this.emit(`${spaces}});`);
        }

        this.emit(`${spaces}${parent}.appendChild(${id});`);

        if (node.name !== "button") {
            for (const child of node.children) {
                this.generateNode(child, id, indent);
            }
        }
    }

    private generateExpression(expression: ExpressionNode): string {
        switch (expression.type) {
            case "NumberLiteral":
                return String(expression.value);

            case "StringLiteral":
                return JSON.stringify(expression.value);

            case "Identifier":
                if (!this.stateNames.has(expression.name)) {
                    throw new Error(
                        `Unknown state: ${expression.name}`
                    );
                }

                return `${expression.name}.value`;

            case "BinaryExpression":
                return `(${this.generateExpression(expression.left)} ${expression.operator} ${this.generateExpression(expression.right)})`;
        }
    }

    private generateTextExpression(text: string): string {
        const escaped = text
            .replace(/\\/g, "\\\\")
            .replace(/`/g, "\\`")
            .replace(/\$\{/g, "\\${");

        const template = escaped.replace(
            /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
            (_match, name: string) => {
                if (!this.stateNames.has(name)) {
                    throw new Error(`Unknown state: ${name}`);
                }

                return `\${${name}.value}`;
            }
        );

        return `\`${template}\``;
    }
}
