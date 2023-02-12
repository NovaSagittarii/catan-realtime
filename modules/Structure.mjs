import { StructureType } from './Structures.mjs';

let x = 0;
class Structure {
	static StructureType = StructureType;
	constructor() {
		this.initialize();
		this.id = x++;
	}
	initialize() {
		this.owner = null;
		this.structure = null;
	}
	build(who, what) {
		this.owner = who;
		this.structure = what;
	}
	getOwner() {
		return this.owner;
	}
	getStructure() {
		return this.structure;
	}
	export() {
		const o = this.owner?.id;
		const s = this.structure;
		return { o, s };
	}
}

export { Structure };
