import { Hexagon } from './Hexagon.mjs';

class HexagonGrid {
	constructor({ minWidth, maxWidth }) {
		const div = (this.htmlElement = document.createElement('div'));
		div.classList.add('hexagonGrid');

		const k = maxWidth - minWidth;
		for (let i = -k; i <= k; i++) {
			for (let j = 1; j <= maxWidth - Math.abs(i); j++) {
				const x = Math.abs(i) / 2 + j - 1;
				const y = i + k;
				const h = new Hexagon();

				h.setPosition(x * 100, y * Math.sqrt(3) * 50);
				h.getHexagon().addEventListener('click', () =>
					this.process(i + k, j + Math.max(i, 0) - 1, 16),
				);
				for (let z = 0; z < 6; z++) {
					const z2 = (z + 2 + 6) % 6;
					h.getEdge(z).addEventListener('click', () =>
						this.process(i + k, j + Math.max(i, 0) - 1, 8 | z2),
					);
					h.getVertex(z).addEventListener('click', () =>
						this.process(i + k, j + Math.max(i, 0) - 1, z2),
					);
				}
				// h.setLabel([i+k, j+Math.max(i,0)-1]);
				div.append(h.getElement());
				// if(i==-k &&j==1)console.log(h.getElement());
			}
		}
	}
	getElement() {
		return this.htmlElement;
	}
	process(x, y, z) {
		console.log(x, y, z);
	}
}

export { HexagonGrid };
