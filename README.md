# pakpourUI

**A small experimental UI language and compiler built with TypeScript.**

pakpourUI is an experimental project that explores building a custom language for creating web user interfaces.

Instead of writing HTML directly, developers will eventually be able to describe UI structures using `.pui` files and compile them into JavaScript.

## Project Goals

- Create a simple, readable UI language.
- Build a compiler using TypeScript.
- Generate JavaScript from `.pui` source files.
- Develop an independent reactive runtime.
- Build and update DOM elements without a Virtual DOM.

## Current Features

- Lexer and tokenization
- Parser and Abstract Syntax Tree (AST)
- Page, state and UI element declarations
- Basic expressions and assignments
- JavaScript code generation
- Initial signal-based reactive runtime

## Example

```text
page "Counter" {

    state count = 0

    column {
        heading "Welcome to pakpourUI"
        text "Current count: {count}"

        button "Increase" {
            count = count + 1
        }
    }
}
```

## Technology Stack

- TypeScript
- JavaScript
- Node.js
- Vite

## Project Status

**Early development – Experimental prototype**

pakpourUI is currently under active development. APIs and syntax may change as the compiler and runtime evolve.

## Vision

The long-term goal is to build an independent, lightweight UI development framework with its own syntax, compiler and reactive runtime.

---

Created by **Hamidreza Pakpour**