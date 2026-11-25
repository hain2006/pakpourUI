
import { Lexer } from "./compiler/lexer";
import { Parser } from "./compiler/parser";
import { CodeGenerator } from "./compiler/generator";
import { SemanticAnalyzer } from "./compiler/semantic";
import { IRBuilder } from "./compiler/ir/ir-builder";

import fs from "node:fs";

// Read source code
const source = fs.readFileSync(
    "examples/counter.pui",
    "utf-8"
);

// Step 1: Lexer
const lexer = new Lexer(source);
const tokens = lexer.tokenize();

// Step 2: Parser
const parser = new Parser(tokens);
const ast = parser.parse();

// Step 3: Semantic Analysis
const analyzer = new SemanticAnalyzer();
const diagnostics = analyzer.analyze(ast);

// Display diagnostics
for (const diagnostic of diagnostics.getAll()) {
    const prefix = diagnostic.severity.toUpperCase();

    console.log(
        `[${prefix}] ${diagnostic.code}: ${diagnostic.message}`
    );
}

// Stop compilation if errors exist
if (diagnostics.hasErrors) {
    console.error("\npakpourUI compilation failed.");

    // Remove stale generated output
    fs.rmSync("dist/App.js", { force: true });

    process.exitCode = 1;
} else {

    // Step 4: Build Intermediate Representation
    const irBuilder = new IRBuilder(
        analyzer.getSemanticModel()
    );

    const ir = irBuilder.build(ast);

    console.log("\nGenerated Intermediate Representation:\n");
    console.log(JSON.stringify(ir, null, 2));

    // Step 5: Code Generation
    const generator = new CodeGenerator();
    const javascript = generator.generate(ast);

    // Write output
    fs.mkdirSync("dist", { recursive: true });

    fs.writeFileSync(
        "dist/App.js",
        javascript,
        "utf-8"
    );

    console.log("\npakpourUI compilation successful!");
    console.log("Generated: dist/App.js");

    console.log("\nGenerated JavaScript:\n");
    console.log(javascript);
}
