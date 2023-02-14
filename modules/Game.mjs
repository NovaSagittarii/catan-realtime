import { ResourceNode } from './ResourceNode.mjs';
import { Vertex } from './Vertex.mjs';
import { Edge } from './Edge.mjs';

import { Player } from './Player.mjs';
import { InitialResource } from './Resources.mjs';
import { InitialCard } from './Cards.mjs';

import { StructureType } from './Structures.mjs';

const directions = [
	// +1 is clockwise
	[1, -1], // 0 (lower right)
	[0, -1], // 1 (lower left)
	[-1, 0], // 2 (middle left)
	[-1, 1], // 3 (upper left)
	[0, 1], // 4 (upper right)
	[1, 0], // 5 (middle right)
];

class Game {
	constructor() {
		this.time = 0;
		this.tickerInterval = null;
		this.grid = [...new Array(5)].map(() => [...new Array(5)]);
		const N = 5;
		const p = 3;
		const vertices = [...new Array((N + 2) ** 2 * p)].map(() => new Vertex());
		const edges = [...new Array((N + 2) ** 2 * p)].map(() => new Edge());

		// there are 2 unique vertices per hexagon (I SHOULDVE REALIZED THIS EARLIER)
		const vertexSurroundings = [
			[0, 0, 0], // lower right node (on client)
			[0, 0, 1], // lower center node (on client)
			[-1, 0, 0],
			[-1, 1, 1],
			[-1, 1, 0],
			[0, 1, 1],
		];

		// there are 3 unique edges per hexagon
		const edgeSurroundings = [
			[1, -1, 3], // go Upright, use Downleft line
			[0, -1, 4],
			[-1, 0, 5],
			[0, 0, 0],
			[0, 0, 1],
			[0, 0, 2],
		];

		for (let i = 0; i < N; i++) {
			for (let j = 0; j < N; j++) {
				this.grid[i][j] = [
					new ResourceNode(),
					vertexSurroundings.map(
						([dx, dy, dz]) =>
							vertices[
								(i + dy + 1) * (N + 2) * p + (j + dx + 1) * p + (dz % p)
							],
					),
					edgeSurroundings.map(
						([dx, dy, dz]) =>
							edges[(i + dy + 1) * (N + 2) * p + (j + dx + 1) * p + (dz % p)],
					),
				];
			}
		}

		// console.log(
		// 	this.grid.map((row) =>
		// 		row.map((node) => node[2].map((x) => x?.id || '?').join(' ')),
		// 	),
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
		// returns type ResourceNode
		if (!(y in this.grid) || !(x in this.grid[y])) return null;
		return this.grid[y][x][0];
	}
	getVertex(x, y, k) {
		// returns type Vertex
		// console.log('getvertex', x, y, k);
		const alt = directions.map(([dx, dy], i) => [
			[dx, dy, 4],
			[...directions[(i - 1 + 6) % 6], 2],
		]);
		if (this.grid[y] && this.grid[y][x]) return this.grid[y][x][1][k];
		else {
			for (const [dx, dy, dz] of alt[k]) {
				const nx = x + dx;
				const ny = y + dy;
				const nz = (k + dz) % 6;
				if (this.grid[ny] && this.grid[ny][nx]) return this.grid[ny][nx][1][nz];
			}
		}
		return null;
	}
	getEdge(x, y, k) {
		// returns type Edge
		// console.log('getedge', x, y, k);
		const alt = directions.map(([dx, dy]) => [[dx, dy, 3]]);
		if (this.grid[y] && this.grid[x]) return this.grid[y][x][2][k];
		else {
			for (const [dx, dy, dz] of alt[k]) {
				const nx = x + dx;
				const ny = y + dy;
				const nz = (k + dz) % 6;
				if (this.grid[ny] && this.grid[ny][nx]) {
					return this.grid[ny][nx][2][nz];
				}
			}
		}
		return null;
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
	*getNodes() {
		for (const i in this.grid) {
			const row = this.grid[i];
			for (const j in row) {
				yield [i, j, row[j]];
			}
		}
	}
	processRoll(x, t) {
		// console.log('processRoll', {x, t});
		for (const row of this.grid) {
			for (const [node, vertices, edges] of row) {
				if (node.isActive(t)) {
					if (node.trigger === x) {
						for (const vertex of vertices) {
							if (vertex.getOwner()) {
								vertex.getOwner().resources[node.resourceType] +=
									vertex.getStructure() === StructureType.CITY_LARGE ? 2 : 1;
								// TODO : handle limited resources (toss results into array and shuffle, process in order)
							}
						}
					}
				}
			}
		}
	}
	startTicker(tickerInterval, callback) {
		clearInterval(this.tickerInterval);
		this.tickerInterval = setInterval(() => {
			this.tick();
			callback(this.time);
		}, tickerInterval);
	}
	tick() {
		this.time += 1;
	}
}

export { Game };
