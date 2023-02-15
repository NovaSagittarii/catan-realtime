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
	static activeCallback = [];
	constructor({ title, choices }) {
		super('div', 'selectModal', 'hidden');
		this.active = false;
		this.choices = choices; // String[]
		this.title = title;
		this.titleDiv = new TextDiv(title, 'selectModalTitle').getElement();
		this.htmlElement.append(this.titleDiv);
		for (let i = 0; i < choices.length; i++) {
			this.htmlElement.append(
				new Button(`[${i + 1}] ` + choices[i], ['text-left'], () =>
					SelectModal.activeCallback(i),
				).getElement(),
			);
		}
		this.htmlElement.addEventListener('click', () => this.resolve());
	}
	prompt({ title }) {
		this.titleDiv.innerText = title || this.title;
		if (SelectModal.activeModal) SelectModal.activeModal.resolve();
		return new Promise((resolve, reject) => {
			SelectModal.activeModal = this;
			SelectModal.activeCallback = (x) => {
				if (x === undefined) reject();
				else resolve(x);
			};
			this.htmlElement.classList.remove('hidden');
		});
	}
	resolve() {
		SelectModal.activeModal = null;
		SelectModal.activeCallback = null;
		this.htmlElement.classList.add('hidden');
	}
}
[...new Array(9)].forEach((_, i) => {
	onkeycode[49 + i] = () => {
		// '1' to '9'
		if (SelectModal.activeCallback) {
			SelectModal.activeCallback(i);
			SelectModal.activeModal.resolve();
		}
	};
});

export { HTMLElement, Div, Span, Button, ButtonKeybind, SelectModal };
