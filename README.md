# pakpourUI

**One Language. Websites & Web Applications.**

pakpourUI is an experimental, independent UI programming language and compiler built with TypeScript.

The project explores a new approach to building web interfaces through a custom, readable programming language. Developers describe websites and web applications using `.pui` source files, which are processed through a dedicated compiler architecture.

pakpourUI is being designed with its own syntax, lexer, parser, semantic analysis, intermediate representation, JavaScript code generator, and reactive runtime.

The long-term vision is to build a complete UI development ecosystem rather than another wrapper around an existing JavaScript framework.

---

## Project Vision

The goal of pakpourUI is to create an independent language for building both websites and interactive web applications.

Key principles:

- **Independent Language:** A custom syntax and language specification.
- **Compiler-First Architecture:** A dedicated compiler pipeline with semantic analysis and an intermediate representation.
- **SEO-First Development:** Search engine optimization as a built-in language and compiler capability.
- **HTML-First Rendering:** Generate semantic, accessible HTML rather than relying entirely on client-side rendering.
- **Reactive Runtime:** Build interactive interfaces using a lightweight signal-based reactive system.
- **No Virtual DOM:** Explore direct DOM updates through reactive dependencies.
- **Unified Development:** Use one language for websites and web applications.

These principles guide the architecture; some are still roadmap goals rather than completed features.

## Current Features

### Language and Compiler

- Custom lexer and tokenization system
- Parser and Abstract Syntax Tree (AST)
- Site and page declarations
- UI element and layout declarations
- State declarations
- Variable assignments
- Arithmetic and comparison expressions
- Conditional declarations using `when`
- Actions and navigation declarations
- Source location tracking
- Character-level source position tracking

### Semantic Analysis

- State declaration validation
- Duplicate declaration detection
- Undefined variable detection
- Declaration-order validation
- Independent page scopes
- Symbol table and semantic model
- Identifier-to-symbol binding
- Dynamic text binding
- Expression type inference
- Semantic diagnostics with source positions

### Intermediate Representation (IR)

A dedicated Intermediate Representation provides a common model for future compiler backends.

Current IR capabilities include:

- Program, site and page representation
- Page scopes and symbols
- SEO metadata representation
- Layout and element representation
- Static and dynamic text segments
- Action and navigation nodes
- Conditional rendering nodes
- Assignment nodes
- Expression representation
- Semantic symbol references

The IR Builder converts the analyzed AST into this intermediate model.

The IR Code Generator generates JavaScript modules from IR programs. It currently supports page rendering functions, state declarations, layouts, headings, paragraphs, text bindings, elements, actions, navigation, assignments, and conditional code generation.

**Current limitation:** IR generation is implemented and tested, but integration into the main build pipeline is still planned. Conditional code generation currently evaluates conditions during rendering; fully reactive conditional rendering is a future development task.

### JavaScript Code Generation

- JavaScript module generation
- Page-specific rendering functions
- Page selection by page ID
- State variable generation
- Expression generation
- DOM element creation
- Text binding through the runtime
- Event handling
- Navigation actions
- State assignments inside actions
- Direct DOM updates without a Virtual DOM

The existing AST-based generator and the newer IR-based generator are separate parts of the current development architecture.

### Reactive Runtime

pakpourUI includes an experimental signal-based reactive runtime.

Current capabilities:

- Reactive `signal()` values
- Reactive `effect()` execution
- Automatic dependency tracking
- Dynamic dependency updates
- Dependency cleanup
- Effect disposal through a stop function
- Nested effect support
- Effect stack management
- Prevention of direct recursive execution of the same effect
- Error handling and effect stack restoration
- Dependency tracking after an effect error
- Reactive text binding through `bindText()`

The runtime is an early foundation for reactive UI rendering. More advanced lifecycle management, reactive conditional rendering, and rendering integration remain under development.

---

## Language Examples

### 1. Building a Website

```text
site "Darbastan" {
    page "Home" {
        seo {
            title "Scaffolding Services | Darbastan"
            description "Find scaffolding services worldwide."
            canonical "/"
            index true
        }

        layout vertical {
            heading 1 "Find Professional Scaffolders"
            text "Connect with scaffolding companies worldwide."

            action "Find Scaffolders" {
                navigate "/scaffolders"
            }
        }
    }
}
```

### 2. Building an Interactive Application

```text
site "pakpourUI Demo" {
    page "Counter" {
        seo {
            title "Counter Application"
            description "A simple reactive counter."
            index false
        }

        state count = 0

        layout vertical {
            heading 1 "Counter"
            text "Current value: {count}"

            action "Increase" {
                count = count + 1
            }

            action "Decrease" {
                count = count - 1
            }

            when count >= 10 {
                text "You reached 10!"
            }
        }
    }
}
```

