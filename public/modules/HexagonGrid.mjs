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
				// h.setLabel([i+k, j+Math.max(i,0)-1]);
				div.append(h.getElement());
				// if(i==-k &&j==1)console.log(h.getElement());
			}
		}
	}
	getElement() {
		return this.htmlElement;
	}
}

export { HexagonGrid };
