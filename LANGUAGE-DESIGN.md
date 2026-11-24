# pakpourUI – Language Design

**Version:** 0.2 Draft  
**Status:** Under Active Development

## 1. Vision

pakpourUI is an independent programming language for building modern websites and web applications.

Its primary goal is to combine:

- SEO-first development
- High-performance rendering
- Native reactive capabilities
- Semantic HTML generation
- A simple and independent syntax
- An integrated development experience

pakpourUI will have its own language specification, compiler, intermediate representation, runtime, rendering engine, and development tools.

It is designed as an independent technology and will not depend on Vue, React, or Svelte.

**Core Idea: One Language. Websites & Web Applications.**

## 2. Core Principles

1. SEO must be a native language feature.
2. Initial HTML must contain essential page content and SEO metadata.
3. Websites and interactive applications must share the same language.
4. The compiler should generate optimized output.
5. Semantic HTML and accessibility should be encouraged by design.
6. The language syntax must remain simple and independent.
7. Runtime dependencies should be minimal.
8. The compiler should use a shared Intermediate Representation for its output generators.
9. Language semantics and rendering implementation should remain independent.

## 3. File Structure

Planned project file types:

- `.pui` – Source files
- `.pui` component files – Reusable UI components
- `pakpour.config` – Project configuration (format to be determined)

The exact module and component organization is still under design.

## 4. Language Syntax

Example:

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

            paragraph "Connect with scaffolding companies worldwide."

            action "Find Scaffolders" {
                navigate "/scaffolders"
            }
        }
    }
}
```

Interactive application example:

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

            when count >= 10 {
                text "You reached 10!"
            }
        }
    }
}
```

These examples represent the intended language direction and the syntax currently supported by the compiler.

## 5. Core Language Features

### Site

Defines a website or application and contains its pages.

### Page

Defines an individual page and its associated content and metadata.

Each page has its own scope for state declarations.

### SEO

Defines metadata and search engine settings for a page.

### Layout

Defines the structural organization of page content.

Initial layout directions include:

- Vertical
- Horizontal

### State

Defines reactive application state.

State declarations follow a sequential declaration-order model. A state must be declared before it is referenced.

### Action

Defines user-triggered operations such as navigation and state updates.

### When

Defines conditional rendering based on expressions.

### Component

Defines reusable UI structures. The component system is planned for a future development phase.

### Navigate

Defines navigation to another application route.

## 6. Semantic Analysis

Semantic analysis validates the meaning and correctness of a program before code generation.

Planned and implemented semantic capabilities include:

- State declaration validation
- Duplicate declaration detection
- Undefined identifier detection
- Declaration-order validation
- Independent page scopes
- Symbol table management
- Identifier-to-symbol binding
- Dynamic text binding
- Expression type inference
- Source-aware diagnostics

The Semantic Model provides structured information about symbols, scopes, bindings, and inferred expression types.

This information is used by the Intermediate Representation Builder and future compiler stages.

## 7. SEO Engine

SEO is a first-class feature of pakpourUI.

Planned capabilities:

- Page titles and meta descriptions
- Canonical URLs
- Robots directives
- Open Graph metadata
- Twitter Cards
- Structured Data (JSON-LD)
- Sitemap generation
- Semantic heading validation
- SEO diagnostics during compilation

The compiler should validate SEO configuration and generate essential metadata directly in the initial HTML output.

SEO functionality should not depend on client-side JavaScript execution.

## 8. Rendering Architecture

pakpourUI is designed to support multiple rendering strategies.

### Static Site Generation (SSG)

Generate HTML files during the build process.

### Server-Side Rendering (SSR)

Generate HTML on the server for incoming requests.

### Client-Side Rendering (CSR)

Support interactive application experiences in the browser.

### Hybrid Rendering

Allow static, SEO-friendly content and interactive components to coexist on the same page.

The rendering architecture should prioritize delivering meaningful HTML before client-side JavaScript execution.

## 9. Compiler Architecture

The compiler follows a multi-stage architecture:

```text
PUI Source
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
Intermediate Representation (IR)
    |
    +---- HTML Renderer
    |
    +---- JavaScript Generator
    |
    +---- SEO Engine
    |
    +---- CSS Generator
    |
    v
Optimized Web Output
```

### Abstract Syntax Tree (AST)

Represents the syntactic structure of the source program.

### Semantic Analyzer

Validates declarations, scopes, identifiers, expressions, and language rules.

### Semantic Model

Stores semantic information produced during analysis, including symbols, scopes, bindings, and inferred types.

### Intermediate Representation (IR)

Provides a shared, structured representation of the analyzed program.

The IR separates language parsing and semantic analysis from output generation.

Different compiler backends will consume the same IR to generate HTML, JavaScript, SEO metadata, and CSS.

The IR is not intended to be tied to a specific rendering framework or runtime implementation.

## 10. Reactive Runtime

pakpourUI will implement its own reactive system.

Planned features:

- Signals
- Effects
- State updates
- Event handling
- Conditional rendering
- Component lifecycle
- Reactive text updates

The initial architecture does not plan to use a Virtual DOM.

Instead, the runtime will explore direct DOM updates through reactive dependencies.

The runtime should remain lightweight and independent of external UI frameworks.

## 11. Development Roadmap

| Version | Objective | Status |
|---|---|---|
| 0.1 | Initial compiler prototype | Completed |
| 0.2 | Language foundation, semantic analysis and IR | In progress |
| 0.3 | HTML renderer and SEO engine | Planned |
| 0.4 | Reactive rendering and hydration | Planned |
| 0.5 | Components and routing | Planned |
| 1.0 | Stable language, compiler and development tools | Planned |

## 12. Current Implementation Status

The following foundations have been implemented:

- Lexer and tokenization
- Parser and AST
- Core language declarations
- State declarations and assignments
- Expressions and conditional structures
- Semantic Analyzer
- Semantic Model
- Symbol and scope management
- Source-aware diagnostics
- Intermediate Representation
- AST-to-IR Builder
- Initial JavaScript generator
- Initial signal-based reactive runtime

The IR Builder has its own automated test suite.

Integration of the IR into the main compilation and code-generation pipeline is still in progress.

HTML rendering, the SEO engine, CSS generation, and advanced rendering strategies remain future development goals.

## 13. Long-Term Vision

pakpourUI aims to provide a unified development experience for websites and web applications.

Developers should be able to write one independent language and generate fast, semantic, accessible, search-engine-friendly, and interactive web experiences.

The long-term goal is to create a complete ecosystem with its own language, compiler, runtime, rendering architecture, and development tools.

---

**One Language. Websites & Web Applications.**