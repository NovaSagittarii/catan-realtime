import { Div } from './HTMLElements.mjs';

/* rendering roll animations and resource animations */
class RollAnimator {
	constructor({ body, nodes }) {
		this.body = body;
		this.nodes = nodes;
		this.rollPositions = [...new Array(13)].map(() => []); //
	}
	updateLocations() {
		for (let i = 1; i <= 12; i++) this.rollPositions[i] = [];
		for (const node of this.nodes) {
			// console.log(node);
			const { x, y, width, height } = node
				.getElement()
				.querySelector('.label')
				.getBoundingClientRect();
			this.rollPositions[+node.label.nodeValue.split('\n')[0]].push([
				node.getElement(),
				x + width / 2,
				y + height / 2,
			]);
		}
	}
	processRoll(rollValue) {
		// console.log('RollAnimator.processRoll', rollValue);
		for (const [e, x, y] of this.rollPositions[rollValue]) {
			// https://stackoverflow.com/a/58353279 (reflow does not work on svg!!?? probably something to do with the createElementNS)
			e.classList.remove('dropShadow'); // reset animation
			e.style.animationPlayState = 'paused';
			e.style.animationPlayState = 'running';
			void e.offsetWidth; // trigger reflow
			e.classList.add('dropShadow'); // start animation

			// e.classList.remove('dropShadow'); // reset animation
			// e.style.animationPlayState="paused";
			// e.style.animationPlayState="running";
			// setTimeout(() => e.classList.add('dropShadow'), 0); // start animation
		}
	}
}

export { RollAnimator };
