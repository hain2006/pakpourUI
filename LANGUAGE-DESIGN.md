# pakpourUI --- Language Design

**Version:** 0.2 Draft\
**Status:** Under Active Development

------------------------------------------------------------------------

## 1. Vision

pakpourUI is an independent programming language for building modern
websites and web applications.

Its long-term goal is to combine:

-   SEO-first development
-   High-performance rendering
-   Native reactive capabilities
-   Semantic HTML generation
-   A simple, independent syntax
-   An integrated development experience

pakpourUI is being developed with its own language specification,
compiler, intermediate representation, runtime, rendering architecture,
and development tools. It is not intended to depend on Vue, React, or
Svelte.

**Core idea: One Language. Websites & Web Applications.**

## 2. Core Principles

1.  SEO should be a native language feature.
2.  Initial HTML should contain essential page content and SEO metadata.
3.  Websites and interactive applications should share the same
    language.
4.  The compiler should generate optimized output.
5.  Semantic HTML and accessibility should be encouraged by design.
6.  The language syntax should remain simple and independent.
7.  Runtime dependencies should be minimal.
8.  A shared Intermediate Representation should support multiple output
    backends.
9.  Language semantics should remain independent of rendering
    implementation.
10. Reactive updates should target the affected DOM output directly
    rather than requiring a Virtual DOM.

## 3. Source Files and Project Organization

Planned file types:

-   `.pui` --- pakpourUI source files
-   Component source files --- reusable UI components, with exact
    conventions still to be designed
-   `pakpour.config` --- project configuration; format and schema are
    not finalized

Module resolution, imports, component file conventions, and project
configuration remain under design.

## 4. Language Syntax

### Website example

``` text
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

### Interactive application example

``` text
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

These examples represent the current language direction. Parser/AST
support, IR support, and end-to-end runtime behavior are separate
implementation milestones; not every example construct is already
connected to a complete rendering pipeline.

## 5. Core Language Constructs

### Site

Defines a website or application and contains its pages.

### Page

Defines a page and its content and metadata. Each page has its own scope
for state declarations.

### SEO

Defines page-level search metadata and indexing configuration. The SEO
output backend is planned.

### Layout

Defines the structural organization of page content. Initial directions
include:

-   `vertical`
-   `horizontal`

### State

Declares state within a page. State declarations follow a sequential
declaration-order model: a state must be declared before it is
referenced.

### Action

Defines user-triggered operations. The current IR code generator
supports navigation and state assignment commands in generated action
handlers.

### When

Represents conditional content in the language and IR. Reactive
insertion and removal of DOM nodes based on changing state is not yet
implemented.

### Component

Reusable UI structures are planned. Component syntax, scope behavior,
and lifecycle semantics remain to be specified.

### Navigate

Represents navigation to an application path. The IR code generator
currently emits browser navigation for this action.

## 6. Semantic Analysis

Semantic analysis validates a program before later compiler stages.

Implemented capabilities include:

-   State declaration validation
-   Duplicate declaration detection
-   Undefined identifier detection
-   Declaration-order validation
-   Independent page scopes
-   Symbol and scope management
-   Identifier-to-symbol binding
-   Dynamic text binding
-   Expression type inference
-   Source-aware diagnostics

The Semantic Model stores structured information about symbols, scopes,
bindings, and inferred expression types. The IR Builder consumes this
model when translating the analyzed AST.

## 7. Intermediate Representation

The Intermediate Representation provides a structured model between
semantic analysis and output generation.

Current IR structures include:

-   Program, site, and page nodes
-   Page scopes and symbols
-   SEO metadata representation
-   Layout and element nodes
-   Static and dynamic text segments
-   Action and navigation nodes
-   Conditional nodes
-   Assignment nodes
-   Literal, identifier, unary, and binary expression nodes
-   Semantic symbol references

The AST-to-IR Builder is implemented and has a dedicated test suite. The
IR-based JavaScript code generator is also implemented and tested for
the currently supported IR structures.

**Integration status:** the IR builder and IR code generator are not yet
fully integrated into the main compilation/build pipeline. The existing
AST-based generator remains in the project during this transition.

The IR should remain independent of any particular UI framework or
rendering backend.

## 8. SEO Engine

SEO is intended to be a first-class feature of pakpourUI.

Planned capabilities include:

