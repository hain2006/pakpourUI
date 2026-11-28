# pakpourUI

**One Language. Websites & Web Applications.**

pakpourUI is an experimental, independent UI programming language and compiler built with TypeScript.

It explores a new approach to building websites and interactive web applications through a custom, readable programming language. Developers describe interfaces using `.pui` source files, which are processed through a dedicated compiler architecture.

pakpourUI has its own syntax, lexer, parser, semantic analyzer, intermediate representation, JavaScript code generator, HTML renderer, and reactive runtime.

The long-term vision is to build a complete UI development ecosystem rather than another wrapper around an existing JavaScript framework.

---

## Project Vision

The goal of pakpourUI is to create an independent language for building both websites and web applications.

Key principles:

- **Independent Language:** A custom syntax and language specification.
- **Compiler-First Architecture:** A dedicated compiler pipeline with semantic analysis and an intermediate representation.
- **SEO-First Development:** Search engine optimization as a built-in language and compiler capability.
- **HTML-First Rendering:** Generate semantic HTML containing essential page content.
- **Reactive Runtime:** Build interactive interfaces using a lightweight signal-based reactive system.
- **No Virtual DOM:** Explore direct DOM updates through reactive dependencies.
- **Unified Development:** Use one language for websites and web applications.

These principles guide the architecture. Some capabilities are implemented, while others remain development goals.

---

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

A dedicated Intermediate Representation provides a common model for compiler backends.

Current IR capabilities include:

- Program, site and page representation
- Page scopes and symbols
- SEO metadata representation
- Layout and element representation
- Static and dynamic text segments
- Static and dynamic attribute value structures
- Action and navigation nodes
- Conditional rendering nodes
- Assignment nodes
- Expression representation
- Semantic symbol references

The IR Builder converts analyzed AST programs into this intermediate model.

### JavaScript Code Generation

The IR-based JavaScript generator currently supports:

- JavaScript module generation
- Page-specific rendering functions
- Page selection by page ID
- State variable generation
- Expression generation
- DOM element creation
- Text binding through the runtime
- Event handling
- Navigation actions
- State assignments inside action handlers
- Conditional code generation

The existing AST-based generator and the newer IR-based generator are separate parts of the development architecture.

**Current limitation:** The IR-based compiler pipeline is not yet fully integrated into the main build pipeline. Fully reactive conditional rendering is also a future development task.

### Reactive Runtime

pakpourUI includes an experimental signal-based reactive runtime.

Implemented capabilities include:

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

### DOM Runtime

The runtime includes foundational DOM rendering capabilities:

- DOM element creation
- Attribute handling
- Class and style handling
- Event registration
- Static child rendering
- Reactive text binding
- Reactive child binding
- Scope creation
- Page-level scope management
- Cleanup registration and disposal

The runtime is an early foundation for reactive UI rendering. More advanced lifecycle management, hydration, and complete rendering integration remain under development.

### HTML Renderer

The IR-based HTML Renderer generates complete HTML documents directly from `IRProgram`.

Current capabilities include:

- Complete HTML document generation
- Standalone page rendering
- Pages inside sites
- Heading and paragraph rendering
- Layout rendering
- HTML element rendering
- Nested layouts and elements
- Static and dynamic text rendering
- Initial-state evaluation of conditional content
- HTML tag-name validation
- Void element handling
- HTML attribute rendering
- Static attribute values
- Boolean HTML attributes
- Attribute-name validation
- HTML escaping for text, metadata, and attribute values
- Rejection of inline event-handler attributes

Supported basic SEO output:

- Page title
- Meta description
- Canonical URL
- Robots `noindex` directive

Dynamic HTML attributes are represented in the IR but are not yet supported by the static HTML Renderer.

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

These examples illustrate the language direction and current syntax. Not every construct is yet connected to a complete production rendering pipeline.

---

## Compiler Architecture

The current architecture follows this conceptual pipeline:

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
             |               |
             v               v
        HTML Renderer   IR Code Generator
             |               |
             v               v
         HTML Output    JavaScript Output
                             |
                             v
                       Reactive Runtime
                             |
                             v
                        DOM Updates
```

The IR is intended to serve as a shared foundation for multiple compiler backends, including HTML, JavaScript, SEO, and CSS generation.

The IR-based HTML Renderer and JavaScript generator currently exist as separate development-stage backends. Full integration into a unified production build pipeline remains planned.

---

## Technology Stack

- **TypeScript** – Compiler, language implementation, and runtime
- **JavaScript** – Generated application code
- **Node.js** – Development and build environment
- **Vitest** – Automated testing
- **Vite** – Development tooling

---

## Project Structure

High-level overview of the current source architecture:

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
│   │   ├── source-location.ts
│   │   │
│   │   ├── ir/
│   │   │   ├── ir.ts
│   │   │   ├── ir-builder.ts
│   │   │   ├── ir-code-generator.ts
│   │   │   └── ir-code-generator.test.ts
│   │   │
│   │   └── html/
│   │       ├── html-renderer.ts
│   │       └── html-renderer.test.ts
│   │
│   ├── runtime/
│   │   ├── index.ts
│   │   ├── reactive.ts
│   │   ├── dom.ts
│   │   └── scope.ts
│   │
│   └── runtime.ts
│
├── LANGUAGE-DESIGN.md
└── README.md
```

This is a high-level overview, not an exhaustive listing of every source and test file.

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

The existing build configuration is still being developed toward full integration of the IR-based compiler pipeline.

---

## Testing Status

Latest verified local test status:

| Component | Tests |
|---|---:|
| HTML Renderer | 29 |
| IR Code Generator | 25 |
| Semantic Analyzer | 18 |
| Reactive Runtime | 12 |
| IR Builder | 10 |
| DOM Runtime | 9 |
| Parser | 7 |
| Lexer | 6 |
| IR Code Generator Integration | 5 |
| Scope Runtime | 4 |
| Diagnostics | 3 |
| **Total** | **128** |

**Latest verified status:**

- 128 tests passed
- 11 test files passed
- TypeScript validation completed without errors

These results reflect the latest reported local test run and may change as new features and tests are added.

---

## Roadmap

| Version | Focus | Status |
|---|---|---|
| v0.1 | Initial compiler prototype | Completed |
| v0.2 | Language foundation, semantic analysis, IR, and runtime foundations | In progress |
| v0.3 | HTML Renderer and SEO Engine | In progress |
| v0.4 | Reactive rendering and hydration | Planned |
| v0.5 | Components and routing | Planned |
| v1.0 | Stable language, compiler, and development tools | Planned |

### Future Development

Planned capabilities include:

- Extended HTML generation
- Open Graph metadata
- Twitter Cards
- Structured data (JSON-LD)
- Dynamic HTML attributes
- SEO diagnostics during compilation
- Sitemap generation
- Semantic heading validation
- Server-side rendering (SSR)
- Static site generation (SSG)
- Client-side rendering (CSR)
- Hybrid rendering
- Fully reactive conditional rendering
- Component system
- Routing
- CSS generation
- Accessibility diagnostics
- Production build optimization
- Developer tooling and CLI

These are roadmap goals, not claims about currently completed functionality.

---

## Project Status

**Early Development – Experimental Compiler**

pakpourUI is actively evolving. Its language syntax, compiler architecture, and APIs may change during development.

The current focus is strengthening the language foundation, Intermediate Representation, HTML rendering capabilities, SEO output, and reactive runtime before moving toward complete compiler integration.

---

## Author

Created and developed by **Hamidreza Pakpour**.

GitHub: https://github.com/hain2006/pakpourUI

---

**pakpourUI — One Language. Websites & Web Applications.**