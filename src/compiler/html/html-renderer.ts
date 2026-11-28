import type {
    IRProgram,
    IRPage,
    IRText,
    IRHeading,
    IRParagraph,
    IRLayout,
    IRLayoutContent,
    IRAction,
    IRCondition,
    IRElement,
    IRExpression
} from "../ir/ir";

export type HTMLRenderResult = {
    siteName?: string;
    pageName: string;
    html: string;
};

export class HTMLRenderer {
    private stateValues = new Map<string, unknown>();
    private readonly voidElements = new Set([
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    ]);
    private readonly urlAttributes = new Set([
        "href",
        "src",
        "action",
        "formaction",
        "poster",
        "cite",
        "data",
        "background",
        "xlink:href"
    ]);
    public render(program: IRProgram): HTMLRenderResult[] {
        const results: HTMLRenderResult[] = [];

        // صفحات مستقل
        for (const page of program.standalonePages) {
            results.push({
                pageName: page.name,
                html: this.renderPage(page)
            });
        }

        // صفحات متعلق به سایت‌ها
        for (const site of program.sites) {
            for (const page of site.pages) {
                results.push({
                    siteName: site.name,
                    pageName: page.name,
                    html: this.renderPage(page)
                });
            }
        }

        return results;
    }

    private renderPage(page: IRPage): string {
        this.stateValues.clear();

        const states = page.children
            .filter(child => child.type === "IRState")
            .sort((a, b) => a.declarationOrder - b.declarationOrder);

        for (const state of states) {
            const value = this.evaluateExpression(state.initialValue);

            this.stateValues.set(state.symbolId, value);
        }
        const head = this.renderHead(page);

        const body = this.renderBody(page);

        return [
            "<!DOCTYPE html>",
            '<html lang="en">',
            "<head>",
            head,
            "</head>",
            "<body>",
            body,
            "</body>",
            "</html>"
        ].join("\n");
    }

    private renderHead(page: IRPage): string {
        const parts: string[] = [
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            `<title>${this.escapeHTML(page.seo?.title ?? page.name)}</title>`
        ];

        if (page.seo?.description) {
            parts.push(
                `<meta name="description" content="${this.escapeHTML(page.seo.description)}">`
            );
        }

        if (page.seo?.canonical) {
            parts.push(
                `<link rel="canonical" href="${this.escapeHTML(page.seo.canonical)}">`
            );
        }

        if (page.seo?.index === false) {
            parts.push(
                '<meta name="robots" content="noindex">'
            );
        }

        return parts.join("\n");
    }
    private renderBody(page: IRPage): string {
        return page.children
            .map(child => this.renderNode(child))
            .filter(Boolean)
            .join("\n");
    }
    private renderNode(
        node: IRPage["children"][number]
    ): string {
        switch (node.type) {
            case "IRState":
            case "IRAssignment":
                return "";

            case "IRLayout":
                return this.renderLayout(node);

            case "IRHeading":
                return this.renderHeading(node);

            case "IRParagraph":
                return this.renderParagraph(node);

            case "IRText":
                return this.renderText(node.content);

            case "IRAction":
                return this.renderAction(node);

            case "IRCondition":
                return this.renderCondition(node);

            case "IRElement":
                return this.renderElement(node);

            default:
                return "";
        }
    }

