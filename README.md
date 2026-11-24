# pakpourUI

**One Language. Websites & Web Applications.**

pakpourUI is an experimental, independent UI programming language and compiler built with TypeScript.

The project explores a new approach to building web interfaces through a custom, readable programming language. Instead of writing HTML directly, developers will be able to describe websites and web applications using `.pui` source files and compile them into optimized JavaScript and HTML.

pakpourUI is being designed with its own syntax, compiler architecture, semantic analysis, intermediate representation, and reactive runtime.

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

## Current Features

### Language and Compiler

- Custom lexer and tokenization system
- Parser and Abstract Syntax Tree (AST)
- Site and page declarations
- UI element and layout declarations
- State declarations
- Variable assignments
- Arithmetic and comparison expressions
- Conditional rendering with `when`
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

A dedicated Intermediate Representation has been introduced to provide a common model for future compiler backends.

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

The IR Builder currently converts the analyzed AST into this intermediate model.

**Note:** IR generation is implemented and tested, but integration into the main build pipeline is still planned.

### Runtime and Code Generation

- JavaScript code generation
- Initial signal-based reactive runtime
- Reactive text binding
- DOM element creation
- Event handling
- Direct DOM updates without a Virtual DOM

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

These examples represent the intended language direction and current supported syntax.

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
          +-------+-------+
          |       |       |
          v       v       v
         HTML    JavaScript  SEO
       Renderer  Generator  Engine
          |       |       |
          +-------+-------+
                  |
                  v
             Web Output
```

The Intermediate Representation is intended to serve as the shared foundation for multiple compiler backends.

This architecture allows the language and its compiler to evolve independently from the rendering strategy.

---

## Technology Stack

- **TypeScript** – Compiler and language implementation
- **JavaScript** – Generated application code
- **Node.js** – Development and build environment
- **Vitest** – Automated testing
- **Vite** – Development tooling

---

## Project Structure

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
│   │   ├── semantic-model.ts
│   │   │
│   │   └── ir/
│   │       ├── ir.ts
│   │       ├── ir-builder.ts
│   │       └── ir-builder.test.ts
│   │
│   ├── runtime.ts
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

The build command currently runs the existing compiler and generates JavaScript output in the `dist` directory.

---

## Testing Status

The compiler currently has automated tests covering its core components.

| Component | Tests |
|---|---:|
| Lexer | 6 |
| Parser | 7 |
| Semantic Analyzer | 18 |
| Diagnostics | 3 |
| IR Builder | 9 |
| **Total** | **43** |

All 43 tests are passing in the current development version.

TypeScript validation and the existing build command have also completed successfully.

---

## Roadmap

pakpourUI is being developed incrementally.

| Version | Focus | Status |
|---|---|---|
| v0.1 | Initial compiler prototype | Completed |
| v0.2 | Language foundation, semantic analysis and IR | In progress |
| v0.3 | HTML Renderer and SEO Engine | Planned |
| v0.4 | Reactive rendering and hydration | Planned |
| v0.5 | Components and routing | Planned |
| v1.0 | Stable language, compiler and development tools | Planned |

### Future Development

Planned capabilities include:

- HTML generation and semantic rendering
- Built-in SEO metadata generation
- Server-side rendering (SSR)
- Static site generation (SSG)
- Client-side rendering (CSR)
- Hybrid rendering
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

pakpourUI is actively evolving. Its language syntax, compiler architecture and APIs may change during development.

The current focus is strengthening the language foundation, semantic model and Intermediate Representation before moving toward the HTML rendering engine.

---

## Author

Created and developed by **Hamidreza Pakpour**.

GitHub: https://github.com/hain2006/pakpourUI

---

**pakpourUI — One Language. Websites & Web Applications.**