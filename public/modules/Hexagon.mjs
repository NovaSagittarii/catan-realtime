class Hexagon {
	constructor(x = 0, y = 0) {
		const div = (this.htmlElement = document.createElement('div'));
		div.classList.add('hexagonNode');
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
		[hexagon, outline].forEach((x) => x.setAttribute('height', bottom - top));
		polygon.setAttribute('points', pts.map(([x, y]) => `${x},${y}`).join(' '));
		hexagon.appendChild(polygon);
		hexagon.classList.add('hexagon');
		div.append(hexagon, outline);

		pts.forEach(([x, y], i) => {
			const line = document.createElementNS(xmlns, 'line');
			line.setAttribute('x1', x);
			line.setAttribute('y1', y);
			line.setAttribute('x2', pts[(i + 1) % 6][0]);
			line.setAttribute('y2', pts[(i + 1) % 6][1]);
			outline.appendChild(line);

			const node = document.createElement('div');
			node.style.left = x + 'px';
			node.style.top = y + 'px';
			node.classList.add('node');
			div.append(node);
		});

		this.setPosition(x, y);

		this.label = document.createTextNode('');
		div.append(this.label);
	}
	getElement() {
		return this.htmlElement;
	}
	setPosition(x, y) {
		this.htmlElement.style.left = x + 'px';
		this.htmlElement.style.top = y + 'px';
	}
	setLabel(t) {
		this.label.nodeValue = t;
	}
}

export { Hexagon };