    private escapeHTML(value: string): string {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    private evaluateExpression(
        expression: IRExpression
    ): unknown {
        switch (expression.type) {
            case "IRNumberLiteral":
            case "IRStringLiteral":
            case "IRBooleanLiteral":
                return expression.value;

            case "IRIdentifier":
                return this.stateValues.get(expression.symbolId);

            case "IRUnaryExpression": {
                const value = this.evaluateExpression(
                    expression.argument
                );

                if (expression.operator === "-") {
                    if (typeof value !== "number") {
                        throw new Error(
                            "Unary '-' requires a number."
                        );
                    }

                    return -value;
                }

                throw new Error(
                    `Unsupported unary operator: ${expression.operator}`
                );
            }

            case "IRBinaryExpression": {
                const left = this.evaluateExpression(expression.left);
                const right = this.evaluateExpression(expression.right);

                switch (expression.operator) {
                    case "+":
                        if (
                            typeof left === "number" &&
                            typeof right === "number"
                        ) {
                            return left + right;
                        }

                        if (
                            typeof left === "string" &&
                            typeof right === "string"
                        ) {
                            return left + right;
                        }

                        throw new Error(
                            "Operator '+' requires two numbers or two strings."
                        );

                    case "-":
                    case "*":
                    case "/":
                        if (
                            typeof left !== "number" ||
                            typeof right !== "number"
                        ) {
                            throw new Error(
                                `Operator '${expression.operator}' requires two numbers.`
                            );
                        }

                        switch (expression.operator) {
                            case "-":
                                return left - right;
                            case "*":
                                return left * right;
                            case "/":
                                return left / right;
                        }
                        break;

                    case "==":
                        return left === right;

                    case "!=":
                        return left !== right;

                    case ">":
                    case "<":
                    case ">=":
                    case "<=":
                        if (
                            typeof left !== "number" ||
                            typeof right !== "number"
                        ) {
                            throw new Error(
                                `Operator '${expression.operator}' requires two numbers.`
                            );
                        }

                        switch (expression.operator) {
                            case ">":
                                return left > right;
                            case "<":
                                return left < right;
                            case ">=":
                                return left >= right;
                            case "<=":
                                return left <= right;
                        }

                        break;

                    default:
                        throw new Error(
                            `Unsupported binary operator: ${expression.operator}`
                        );
                }
            }
        }
    }
    private renderText(text: IRText): string {
        return text.segments
            .map(segment => {
                if (segment.type === "StaticText") {
                    return this.escapeHTML(segment.value);
                }

                const value = this.evaluateExpression(
                    segment.expression
                );

                return this.escapeHTML(
                    value === null || value === undefined
                        ? ""
                        : String(value)
                );
            })
            .join("");
    }
    private renderHeading(node: IRHeading): string {
        const level = node.level;

        return `<h${level}>${this.renderText(node.content)}</h${level}>`;
    }

    private renderParagraph(node: IRParagraph): string {
        return `<p>${this.renderText(node.content)}</p>`;
    }
    private renderLayout(node: IRLayout): string {
        const children = node.children
            .map(child => this.renderLayoutNode(child))
            .join("\n");

        const direction =
            node.direction === "horizontal" ? "row" : "column";

        return [
            '<div style="display: flex;',
            ` flex-direction: ${direction};`,
            '">',
            children,
            "</div>"
        ].join("");
    }
    private renderLayoutNode(
        node: IRLayoutContent
    ): string {
        switch (node.type) {
            case "IRHeading":
                return this.renderHeading(node);

            case "IRParagraph":
                return this.renderParagraph(node);

            case "IRText":
                return this.renderText(node.content);

            case "IRAction":
                return this.renderAction(node);

            case "IRCondition":
                return this.renderCondition(node);
            case "IRElement":
                return this.renderElement(node);
            case "IRLayout":
                return this.renderLayout(node);

            default:
                return "";
        }
    }

    private renderAction(node: IRAction): string {
        return `<button type="button">${this.escapeHTML(node.label)}</button>`;
    }
    private renderCondition(node: IRCondition): string {
        const condition = this.evaluateExpression(node.expression);

        if (!condition) {
            return "";
        }

        return node.children
            .map(child => this.renderLayoutNode(child))
            .join("\n");
    }

    private renderElement(node: IRElement): string {
        const tagName = node.name.toLowerCase();

        if (!this.isValidTagName(tagName)) {
            throw new Error(`Invalid HTML tag name: ${node.name}`);
        }

        const booleanAttributes = new Set([
            "allowfullscreen",
            "async",
            "autofocus",
            "autoplay",
            "checked",
            "controls",
            "default",
            "defer",
            "disabled",
            "formnovalidate",
            "hidden",
            "inert",
            "ismap",
            "itemscope",
            "loop",
            "multiple",
            "muted",
            "nomodule",
            "novalidate",
            "open",
            "playsinline",
            "readonly",
            "required",
            "reversed",
            "selected"
        ]);

        const attributes = (node.attributes ?? [])
            .map(attribute => {
                const name = attribute.name.toLowerCase();

                if (!this.isValidAttributeName(name)) {
                    throw new Error(`Invalid HTML attribute name: ${attribute.name}`);
                }

                // Prevent inline JavaScript event handlers.
                if (name.startsWith("on")) {
                    throw new Error(`Unsafe HTML attribute: ${attribute.name}`);
                }

                const value = attribute.value;

                let resolvedValue: unknown;

                if (value.type === "DynamicAttributeValue") {
                    resolvedValue = this.evaluateExpression(
                        value.expression
                    );
                } else {
                    resolvedValue = value.value;
                }

                if (resolvedValue === null || resolvedValue === undefined) {
                    return "";
                }
                if (
                    this.urlAttributes.has(name) &&
                    !this.isSafeURL(String(resolvedValue))
                ) {
                    throw new Error(
                        `Unsafe URL in HTML attribute '${attribute.name}': ${String(resolvedValue)}`
                    );
                }

                if (
                    name === "srcset" &&
                    !this.isSafeSrcset(String(resolvedValue))
                ) {
                    throw new Error(
                        `Unsafe URL in HTML attribute '${attribute.name}': ${String(resolvedValue)}`
                    );
                }

                if (booleanAttributes.has(name)) {
                    return resolvedValue === false ||
                        resolvedValue === "false" ||
                        resolvedValue === 0
                        ? ""
                        : name;
                }

                if (typeof resolvedValue === "boolean") {
                    return `${name}="${String(resolvedValue)}"`;
                }

                return `${name}="${this.escapeHTML(String(resolvedValue))}"`;
            })
            .filter(attribute => attribute !== "")
            .join(" ");

        const attributeString = attributes
            ? ` ${attributes}`
            : "";

        if (this.voidElements.has(tagName)) {
            return `<${tagName}${attributeString}>`;
        }

        const text = node.text
            ? this.renderText(node.text)
            : "";

        const children = node.children
            .map(child => this.renderNode(child))
            .join("\n");

        return `<${tagName}${attributeString}>${text}${children}</${tagName}>`;
    }

    private isValidTagName(name: string): boolean {
        return /^[a-z][a-z0-9-]*$/i.test(name);
    }
    private isValidAttributeName(name: string): boolean {
        return /^[a-zA-Z_:][a-zA-Z0-9:._-]*$/.test(name);
    }
    private isSafeURL(value: string): boolean {
        const trimmedValue = value.trim();

        // Reject empty values containing only control characters.
        if (/[\u0000-\u001F\u007F-\u009F]/.test(trimmedValue)) {
            return false;
        }

        // Normalize URL for protocol inspection.
        const normalizedValue = trimmedValue
            .replace(/[\u0000-\u0020\u007f-\u009f]/g, "")
            .toLowerCase();

        // Reject dangerous executable protocols.
        const unsafeProtocols = [
            "javascript:",
            "vbscript:",
            "data:"
        ];

        if (
            unsafeProtocols.some(protocol =>
                normalizedValue.startsWith(protocol)
            )
        ) {
            return false;
        }

        // Reject encoded protocol separators and suspicious schemes.
        if (/^%[0-9a-f]{2}/i.test(normalizedValue)) {
            return false;
        }

        // Detect explicit URL schemes.
        const schemeMatch = normalizedValue.match(/^([a-z][a-z0-9+.-]*):/);

        if (schemeMatch) {
            const allowedProtocols = [
                "http:",
                "https:",
                "mailto:",
                "tel:",
                "ftp:"
            ];

            if (!allowedProtocols.includes(`${schemeMatch[1]}:`)) {
                return false;
            }
        }

        return true;
    }

    private isSafeSrcset(value: string): boolean {
        const candidates: Array<{
            url: string;
            descriptor?: string;
        }> = [];

        let index = 0;

        const isWhitespace = (char: string): boolean =>
            /\s/.test(char);

        while (index < value.length) {
            // Skip leading whitespace.
            while (
                index < value.length &&
                isWhitespace(value[index]!)
            ) {
                index++;
            }

            if (index >= value.length) {
                break;
            }

            // Empty candidates are not allowed.
            if (value[index] === ",") {
                return false;
            }

            // Read URL until whitespace.
            const urlStart = index;

            while (
                index < value.length &&
                !isWhitespace(value[index]!)
            ) {
                index++;
            }

            let urlToken = value.slice(urlStart, index);

            // Trailing commas separate candidates.
            let trailingCommas = 0;

            while (urlToken.endsWith(",")) {
                urlToken = urlToken.slice(0, -1);
                trailingCommas++;
            }

            if (!urlToken || trailingCommas > 1) {
                return false;
            }

            if (!this.isSafeURL(urlToken)) {
                return false;
            }

            // A trailing comma means this candidate has no descriptor.
            if (trailingCommas === 1) {
                candidates.push({ url: urlToken });
                continue;
            }

            // Read optional descriptor until the next comma.
            while (
                index < value.length &&
                isWhitespace(value[index]!)
            ) {
                index++;
            }

            const descriptorStart = index;

            while (
                index < value.length &&
                value[index] !== ","
            ) {
                index++;
            }

            const descriptorText = value
                .slice(descriptorStart, index)
                .trim();

            const descriptors = descriptorText
                ? descriptorText.split(/\s+/)
                : [];

            if (descriptors.length > 1) {
                return false;
            }

            let descriptor: string | undefined;

            if (descriptors.length === 1) {
                descriptor = descriptors[0]!;

                const validWidth = /^\d+w$/.test(descriptor);

                const validDensity =
                    /^(?:\d+(?:\.\d+)?|\.\d+)x$/.test(descriptor);

                if (!validWidth && !validDensity) {
                    return false;
                }

                if (
                    validWidth &&
                    Number.parseInt(descriptor, 10) <= 0
                ) {
                    return false;
                }

                if (
                    validDensity &&
                    Number.parseFloat(descriptor) <= 0
                ) {
                    return false;
                }
            }

            candidates.push(
                descriptor === undefined
                    ? { url: urlToken }
                    : { url: urlToken, descriptor }
            );

            // Consume candidate separator.
            if (index < value.length && value[index] === ",") {
                index++;
            }
        }

        if (candidates.length === 0) {
            return false;
        }

        // Do not mix width and density descriptors.
        const hasWidth = candidates.some(
            candidate => candidate.descriptor?.endsWith("w")
        );

        const hasDensity = candidates.some(
            candidate => candidate.descriptor?.endsWith("x")
        );

        if (hasWidth && hasDensity) {
            return false;
        }

        return true;
    }

}