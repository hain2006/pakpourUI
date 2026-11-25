import { describe, it, expect, vi } from "vitest";
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
    it("should update dynamic dependencies and stop effects", () => {
        const condition = signal(true);
        const left = signal("left");
        const right = signal("right");

        const values: string[] = [];

        const stop = effect(() => {
            values.push(
                condition.value
                    ? left.value
                    : right.value
            );
        });

        expect(values).toEqual(["left"]);

        left.value = "updated";
        expect(values).toEqual(["left", "updated"]);

        condition.value = false;
        expect(values).toEqual(["left", "updated", "right"]);

        left.value = "ignored";
        expect(values).toEqual(["left", "updated", "right"]);

        right.value = "new";
        expect(values).toEqual([
            "left",
            "updated",
            "right",
            "new"
        ]);

        stop();

        right.value = "stopped";

        expect(values).toEqual([
            "left",
            "updated",
            "right",
            "new"
        ]);
    });
    it("should restore parent effect after nested effect", () => {
        const beforeNested = signal(0);
        const afterNested = signal(0);
        const inner = signal(0);

        const outerValues: string[] = [];
        const innerValues: number[] = [];

        let stopInner: (() => void) | undefined;

        const stopOuter = effect(() => {
            outerValues.push(`before:${beforeNested.value}`);

            if (!stopInner) {
                stopInner = effect(() => {
                    innerValues.push(inner.value);
                });
            }

            outerValues.push(`after:${afterNested.value}`);
        });

        afterNested.value = 1;
        inner.value = 1;

        expect(outerValues).toEqual([
            "before:0",
            "after:0",
            "before:0",
            "after:1"
        ]);

        expect(innerValues).toEqual([0, 1]);

        stopOuter();
        stopInner?.();
    });
    it("should prevent an effect from running recursively", () => {
        const count = signal(0);
        let executions = 0;

        const stop = effect(() => {
            executions++;

            if (count.value < 2) {
                count.value++;
            }
        });

        expect(count.value).toBe(1);
        expect(executions).toBe(1);

        count.value = 2;

        expect(executions).toBe(2);

        stop();
    });
    it("should handle effect errors and restore the effect stack", () => {
        const first = signal(0);
        const second = signal(0);

        const values: number[] = [];
        const errors: unknown[] = [];

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation((...args) => {
                errors.push(args[1]);
            });

        const stop = effect(() => {
            const value = first.value;

            if (value === 1) {
                throw new Error("Test error");
            }

            values.push(value);
        });

        first.value = 1;
        second.value = 1;

        expect(values).toEqual([0]);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(Error);

        stop();
        errorSpy.mockRestore();
    });

    it("should track dependencies after an effect error", () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => { });
        const trigger = signal(0);
        const recovery = signal(0);

        const values: number[] = [];

        const stop = effect(() => {
            trigger.value;

            if (trigger.value === 1) {
                throw new Error("Test error");
            }

            values.push(recovery.value);
        });

        trigger.value = 1;
        recovery.value = 2;

        expect(values).toEqual([0]);
        trigger.value = 2;

        expect(values).toEqual([0, 2]);

        recovery.value = 3;

        expect(values).toEqual([0, 2, 3]);
        errorSpy.mockRestore();
        stop();
    });

});