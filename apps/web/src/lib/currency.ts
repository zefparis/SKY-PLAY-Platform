export const formatCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';
};

export const computeNetPot = (pot: number, commission: number): number => {
  return pot - Math.floor(pot * commission);
};

export const computePrizes = (netPot: number) => ({
  first: Math.floor(netPot * 0.5),
  second: Math.floor(netPot * 0.25),
  third: Math.floor(netPot * 0.15),
});
