import { describe, it, expect } from "vitest";
import { signal, effect } from "./runtime";

describe("pakpourUI Runtime", () => {

    it("should create a reactive signal", () => {
        const count = signal(0);

        expect(count.value).toBe(0);

        count.value = 10;

        expect(count.value).toBe(10);
    });

    it("should execute effect when signal changes", () => {
        const count = signal(0);

        let result = 0;

        effect(() => {
            result = count.value;
        });

        expect(result).toBe(0);

        count.value = 5;

        expect(result).toBe(5);
    });

    it("should not trigger effect when value does not change", () => {
        const count = signal(10);

        let executions = 0;

        effect(() => {
            count.value;
            executions++;
        });

        count.value = 10;

        expect(executions).toBe(1);
    });

});