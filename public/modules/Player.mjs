import { Div, Span } from './HTMLElements.mjs';
import {
	TextAttribute,
	NumericalAttribute,
	CooldownAttribute,
} from './Attributes.mjs';

class Player extends Div {
	constructor(id, name) {
		super('panel');
		this.attributes = {
			// id: id;
			name: new TextAttribute(id, name),
			points: new TextAttribute('Victory Points', 0),
			nextRoll: new CooldownAttribute('next roll', 0),
			roll: new TextAttribute('rolling?', 0),
			robber: new TextAttribute('Robbers to place', 0),
			road: new TextAttribute('Roads to place', 0),
			city_small: new TextAttribute('Settlements to place', 0),
			resources: new TextAttribute('Resources', 0),
			blueprints: new TextAttribute('Blueprints', 0),
			cards: new TextAttribute('Cards', 0),
		};
		this.attributes.name.getElement().classList.add('playerName');
		for (const attribute of Object.values(this.attributes))
			this.htmlElement.append(attribute.getElement());
	}
	sync(attribute, value) {
		this.attributes[attribute]?.sync(value);
	}
	setTime(newTime) {
		this.attributes.nextRoll.setProgress(newTime);
	}
}

export { Player };
