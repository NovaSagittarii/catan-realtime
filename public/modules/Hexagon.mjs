import { Div } from './HTMLElements.mjs';
import {
	ResourceEmoji,
	ResourceColors,
	ResourceNames,
	PlayerColors,
} from './GraphicalConstants.mjs';

class Hexagon extends Div {
	constructor(x = 0, y = 0) {
		super('hexagonNode');
		const div = this.htmlElement;
		//	 <svg height='200' width='500'>
		// <polygon points='200,10 250,190 160,210' style='stroke:purple;stroke-width:1' />
		// </svg>
		const xmlns = 'http://www.w3.org/2000/svg';
		const [hexagon, outline] = [...new Array(2)].map(() => {
			const svg = document.createElementNS(xmlns, 'svg');
			svg.setAttribute('height', '100');
			svg.setAttribute('width', '100');
			return svg;
		});
		const padding = 20;
		outline.setAttribute('height', 100 + 2 * padding);
		outline.setAttribute('width', 100 + 2 * padding);
		outline.style.top = outline.style.left = -padding + 'px';

		const polygon = document.createElementNS(xmlns, 'polygon');
		const pts = [...new Array(6)].map((_, x) => [
			Math.cos(((x + 0.5) / 6) * 2 * Math.PI),
			Math.sin(((x + 0.5) / 6) * 2 * Math.PI),
		]);

		const left = Math.min(...pts.map(([x, y]) => x));
		const right = Math.max(...pts.map(([x, y]) => x));
		const top = Math.min(
			...pts.map(([x, y]) => ((y - left) / (right - left)) * 100),
		);
		const bottom = Math.max(
			...pts.map(([x, y]) => ((y - left) / (right - left)) * 100),
		);

		pts.forEach(
			([x, y], i) =>
				(pts[i] = [
					((x - left) / (right - left)) * 100,
					((y - left) / (right - left)) * 100 - top,
				]),
		);
		[hexagon].forEach((x) => x.setAttribute('height', bottom - top));
		polygon.setAttribute('points', pts.map(([x, y]) => `${x},${y}`).join(' '));
		hexagon.appendChild(polygon);
		hexagon.classList.add('hexagon');
		div.append(hexagon, outline);

		const nodes = [];
		pts.forEach(([x, y], i) => {
			const line = document.createElementNS(xmlns, 'line');
			line.setAttribute('x1', x + padding);
			line.setAttribute('y1', y + padding);
			line.setAttribute('x2', pts[(i + 1) % 6][0] + padding);
			line.setAttribute('y2', pts[(i + 1) % 6][1] + padding);
			outline.appendChild(line);

			const node = document.createElement('div');
			node.style.left = x.toFixed(0) + 'px';
			node.style.top = y.toFixed(0) + 'px';
			node.classList.add('node', 'nullStructure');
			div.append(node);
			nodes.push(node);
		});

		this.setPosition(x, y);

		const backgroundDiv = new Div('backgroundLabel').getElement();
		backgroundDiv.style.left = (100 / 2).toFixed(0) + 'px';
		backgroundDiv.style.top = ((bottom - top) / 2).toFixed(0) + 'px';
		this.backgroundLabel = document.createTextNode('=');
		backgroundDiv.append(this.backgroundLabel);
		div.append(backgroundDiv);

		const labelDiv = new Div('label').getElement();
		labelDiv.style.left = (100 / 2).toFixed(0) + 'px';
		labelDiv.style.top = ((bottom - top) / 2).toFixed(0) + 'px';
		this.label = document.createTextNode('-');
		labelDiv.append(this.label);
		div.append(labelDiv);

		this.elements = {
			hexagon,
			lines: [...outline.children],
			nodes,
		};

		this.t = this.r = null;
		this.active = true;
	}
	getHexagon() {
		return this.elements.hexagon;
	}
	getEdge(k) {
		return this.elements.lines[k];
	}
	getVertex(k) {
		return this.elements.nodes[k];
	}
	setPosition(x, y) {
		this.htmlElement.style.left = x + 'px';
		this.htmlElement.style.top = y + 'px';
	}
	setLabel(t) {
		this.label.nodeValue = t;
	}
	setBackgroundLabel(t) {
		this.backgroundLabel.nodeValue = t;
	}
	getResource() {
		return this.r;
	}
	getTrigger() {
		return this.t;
	}
	// t: trigger, r: resource
	applyConfiguration({ t, r }) {
		const pips = '\u2022'.repeat(6 - Math.abs(7 - t));
		this.setLabel(`${t}\n${pips}`);
		this.setBackgroundLabel(ResourceEmoji[r]);
		this.elements.hexagon.querySelector('polygon').style.fill =
			ResourceColors[r];
		this.htmlElement.title = `${ResourceNames[r]} (${t})`;
		this.t = t;
		this.r = r;
	}
	applyStatus(active) {
		if (active) {
			this.htmlElement.classList.remove('dropShadow'); // don't reanimate it
			this.htmlElement.classList.remove('inactive');
		} else {
			this.htmlElement.classList.add('inactive');
		}
		this.active = active;
	}
	initialize() {
		this.elements.lines.forEach((line) => {
			line.style.removeProperty('stroke');
		});
		this.elements.nodes.forEach((node) => {
			node.style.removeProperty('background');
			node.classList.remove('citySmall', 'cityLarge');
			node.classList.add('nullStructure');
		});
	}
	sync(z, owner, structure) {
		// console.log('hexnode.sync', {z, owner, structure});
		if (structure & 16)
			return; // sync hexagon (but you dont build on it -- use applyConfiguration to set robber instead)
		else if (structure & 8) {
			// sync edge
			const edge = this.getEdge(z);
			// console.log('edge', edge);
			edge.style.stroke = PlayerColors[owner % PlayerColors.length];
		} else {
			// sync vertex
			const vertex = this.getVertex(z);
			// console.log('vertex', vertex);
			vertex.style.background = PlayerColors[owner % PlayerColors.length];
			switch (structure) {
				case 1: // settlement
					vertex.classList.remove('nullStructure');
					vertex.classList.add('citySmall');
					break;
				case 2: // city
					vertex.classList.add('cityLarge');
					vertex.classList.remove('citySmall');
			}
		}
	}
}

export { Hexagon };
