import { ResourceNode } from './ResourceNode.mjs';
import { Vertex } from './Vertex.mjs';
import { Edge } from './Edge.mjs';

import { Player } from './Player.mjs';
import { InitialResource } from './Resources.mjs';
import { InitialCard } from './Cards.mjs';

import { StructureType } from './Structures.mjs';

class Game {
	constructor() {
		this.time = 0;
		this.tickerInterval = null;
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
					surroundings.map(
						([dx, dy, dz]) =>
							vertices[
								(i + dy + 1) * (N + 2) * p + (j + dx + 1) * p + (dz % p)
							],
					),
					surroundings.map(
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
			for (const [node, vertices, edges] of row) {
				node.initialize();
				for (const structure of [...vertices, ...edges]) structure.initialize();
			}
		}
		clearInterval(this.tickerInterval);
	}
	getNode(x, y) {
		if (!(y in this.grid) || !(x in this.grid[y])) return null;
		return this.grid[y][x][0];
	}
	getVertex(x, y, k) {
		// console.log('getvertex', x, y, k);
		if (!(y in this.grid) || !(x in this.grid[y])) return null;
		if (k < 0 || k > 6) return null;
		return this.grid[y][x][1][k];
	}
	getEdge(x, y, k) {
		if (!(y in this.grid) || !(x in this.grid[y])) return null;
		if (k < 0 || k > 6) return null;
		return this.grid[y][x][2][k];
	}
	getTime() {
		return this.time;
	}
	getResourceConfiguration() {
		// 2-4, to 0-2 (getnode and edge and vertex)
		// TODO : handle general case
		const N = 5;
		const midpoint = Math.floor(N / 2);
		const grid = [...new Array(N)].map((_, i) =>
			[...new Array(N)].map((_, j) => {
				const left = Math.max(0, midpoint - i);
				const right = N - 1 + Math.min(0, +midpoint - i);
				if (j < left || j > right) return null;
				return this.getNode(j, i).export();
			}),
		);
		return grid;
	}
	processRoll(x, t) {
		for (const row of this.grid) {
			for (const [node, vertices, edges] of row) {
				for (const vertex of vertices) {
					if (node.trigger === x && node.isActive(t)) {
						if (vertex.getOwner()) {
							vertex.getOwner().resources[node.resourceType] +=
								node.structure === StructureType.CITY_LARGE ? 2 : 1;
							// TODO : handle limited resources (toss results into array and shuffle, process in order)
						}
					}
				}
			}
		}
	}
	startTicker(tickerInterval) {
		clearInterval(this.tickerInterval);
		this.tickerInterval = setInterval(this.tick, tickerInterval);
	}
	tick() {
		this.time += 1;
	}
}

export { Game };
