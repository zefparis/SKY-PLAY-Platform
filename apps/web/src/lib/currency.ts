export const formatSKY = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(Math.abs(amount)) + ' SKY';
};

export const formatCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(Math.abs(amount)) + ' CFA';
};

export const formatCurrency = (amount: number, showCFA = false): string => {
  return showCFA ? formatCFA(amount) : formatSKY(amount);
};

export const SKY_ICON = '🪙';
export const SKY_SYMBOL = 'SKY';

export const computeNetPot = (pot: number, commission: number): number => {
  return pot - Math.floor(pot * commission);
};

export const computePrizes = (netPot: number) => ({
  first: Math.floor(netPot * 0.5),
  second: Math.floor(netPot * 0.25),
  third: Math.floor(netPot * 0.15),
});
