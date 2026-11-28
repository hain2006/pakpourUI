# pakpourUI — Language Design

**Version:** 0.2 Draft  
**Status:** Under Active Development

---

## 1. Vision

pakpourUI is an independent programming language for building modern websites and web applications.

Its long-term goal is to combine:

- SEO-first development
- High-performance rendering
- Native reactive capabilities
- Semantic HTML generation
- A simple, independent syntax
- An integrated development experience

pakpourUI is being developed with its own language specification, compiler, Intermediate Representation, runtime, rendering architecture, and development tools.

It is not intended to depend on Vue, React, or Svelte.

**Core idea: One Language. Websites & Web Applications.**

---

## 2. Core Principles

1. SEO should be a native language feature.
2. Initial HTML should contain essential page content and SEO metadata.
3. Websites and interactive applications should share the same language.
4. The compiler should generate optimized output.
5. Semantic HTML and accessibility should be encouraged by design.
6. The language syntax should remain simple and independent.
7. Runtime dependencies should be minimal.
8. A shared Intermediate Representation should support multiple output backends.
9. Language semantics should remain independent of rendering implementation.
10. Reactive updates should target affected DOM output directly rather than requiring a Virtual DOM.

---

## 3. Source Files and Project Organization

Planned file types:

- `.pui` — pakpourUI source files
- Component source files — reusable UI components, with exact conventions still to be designed
- `pakpour.config` — project configuration; format and schema are not finalized

Module resolution, imports, component file conventions, and project configuration remain under design.

---

## 4. Language Syntax

### 4.1 Website Example

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

### 4.2 Interactive Application Example

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

These examples represent the current language direction. Parser/AST support, IR support, HTML rendering, and end-to-end runtime behavior are separate implementation milestones.

Not every example construct is already connected to a complete rendering pipeline.

---

## 5. Core Language Constructs

### Site

Defines a website or application and contains its pages.

### Page

Defines a page, its content, and its metadata.

Each page has its own scope for state declarations.

### SEO

Defines page-level search metadata and indexing configuration.

The current IR and HTML Renderer support basic metadata output:

- Title
- Description
- Canonical URL
- Robots indexing directive

More advanced SEO capabilities remain under development.

### Layout

Defines the structural organization of page content.

Initial directions include:

- `vertical`
- `horizontal`

### State

Declares state within a page.

State declarations follow a sequential declaration-order model: a state must be declared before it is referenced.

### Action

Defines user-triggered operations.

The current IR code generator supports navigation and state assignment commands in generated action handlers.

### When

Represents conditional content in the language and IR.

The HTML Renderer currently evaluates conditions using initial state values. Fully reactive insertion and removal of DOM nodes based on changing state is not yet implemented.

### Component

Reusable UI structures are planned.

Component syntax, scope behavior, and lifecycle semantics remain to be specified.

### Navigate

Represents navigation to an application path.

The IR code generator currently emits browser navigation for this action.

---

## 6. Semantic Analysis

Semantic analysis validates a program before later compiler stages.

Implemented capabilities include:

- State declaration validation
- Duplicate declaration detection
- Undefined identifier detection
- Declaration-order validation
- Independent page scopes
- Symbol and scope management
- Identifier-to-symbol binding
- Dynamic text binding
- Expression type inference
- Source-aware diagnostics

The Semantic Model stores structured information about symbols, scopes, bindings, and inferred expression types.

The IR Builder consumes this model when translating analyzed AST programs.

---

## 7. Intermediate Representation

The Intermediate Representation provides a structured model between semantic analysis and output generation.

Its purpose is to separate language semantics from individual output backends.

### 7.1 Current IR Structures

Current IR structures include:

- Program, site, and page nodes
- Page scopes and symbols
- SEO metadata representation
- Layout and element nodes
- Static and dynamic text segments
- HTML attribute structures
- Static and dynamic attribute value representations
- Action and navigation nodes
- Conditional nodes
- Assignment nodes
- Literal, identifier, unary, and binary expression nodes
- Semantic symbol references

### 7.2 IR Builder

The AST-to-IR Builder translates analyzed programs into the intermediate model.

It uses semantic information to preserve symbol references and other relevant semantic relationships.

The IR Builder has a dedicated automated test suite.

### 7.3 IR Code Generator

The IR-based JavaScript code generator currently supports:

- Page rendering functions
- State declarations
- Expression generation
- Layouts
- Headings and paragraphs
- Text bindings
- Elements
- Actions and navigation
- Assignments
- Conditional code generation

The existing AST-based generator remains in the project during the transition toward a unified IR-based architecture.

### 7.4 Integration Status

The IR Builder and IR Code Generator are implemented and tested, but are not yet fully integrated into the main compilation/build pipeline.

The HTML Renderer also consumes IR directly.

The long-term design is for all output backends to consume the same IR model.

---

## 8. HTML Rendering Architecture

HTML rendering is a core part of the pakpourUI architecture.

The goal is to generate meaningful, semantic HTML directly from the Intermediate Representation.

### 8.1 HTML Renderer

The current HTML Renderer accepts an `IRProgram` and generates complete HTML documents.

Current rendering capabilities include:

- Document structure (`DOCTYPE`, `html`, `head`, and `body`)
- Standalone pages
- Pages contained in sites
- Headings
- Paragraphs
- Layouts
- HTML elements
- Nested elements and layouts
- Static and dynamic text
- Initial-state evaluation of conditional content

### 8.2 HTML Elements and Attributes

The IR supports HTML element definitions with attributes.

Current static HTML Renderer capabilities include:

- Static attribute values
- Attribute-name validation
- HTML escaping for attribute values
- Boolean HTML attributes
- Void element handling
- Rejection of inline event-handler attributes

