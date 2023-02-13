import { Div, Span } from './HTMLElements.mjs';

class Attribute extends Div {
	constructor(attribute) {
		super('attribute');
		this.attribute = attribute;

		const labelDiv = new Span('attributeLabel').getElement();
		const label = document.createTextNode(attribute);
		labelDiv.append(label);
		this.htmlElement.append(labelDiv);
	}
	sync() {}
}
class TextAttribute extends Attribute {
	constructor(attribute, value) {
		super(attribute);
		this.value = value;

		const textDiv = new Span('textAttribute').getElement();
		const text = (this.textNode = document.createTextNode(value));
		textDiv.append(text);
		this.htmlElement.append(textDiv);
	}
	sync(newText) {
		this.textNode.nodeValue = newText;
	}
}
class NumericalAttribute extends Attribute {}
class CooldownAttribute extends Attribute {
	constructor(attribute, value) {
		super(attribute);
		this.initial = this.final = value;

		this.bar = new Span('bar').getElement();
		this.htmlElement.append(this.bar);
	}
	sync(newFinal) {
		this.final = newFinal;
		this.resize();
		if (this.final > this.initial) {
			this.bar.classList.remove('barComplete');
		}
	}
	setProgress(newInitial) {
		this.initial = newInitial;
		this.resize();
		if (this.final < this.initial) {
			this.bar.classList.add('barComplete');
		}
	}
	resize() {
		this.bar.style.width =
			100 * Math.max(0, Math.min(1, 1 - (this.final - this.initial) / 100)) +
			'%';
	}
}

export { Attribute, TextAttribute, NumericalAttribute, CooldownAttribute };
