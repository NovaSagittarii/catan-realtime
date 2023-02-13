import { Div } from './HTMLElements.mjs';
import { Hexagon } from './Hexagon.mjs';

// callbacks expected = {node, edge, vertex} - takes y, x, z
class HexagonGrid extends Div {
	constructor({ minWidth, maxWidth, callbacks }) {
		super('hexagonGrid');
		const div = this.htmlElement;

		const k = maxWidth - minWidth;
		this.grid = [...new Array(2 * k + 1)].map(() =>
			[...new Array(maxWidth)].map(() => null),
		);
		for (let i = -k; i <= k; i++) {
			for (let j = 1; j <= maxWidth - Math.abs(i); j++) {
				const x = Math.abs(i) / 2 + j - 1;
				const y = i + k;
				const h = new Hexagon();

				const y1 = -i + k;
				const x1 = j + Math.max(i, 0) - 1;

				h.setPosition(x * 100 * 1.4, y * Math.sqrt(3) * 50 * 1.4);
				h.getHexagon().addEventListener('click', () =>
					// this.process(y1, x1, 16),
					callbacks?.node(x1, y1, 16),
				);
				this.grid[y1][x1] = h;
				for (let z = 0; z < 6; z++) {
					const z2 = z; // (z + 2 + 6) % 6;
					h.getEdge(z).addEventListener('click', () =>
						// this.process(y1, x1, 8 | z2),
						callbacks?.edge(x1, y1, 8 | z2),
					);
					h.getVertex(z).addEventListener('click', () =>
						// this.process(y1, x1, z2),
						callbacks?.vertex(x1, y1, z2),
					);
				}
				// h.setLabel([i+k, j+Math.max(i,0)-1]);
				div.append(h.getElement());
				// if(i==-k &&j==1)console.log(h.getElement());
			}
		}
	}
	process(x, y, z) {
		console.log(x, y, z);
	}
	applyConfiguration(grid) {
		for (let i = 0; i < grid.length; i++) {
			for (let j = 0; j < grid[i].length; j++) {
				if (grid[i][j] !== null) {
					this.grid[i][j].applyConfiguration(grid[i][j]);
				}
			}
		}
	}
	sync({ x, y, z, building, playerId }) {
		const nodeOffset = [
			[
				[1, 0, 2],
				[1, -1, 4],
			],
			[
				[1, -1, 2],
				[0, -1, 4],
			],
			[
				[0, -1, 2],
				[-1, 0, 4],
			],
			[
				[-1, 0, 2],
				[-1, 1, 4],
			],
			[
				[-1, 1, 2],
				[0, 1, 4],
			],
			[
				[0, 1, 2],
				[1, 0, 4],
			],
		];
		const edgeOffset = nodeOffset
			.map((_, i) => nodeOffset[(i + 1) % 6][0])
			.map(([dx, dy, dz]) => [[dx, dy, 3]]);
		// console.log('hexgrid.sync', { x, y, z, building, playerId });
		[[0, 0, 0], ...(z & 8 ? edgeOffset[z & 7] : nodeOffset[z & 7])].forEach(
			([dx, dy, dz]) => {
				// console.log(x + dx, y + dy, (z + dz + (z & 8 ? -2 : 0) + 6) % 6);
				this.getNode(x + dx, y + dy)?.sync(
					(z + dz + (z & 8 ? -2 : 0) + 6) % 6,
					playerId,
					building,
				);
			},
		);
	}
	getNode(x, y) {
		// console.log("hexgrid.getNode", x, y);
		if (!(y in this.grid) || !(x in this.grid[y])) return undefined;
		return this.grid[y][x];
	}
}

export { HexagonGrid };
