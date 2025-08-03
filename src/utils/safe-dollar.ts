export const safeDollar = (amount: number): number => {
  return Math.round(amount) / 100;
}