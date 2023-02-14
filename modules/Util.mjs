function weightedSelect(array) {
	const past = Math.random() * array.reduce((a, b) => a + b);
	let acc = 0;
	for (let i = 0; i < array.length; i++) {
		acc += array[i];
		if (acc >= past) return i;
	}
}
export { weightedSelect };
