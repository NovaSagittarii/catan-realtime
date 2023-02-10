import { StructureType } from './Structures.mjs';

class Structure {
	static StructureType = StructureType;
	constructor(){
		this.owner = null;
		this.structure = null;
	}
	build(who, what){
		this.owner = who;
		this.structure = what;
	}
	getOwner(){
		return this.owner;
	}
	getStructure(){
		return this.structure;
	}
}

export { Structure };