import { HTMLElement } from './HTMLElement.mjs';

const keys = {};
const onkeycode = {};
document.body.addEventListener('keydown', (e) => {
	if (keys[e.keyCode]) return;
	keys[e.keyCode] = true;
	const f = onkeycode[e.keyCode];
	if (f) f();
});
document.body.addEventListener('keyup', (e) => {
	keys[e.keyCode] = false;
});

// every day i am reminded that web frameworks exist for a reason
class Div extends HTMLElement {
	constructor(...classNames) {
		super('div', ...classNames);
	}
}
class Span extends HTMLElement {
	constructor(...classNames) {
		super('span', ...classNames);
	}
}
class TextDiv extends Div {
	constructor(text, ...classNames) {
		super(...classNames);
		this.htmlElement.append(document.createTextNode(text));
	}
}
class Button extends HTMLElement {
	constructor(label, classNames, onclick) {
		super('button', ...classNames);
		this.htmlElement.addEventListener('click', onclick);
		this.htmlElement.append(document.createTextNode(label));
	}
}
class ButtonKeybind extends Button {
	constructor(keycode, label, classNames, onclick) {
		super(label, classNames, onclick);
		onkeycode[keycode] = () => onclick();
	}
}
class SelectModal extends HTMLElement {
	static activeModal = null;
	static activeCallbacks = [];
	constructor({ title, choices, callbacks }) {
		super('div', 'selectModal', 'hidden');
		this.active = false;
		this.choices = choices; // String[]
		this.callbacks = callbacks; // Function[]
		this.htmlElement.append(
			new TextDiv(title, 'selectModalTitle').getElement(),
		);
		console.log(callbacks);
		for (let i = 0; i < choices.length; i++) {
			this.htmlElement.append(
				new Button(
					`[${i + 1}] ` + choices[i],
					['text-left'],
					callbacks[i],
				).getElement(),
			);
		}
		this.htmlElement.addEventListener('click', () => this.resolve());
	}
	activate() {
		if (SelectModal.activeModal) SelectModal.activeModal.resolve();
		SelectModal.activeModal = this;
		SelectModal.activeCallbacks = this.callbacks;
		this.htmlElement.classList.remove('hidden');
	}
	resolve() {
		SelectModal.activeModal = null;
		SelectModal.activeCallbacks = [];
		this.htmlElement.classList.add('hidden');
	}
}
[...new Array(9)].forEach((_, i) => {
	onkeycode[49 + i] = () => {
		// '1' to '9'
		if (SelectModal.activeCallbacks[i]) {
			SelectModal.activeCallbacks[i]();
			SelectModal.activeModal.resolve();
		}
	};
});

export { HTMLElement, Div, Span, Button, ButtonKeybind, SelectModal };
