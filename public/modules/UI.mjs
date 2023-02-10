import { Hexagon } from './Hexagon.mjs';
import { HexagonGrid } from './HexagonGrid.mjs';

const hexagonGrid = new HexagonGrid({
	minWidth: 3,
	maxWidth: 5,
});
document.body.append(hexagonGrid.getElement());

console.log(hexagonGrid);

export { Hexagon, HexagonGrid };
