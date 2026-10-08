// Акции, которые отмечаются галочками у товара в админке (колонка products.promos).
// Ключ совпадает с ?promo=<key> в ссылках меню (menuData.ts).
export const PROMOS: { key: string; label: string }[] = [
  { key: 'bra-3', label: '1+1=3 на бюсты' },
  { key: 'panties-3', label: '1+1=3 на трусы' },
  { key: 'swim-50', label: 'Купальники −50%' },
  { key: 'homewear', label: 'Homewear sale' },
  { key: 'men-homewear', label: 'Homewear sale (мужское)' },
]

export const promoLabel = (key: string) => PROMOS.find(p => p.key === key)?.label || key
