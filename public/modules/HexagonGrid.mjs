import { Hexagon } from './Hexagon.mjs';

class HexagonGrid {
	constructor({ minWidth, maxWidth }) {
		const div = (this.htmlElement = document.createElement('div'));
		div.classList.add('hexagonGrid');

		const k = maxWidth - minWidth;
		this.grid = [...new Array(2*k+1)].map(() => [...new Array(maxWidth)].map(() => null));
		for (let i = -k; i <= k; i++) {
			for (let j = 1; j <= maxWidth - Math.abs(i); j++) {
				const x = Math.abs(i) / 2 + j - 1;
				const y = i + k;
				const h = new Hexagon();

				const y1 = -i + k;
				const x1 = j + Math.max(i, 0) - 1;

				h.setPosition(x * 100, y * Math.sqrt(3) * 50);
				h.getHexagon().addEventListener('click', () =>
					this.process(y1, x1, 16),
				);
				this.grid[y1][x1] = h;
				for (let z = 0; z < 6; z++) {
					const z2 = (z + 2 + 6) % 6;
					h.getEdge(z).addEventListener('click', () =>
						this.process(y1, x1, 8 | z2),
					);
					h.getVertex(z).addEventListener('click', () =>
						this.process(y1, x1, z2),
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
	applyConfiguration(grid){
		for(let i = 0; i < grid.length; i ++){
			for(let j = 0; j < grid[i].length; j ++){
				if(grid[i][j] !== null){
					this.grid[i][j].applyConfiguration(grid[i][j]);
				}
			}
		}
	}
}

export { HexagonGrid };
