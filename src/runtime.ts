<CodeBlock language="typescript" editable>
type Effect = () => void;


let activeEffect: Effect | undefined;

export function signal<T>(initialValue: T) {
let value = initialValue;

const subscribers = new Set<Effect>();

return {
get value(): T {
if (activeEffect) {
subscribers.add(activeEffect);
}

return value;
},

set value(newValue: T) {
if (Object.is(value, newValue)) return;

value = newValue;

subscribers.forEach(effect => effect());
}
};
}

export function effect(callback: Effect): void {
const run = () => {
activeEffect = run;

try {
callback();
} finally {
activeEffect = undefined;
}
};

run();
}

export function createElement(
tag: string
): HTMLElement {
return document.createElement(tag);
}

export function bindText(
element: HTMLElement,
getter: () => string
): void {
effect(() => {
element.textContent = getter();
});
}
</CodeBlock>