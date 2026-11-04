/**
 * Pro rejim narxlari (rolga qarab)
 * - Bloger: 59 000 so'm / oy
 * - Brend:  99 000 so'm / oy
 */
export const PRO_PRICE_BLOGER = 59000;
export const PRO_PRICE_BRAND = 99000;

export function getProPrice(role?: string | null): number {
  return role === 'brend' ? PRO_PRICE_BRAND : PRO_PRICE_BLOGER;
}

/** 99000 -> "99 000" */
export function formatSom(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Rol bo'yicha tayyor matn: "99 000 soʻm" */
export function proPriceLabel(role?: string | null): string {
  return `${formatSom(getProPrice(role))} soʻm`;
}