These examples illustrate the language direction and syntax supported by the current compiler architecture. Not every example is yet integrated into a complete production rendering pipeline.

---

## Compiler Architecture

pakpourUI follows a structured compiler architecture:

```text
              .pui Source
                   |
                   v
                 Lexer
                   |
                   v
                 Parser
                   |
                   v
                  AST
                   |
                   v
           Semantic Analyzer
                   |
                   v
             Semantic Model
                   |
                   v
       Intermediate Representation
                   |
          +--------+--------+
          |                 |
          v                 v
     IR Builder       IR Code Generator
                            |
                            v
                    JavaScript Output
                            |
                            v
                     Reactive Runtime
                            |
                            v
                      DOM Updates
```

The Intermediate Representation is intended to serve as the shared foundation for multiple compiler backends.

Planned future backends and rendering capabilities include HTML generation, SEO output, and different rendering strategies.

---

## Technology Stack

- **TypeScript** – Compiler, language implementation, and runtime
- **JavaScript** – Generated application code
- **Node.js** – Development and build environment
- **Vitest** – Automated testing
- **Vite** – Development tooling

---

## Project Structure

The following is a high-level overview of the main source files:

```text
pakpourUI/
│
├── src/
│   ├── compiler/
│   │   ├── token.ts
│   │   ├── lexer.ts
│   │   ├── parser.ts
│   │   ├── ast.ts
│   │   ├── generator.ts
│   │   ├── diagnostics.ts
│   │   ├── semantic.ts
│   │   └── ir/
│   │       ├── ir.ts
│   │       ├── ir-builder.ts
│   │       ├── ir-builder.test.ts
│   │       ├── ir-code-generator.ts
│   │       └── ir-code-generator.test.ts
│   │
│   ├── runtime.ts
│   ├── runtime.test.ts
│   └── index.ts
│
├── dist/
├── LANGUAGE-DESIGN.md
└── README.md
```

---

## Development

### Requirements

- Node.js
- npm

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npx vitest run
```

### TypeScript Validation

```bash
npx tsc --noEmit
```

### Build

```bash
npm run build
```

The build command currently runs the existing compiler and TypeScript runtime build configuration. Full integration of the IR-based compiler pipeline is still planned.

---

## Testing Status

The current automated test suite covers the lexer, parser, semantic analyzer, diagnostics, IR builder, IR code generator, and reactive runtime.

| Component | Tests |
|---|---:|
| Lexer | 6 |
| Parser | 7 |
| Semantic Analyzer | 18 |
| Diagnostics | 3 |
| IR Builder | 10 |
| IR Code Generator | 21 |
| Reactive Runtime | 8 |
| **Total** | **73** |

**Latest verified status:**

- 73 tests passed
- 7 test files passed
- TypeScript validation completed without errors

These results reflect the current development state and may change as new features and tests are added.

---

## Roadmap

pakpourUI is being developed incrementally.

| Version | Focus | Status |
|---|---|---|
| v0.1 | Initial compiler prototype | Completed |
| v0.2 | Language foundation, semantic analysis, IR, and runtime foundation | In progress |
| v0.3 | HTML Renderer and SEO Engine | Planned |
| v0.4 | Reactive rendering and hydration | Planned |
| v0.5 | Components and routing | Planned |
| v1.0 | Stable language, compiler, and development tools | Planned |

### Future Development

Planned capabilities include:

- HTML generation and semantic rendering
- Built-in SEO metadata generation
- Server-side rendering (SSR)
- Static site generation (SSG)
- Client-side rendering (CSR)
- Hybrid rendering
- Fully reactive conditional rendering
- Component system
- Routing
- CSS generation
- Accessibility diagnostics
- Sitemap generation
- Canonical URL management
- Production build optimization
- Developer tooling and CLI

These are roadmap goals, not claims about currently completed functionality.

---

## Project Status

**Early Development – Experimental Compiler**

pakpourUI is actively evolving. Its language syntax, compiler architecture, and APIs may change during development.

The current focus is strengthening the language foundation, semantic model, Intermediate Representation, and reactive runtime before moving toward the HTML rendering engine and full compiler integration.

---

## Author

Created and developed by **Hamidreza Pakpour**.

GitHub: [https://github.com/hain2006/pakpourUI](https://github.com/hain2006/pakpourUI)

---

**pakpourUI — One Language. Websites & Web Applications.**