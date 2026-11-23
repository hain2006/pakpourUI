# pakpourUI – Language Design

**Version:** 0.2 Draft  
**Status:** Under Design

## 1. Vision

pakpourUI is an independent programming language for building modern websites and web applications.

Its primary goal is to combine:

- SEO-first development
- High-performance rendering
- Native reactive capabilities
- Semantic HTML generation
- A simple and independent syntax
- An integrated development experience

pakpourUI will have its own compiler, runtime, rendering engine, and development tools.

It will not depend on Vue, React, or Svelte.

## 2. Core Principles

1. SEO must be a native language feature.
2. HTML should be generated before client-side JavaScript execution.
3. Websites and interactive applications must share the same language.
4. The compiler should generate optimized output.
5. Semantic HTML and accessibility should be encouraged by design.
6. The language syntax must remain simple and independent.
7. Runtime dependencies should be minimal.

## 3. File Structure

- `.pui` – Source files
- `.pui` components – Reusable UI components
- `pakpour.config` – Project configuration (format to be determined)

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

## 5. Core Language Features

### Site
Defines the website or application.

### Page
Defines an individual route and its content.

### SEO
Defines metadata and search engine settings.

### Layout
Defines the visual structure of the page.

### State
Defines reactive application state.

### Action
Defines user-triggered operations.

### When
Defines conditional rendering.

### Component
Defines reusable UI structures.

### Navigate
Handles application navigation.

## 6. SEO Engine

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

The compiler should validate SEO configuration and generate metadata in the initial HTML output.

## 7. Rendering Architecture

pakpourUI will support three rendering strategies:

### Static Site Generation (SSG)
Generate HTML files during the build process.

### Server-Side Rendering (SSR)
Generate HTML on the server for incoming requests.

### Client-Side Rendering (CSR)
Support interactive application experiences in the browser.

Hybrid rendering should allow static content and interactive components to coexist on the same page.

## 8. Compiler Architecture

```text
PUI Source
    |
Lexer
    |
Parser
    |
AST
    |
Semantic Analyzer
    |
Intermediate Representation (IR)
    |
    +---- HTML Renderer
    |
    +---- JavaScript Generator
    |
    +---- SEO Engine
    |
    +---- CSS Generator
```

The Intermediate Representation will provide a shared structure for different output generators.

## 9. Reactive Runtime

pakpourUI will implement its own reactive system.

Planned features:

- Signals
- Effects
- State updates
- Event handling
- Conditional rendering
- Component lifecycle

Virtual DOM is not planned for the initial architecture.

## 10. Development Roadmap

| Version | Objective |
|---|---|
| 0.1 | Initial compiler prototype |
| 0.2 | Language foundation and IR |
| 0.3 | HTML and SEO engine |
| 0.4 | Reactive rendering and hydration |
| 0.5 | Components and routing |
| 1.0 | Stable release |

## 11. Long-Term Vision

pakpourUI aims to provide a unified development experience for websites and web applications.

Developers should be able to write one independent language and generate fast, semantic, search-engine-friendly and interactive web experiences.

**One Language. Websites & Web Applications.**