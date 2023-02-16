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
class NotificationAttribute extends Attribute {
	constructor(attribute, value) {
		super('---');
	}
	sync(newText) {
		this.htmlElement.innerText = newText;
		this.htmlElement.classList.remove('flash');
		void this.htmlElement.offsetWidth;
		this.htmlElement.classList.add('flash');
	}
}
class NumericalAttribute extends TextAttribute {
	constructor(attribute, value) {
		super(attribute, value);
		this.htmlElement.classList.add('flashingOutline');
	}
	sync(newNumber) {
		super.sync(newNumber);
		this.htmlElement.style.display = newNumber ? 'block' : 'none';
	}
}
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
class ListAttribute extends Attribute {
	constructor(attribute, listNames) {
		super(attribute);
		this.htmlElement.classList.add('listAttribute');
		this.labels = listNames;
		this.values = listNames.map((name) => new TextAttribute(name, 0));
		this.values.forEach((textAttribute) =>
			this.htmlElement.append(textAttribute.getElement()),
		);
	}
	sync(newData) {
		for (const i in newData) {
			this.values[i].sync(newData[i]);
		}
	}
}
class ListAttributeWithPreview extends ListAttribute {
	constructor(attribute, listNames) {
		super(attribute, listNames);
		this.previews = listNames.map(() => document.createTextNode(''));
		this.previews.forEach((textAttribute, i) =>
			this.values[i].getElement().lastChild.append(textAttribute),
		);
	}
	syncPreview(newData) {
		for (const i in newData) {
			this.previews[i].nodeValue = newData[i];
		}
	}
}

export {
	Attribute,
	TextAttribute,
	NotificationAttribute,
	NumericalAttribute,
	CooldownAttribute,
	ListAttribute,
	ListAttributeWithPreview,
};
