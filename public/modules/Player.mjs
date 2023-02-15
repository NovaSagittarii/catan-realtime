import { Div, Span } from './HTMLElements.mjs';
import {
	TextAttribute,
	NumericalAttribute,
	CooldownAttribute,
	ListAttribute,
	ListAttributeWithPreview,
} from './Attributes.mjs';
import {
	ResourceEmoji,
	StructureEmoji,
	CardEmoji,
	PlayerColors,
} from './GraphicalConstants.mjs';

class Player extends Div {
	constructor(id, name) {
		super('panel');
		this.attributes = {
			// id: id;
			name: new TextAttribute(id, name),
			points: new TextAttribute('Victory Points', 0),
			nextRoll: new CooldownAttribute('next roll', 0),
			roll: new TextAttribute('rolling?', 0),
			robber: new NumericalAttribute('Robbers to place', 0),
			road: new NumericalAttribute('Roads to place', 0),
			city_small: new NumericalAttribute('Settlements to place', 0),
			resources: new ListAttributeWithPreview(
				'',
				['Brick', 'Lumber', 'Sheep', 'Wheat', 'Ore'].map(
					(x, i) => ResourceEmoji[i] + ' ' + x,
				),
			),
			blueprints: new ListAttribute(
				'',
				['Road', 'Settlement', 'City'].map(
					(x, i) => StructureEmoji[i] + ' ' + x,
				),
			),
			cards: new ListAttribute(
				'',
				['Knight', 'Point', 'Monopoly', 'Resources', '2 Roads'].map(
					(x, i) => CardEmoji[i] + ' ' + x,
				),
			),
		};
		this.attributes.name.getElement().classList.add('playerName');
		this.attributes.name.getElement().style.color =
			PlayerColors[id % PlayerColors.length];
		for (const attribute of Object.values(this.attributes))
			this.htmlElement.append(attribute.getElement());
	}
	sync(attribute, value) {
		this.attributes[attribute]?.sync(value);
	}
	setTime(newTime) {
		this.attributes.nextRoll.setProgress(newTime);
	}
	destroy() {
		this.htmlElement.parentNode.removeChild(this.htmlElement);
	}
}

export { Player };