-   Page titles and meta descriptions
-   Canonical URLs
-   Robots directives
-   Open Graph metadata
-   Twitter Cards
-   Structured data (JSON-LD)
-   Sitemap generation
-   Semantic heading validation
-   SEO diagnostics during compilation

The target architecture is to generate essential metadata in the initial
HTML output, without requiring client-side JavaScript. The SEO engine
and HTML metadata generation are not yet implemented.

## 9. Rendering Architecture

The target architecture is intended to support several rendering
strategies.

### Static Site Generation (SSG)

Generate HTML files during the build process.

### Server-Side Rendering (SSR)

Generate HTML on the server for incoming requests.

### Client-Side Rendering (CSR)

Support browser-based interactive application experiences.

### Hybrid Rendering

Allow static, SEO-friendly content and interactive regions to coexist on
the same page.

The rendering architecture should prioritize meaningful HTML before
client-side JavaScript execution. These rendering modes are
architectural goals, not current completed features.

## 10. Compiler Architecture

The intended compiler pipeline is:

``` text
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
Web Output
```

### Lexer

Converts source characters into tokens and tracks source positions.

### Parser

Builds the AST from the token stream.

### Abstract Syntax Tree (AST)

Represents the syntactic structure of the source program.

### Semantic Analyzer

Validates declarations, scopes, identifiers, expressions, and language
rules.

### Semantic Model

Stores semantic information such as symbols, scopes, bindings, and
inferred expression types.

### Intermediate Representation (IR)

Provides a shared, structured representation for downstream generators.
The IR separates language parsing and semantic analysis from output
generation.

### Backends

The target architecture includes HTML, JavaScript, SEO, and CSS
generation. At present, the IR-based JavaScript generator is implemented
as a development-stage backend; the HTML renderer, SEO engine, and CSS
generator remain planned.

## 11. Reactive Runtime

pakpourUI is developing its own signal-based reactive system.

### Implemented runtime foundations

The current `src/runtime.ts` implementation includes:

-   Signals with value-change detection
-   Effects and dependency tracking
-   Dynamic dependency updates
-   Effect cleanup and explicit stopping
-   Nested effect tracking using an effect stack
-   Prevention of direct recursive execution of the same effect
-   Error reporting with stack restoration
-   Re-execution and dependency tracking after a callback error
-   Reactive text binding through `bindText`

The runtime is covered by automated tests. These foundations do not yet
constitute a complete reactive renderer.

### Planned runtime capabilities

-   Reactive conditional rendering
-   DOM insertion and removal for `when`
-   Element and component lifecycle management
-   Hydration
-   More comprehensive scheduling and effect ownership
-   Memory-safe cleanup when rendered nodes are removed

The initial design direction is direct DOM updates driven by reactive
dependencies, without a Virtual DOM.

## 12. Testing and Verification

Latest recorded local test status:

  Test suite             Tests
  ------------------- --------
  Lexer                      6
  Parser                     7
  Semantic Analyzer         18
  Diagnostics                3
  IR Builder                10
  IR Code Generator         21
  Runtime                    8
  **Total**             **73**

The latest recorded run passed all **73 tests across 7 test files**.
TypeScript validation with `npx tsc --noEmit` also completed
successfully.

Run the checks locally with:

``` bash
npx vitest run
npx tsc --noEmit
```

Test counts represent the current development snapshot and will change
as implementation progresses.

## 13. Development Roadmap

  -----------------------------------------------------------------------
  Version                 Objective               Status
  ----------------------- ----------------------- -----------------------
  0.1                     Initial compiler        Completed
                          prototype               

  0.2                     Language foundation,    In progress
                          semantic analysis, IR,  
                          and runtime foundations 

  0.3                     HTML renderer and SEO   Planned
                          engine                  

  0.4                     Reactive rendering and  Planned
                          hydration               

  0.5                     Components and routing  Planned

  1.0                     Stable language,        Planned
                          compiler, and           
                          development tools       
  -----------------------------------------------------------------------

The roadmap is directional. Individual features may be refined as the
language specification and implementation evolve.

## 14. Long-Term Vision

pakpourUI aims to provide a unified development experience for websites
and web applications.

Developers should be able to write one independent language and produce
fast, semantic, accessible, search-engine-friendly, and interactive web
experiences.

The long-term goal is a complete ecosystem with its own language,
compiler, runtime, rendering architecture, and development tools.

------------------------------------------------------------------------

**One Language. Websites & Web Applications.**
