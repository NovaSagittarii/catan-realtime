import { Div, Span } from './HTMLElements.mjs';

class Attribute extends Div {
	constructor(attribute, value) {
		super('attribute');
		this.attribute = attribute;
		this.value = value;

		const labelDiv = new Span('attributeLabel').getElement();
		const label = document.createTextNode(attribute);
		labelDiv.append(label);
		this.htmlElement.append(labelDiv);
	}
	sync() {}
}
class TextAttribute extends Attribute {
	constructor(attribute, value) {
		super(attribute, value);

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

class Player extends Div {
	constructor(id, name) {
		super('panel');
		this.attributes = {
			// id: id;
			name: new TextAttribute(id, name),
			points: new TextAttribute('Victory Points', 0),
			nextRoll: new TextAttribute('next roll', 0),
			roll: new TextAttribute('rolling?', 0),
			robber: new TextAttribute('Robbers to place', 0),
			road: new TextAttribute('Roads to place', 0),
			city_small: new TextAttribute('Settlements to place', 0),
			resources: new TextAttribute('Resources', 0),
			blueprints: new TextAttribute('Blueprints', 0),
			cards: new TextAttribute('Cards', 0),
		};
		for (const attribute of Object.values(this.attributes))
			this.htmlElement.append(attribute.getElement());
	}
	sync(attribute, value) {
		this.attributes[attribute]?.sync(value);
	}
}

export { Player };
