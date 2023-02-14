import { HTMLElement } from './HTMLElement.mjs';

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
	}
}

export { HTMLElement, Div, Span, Button, ButtonKeybind };
