export const formatCurrency = (amount: number) =>
  `NRs ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

export const formatCompactCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `NRs ${new Intl.NumberFormat("en-US", { 
      notation: "compact", 
      compactDisplay: "short", 
      maximumFractionDigits: 1 
    }).format(amount)}`;
  }
  return formatCurrency(amount);
};
