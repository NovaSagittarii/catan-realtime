// brick, lumber, wool, grain, ore

const Cards = {
	knight: 14,
	point: 5,
	monopoly: 2,
	resources: 2,
	road: 2,
};

const CardName = Object.keys(Cards);
const CardType = {
	PURCHASE_CARD: -1,
};
CardName.forEach((x, i) => (CardType[x.toUpperCase()] = i));
const CardCount = CardName.length;
const InitialCard = Object.values(Cards);
const CardCost = [0, 0, 1, 1, 1]; // NOTE: Game.configuartion is used!!

export { CardName, CardType, CardCount, InitialCard, CardCost };
