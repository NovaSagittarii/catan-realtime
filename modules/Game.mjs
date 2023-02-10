import { ResourceNode } from './ResourceNode.mjs';
import { Vertex } from './Vertex.mjs';
import { Edge } from './Edge.mjs';

import { Player } from './Player.mjs';
import { InitialResource } from './Resources.mjs';
import { InitialCard } from './Cards.mjs';

class Game {
	constructor() {
		this.grid = [...new Array(5)].map(() => [...new Array(5)]);
		const N = 5;
		const p = 3;
		const vertices = [...new Array((N + 2) ** 2 * p)].map(() => new Vertex());
		const edges = [...new Array((N + 2) ** 2 * p)].map(() => new Edge());

		const surroundings = [
			[1, -1, 3], // go Upright, use Downleft line
			[1, 0, 4],
			[0, 1, 5],
			[0, 0, 0],
			[0, 0, 1],
			[0, 0, 2],
		];

		for (let i = 0; i < N; i++) {
			for (let j = 0; j < N; j++) {
				this.grid[i][j] = [
					new ResourceNode(),
					...surroundings.map(
						([dx, dy, dz]) =>
							vertices[
								(i + dy + 1) * (N + 2) * p + (j + dx + 1) * p + (dz % p)
							],
					),
					...surroundings.map(
						([dx, dy, dz]) =>
							edges[(i + dy + 1) * (N + 2) * p + (j + dx + 1) * p + (dz % p)],
					),
				];
			}
		}

		// console.log(
		// 	this.grid.map(row =>
		// 		row.map(node =>
		// 			node.slice(7, 13)
		// 				.map(x => x?.id||"?").join(' ')
		// 		)
		// 	)
		// );

		this.initialize();
	}
	initialize() {
		this.resources = new Array(...InitialResource);
		this.cards = new Array(...InitialCard);
		// this.cardOwners = [...new Array(StatusCount)].map(() => null);
		for (const row of this.grid) {
			for (const [node, ...structures] of row) {
				node.initialize();
				structures.forEach((x) => x.initialize());
			}
		}
	}
}

export { Game };
