function weightedSelect(array) {
	const past = Math.random() * array.reduce((a, b) => a + b);
	let acc = 0;
	for (let i = 0; i < array.length; i++) {
		acc += array[i];
		if (acc >= past) return i;
	}
}
function shuffle(array) {
	// https://stackoverflow.com/a/2450976
	let currentIndex = array.length,
		randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}
	return array;
}
export { weightedSelect, shuffle };
