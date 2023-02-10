import { Structure } from './Structure.mjs';

let x = 0;
class Edge extends Structure {
	constructor() {
		super();
		this.id = x++;
	}
}

export { Edge };
