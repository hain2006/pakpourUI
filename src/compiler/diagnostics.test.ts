
import { describe, it, expect } from "vitest";
import { DiagnosticBag } from "./diagnostics";

describe("pakpourUI Diagnostics", () => {

    it("should store diagnostics", () => {
        const bag = new DiagnosticBag();

        bag.report({
            code: "PUI1001",
            message: "Undefined variable",
            severity: "error",
            category: "semantic"
        });

        expect(bag.count).toBe(1);
        expect(bag.hasErrors).toBe(true);
    });

    it("should separate errors and warnings", () => {
        const bag = new DiagnosticBag();

        bag.report({
            code: "PUI1001",
            message: "Undefined variable",
            severity: "error",
            category: "semantic"
        });

        bag.report({
            code: "PUI2001",
            message: "Page title is too long",
            severity: "warning",
            category: "seo"
        });

        expect(bag.getErrors()).toHaveLength(1);
        expect(bag.getWarnings()).toHaveLength(1);
    });

    it("should clear diagnostics", () => {
        const bag = new DiagnosticBag();

        bag.report({
            code: "PUI1001",
            message: "Undefined variable",
            severity: "error",
            category: "semantic"
        });

        bag.clear();

        expect(bag.count).toBe(0);
        expect(bag.hasErrors).toBe(false);
    });

});
