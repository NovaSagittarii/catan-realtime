const Cards = {
	knight: 14,
	point: 5,
	monopoly: 2,
	resources: 2,
	road: 2,
};

const CardName = Object.keys(Cards);
const CardType = {};
CardName.forEach((x, i) => (CardType[x.toUpperCase()] = i));
const CardCount = CardName.length;
const InitialCard = Object.values(Cards);

export { CardName, CardType, CardCount, InitialCard };
