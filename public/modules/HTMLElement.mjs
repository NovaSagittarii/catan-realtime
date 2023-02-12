class HTMLElement {
	constructor(tagName, ...classNames) {
		this.htmlElement = document.createElement(tagName);
		this.htmlElement.classList.add(...classNames);
	}
	getElement() {
		return this.htmlElement;
	}
}

export { HTMLElement };
