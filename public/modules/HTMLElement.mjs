class HTMLElement {
	constructor(tagName, ...classNames) {
		this.htmlElement = document.createElement(tagName);
		this.htmlElement.classList.add(...classNames);
	}
	getElement() {
		return this.htmlElement;
	}
	static createElement(tagName, ...classNames) {
		const e = document.createElement(tagName);
		if (classNames) e.classList.add(...classNames);
		return e;
	}
}

export { HTMLElement };