Dynamic attribute values have an IR representation, but the static HTML Renderer does not yet evaluate them.

Dynamic attribute generation and runtime binding are planned for later integration with the JavaScript Generator and Runtime.

### 8.3 Security Considerations

The renderer must treat generated HTML as a security-sensitive output.

Current protections include:

- Escaping HTML text content
- Escaping metadata values
- Escaping static attribute values
- Validating tag names
- Validating attribute names
- Rejecting inline event-handler attributes
- Rejecting unsupported dynamic attributes in static rendering

Further security validation will be required as the language gains additional HTML and dynamic rendering features.

---

## 9. SEO Engine

SEO is intended to be a first-class feature of pakpourUI.

### 9.1 Current Capabilities

The current HTML Renderer generates:

- Page titles
- Meta descriptions
- Canonical URLs
- Robots `noindex` directives

The SEO metadata is represented in the IR and used by the HTML Renderer.

### 9.2 Planned Capabilities

Planned SEO features include:

- Open Graph metadata
- Twitter Cards
- Structured data (JSON-LD)
- Sitemap generation
- Semantic heading validation
- SEO diagnostics during compilation
- Canonical URL management
- Additional indexing directives

### 9.3 SEO Design Goals

The target architecture should generate essential metadata in the initial HTML output without requiring client-side JavaScript.

SEO generation should remain independent of the specific rendering backend.

The long-term goal is to make SEO rules part of the language and compiler rather than relying entirely on external plugins or manual configuration.

---

## 10. Rendering Strategies

The target architecture is intended to support several rendering strategies.

### Static Site Generation (SSG)

Generate HTML files during the build process.

### Server-Side Rendering (SSR)

Generate HTML on the server for incoming requests.

### Client-Side Rendering (CSR)

Support browser-based interactive application experiences.

### Hybrid Rendering

Allow static, SEO-friendly content and interactive regions to coexist on the same page.

The rendering architecture should prioritize meaningful HTML before client-side JavaScript execution.

These rendering modes are architectural goals, not currently completed production features.

---

## 11. Compiler Architecture

The intended compiler pipeline is:

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
             +--------+--------+
             |        |        |
             v        v        v
          HTML     JavaScript  SEO
        Renderer   Generator  Engine
             |        |        |
             +--------+--------+
                      |
                      v
                  Web Output
```

A CSS Generator is also planned as a future backend.

### Lexer

Converts source characters into tokens and tracks source positions.

### Parser

Builds the AST from the token stream.

### Abstract Syntax Tree (AST)

Represents the syntactic structure of the source program.

### Semantic Analyzer

Validates declarations, scopes, identifiers, expressions, and language rules.

### Semantic Model

Stores semantic information such as symbols, scopes, bindings, and inferred expression types.

### Intermediate Representation (IR)

Provides a shared, structured representation for downstream generators.

### Backends

The target architecture includes HTML, JavaScript, SEO, and CSS generation.

At present:

- The IR-based JavaScript Generator is implemented and tested.
- The IR-based HTML Renderer is implemented and under active development.
- Basic SEO metadata output is implemented in the HTML Renderer.
- A separate, complete SEO Engine is still planned.
- CSS generation remains planned.
- Full integration into the main compiler pipeline remains planned.

---

## 12. Reactive Runtime

pakpourUI is developing its own signal-based reactive system.

### 12.1 Implemented Runtime Foundations

The current runtime includes:

- Signals with value-change detection
- Effects and dependency tracking
- Dynamic dependency updates
- Effect cleanup and explicit stopping
- Nested effect tracking using an effect stack
- Prevention of direct recursive execution of the same effect
- Error reporting with stack restoration
- Dependency tracking after a callback error
- Reactive text binding through `bindText`

### 12.2 DOM Runtime

The DOM runtime provides foundational operations:

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

### 12.3 Planned Runtime Capabilities

- Reactive conditional rendering
- DOM insertion and removal for `when`
- Element and component lifecycle management
- Hydration
- More comprehensive scheduling and effect ownership
- Memory-safe cleanup when rendered nodes are removed

The initial design direction is direct DOM updates driven by reactive dependencies, without a Virtual DOM.

The current runtime foundations do not yet constitute a complete reactive renderer.

---

## 13. Testing and Verification

Latest reported local test status:

| Test Suite | Tests |
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

Latest verified status:

- 128 tests passed
- 11 test files passed
- TypeScript validation with `npx tsc --noEmit` completed without errors

Run the checks locally:

```bash
npx vitest run
npx tsc --noEmit
```

Test counts represent the latest reported development snapshot and will change as implementation progresses.

---

## 14. Development Roadmap

| Version | Objective | Status |
|---|---|---|
| v0.1 | Initial compiler prototype | Completed |
| v0.2 | Language foundation, semantic analysis, IR, and runtime foundations | In progress |
| v0.3 | HTML Renderer and SEO Engine | In progress |
| v0.4 | Reactive rendering and hydration | Planned |
| v0.5 | Components and routing | Planned |
| v1.0 | Stable language, compiler, and development tools | Planned |

The roadmap is directional. Individual features may be refined as the language specification and implementation evolve.

---

## 15. Long-Term Vision

pakpourUI aims to provide a unified development experience for websites and web applications.

Developers should be able to write one independent language and produce fast, semantic, accessible, search-engine-friendly, and interactive web experiences.

The long-term goal is a complete ecosystem with its own:

- Programming language
- Language specification
- Compiler
- Intermediate Representation
- HTML and JavaScript backends
- SEO Engine
- Reactive Runtime
- Rendering architecture
- Development tools

**One Language. Websites & Web Applications.**