import { Lexer } from "./compiler/lexer";
import { Parser } from "./compiler/parser";
import { CodeGenerator } from "./compiler/generator";

import fs from "node:fs";

const source = fs.readFileSync(
    "examples/counter.pui",
    "utf-8"
);

// 1. Lexer
const lexer = new Lexer(source);
const tokens = lexer.tokenize();

// 2. Parser
const parser = new Parser(tokens);
const ast = parser.parse();

// 3. Code Generator
const generator = new CodeGenerator();
const javascript = generator.generate(ast);

// 4. Save generated JavaScript
fs.mkdirSync("dist", { recursive: true });

fs.writeFileSync(
    "dist/App.js",
    javascript,
    "utf-8"
);

console.log("pakpourUI compilation successful!");
console.log("Generated: dist/App.js");
console.log("\nGenerated JavaScript:\n");
console.log(javascript);