// Единые правила фильтрации каталога.
// Используются и страницей /catalog (запрос в Supabase), и проверкой «есть ли товары»
// для меню, футера и плиток на главной — чтобы пустые разделы не показывались.

export const SECTION_KEYS = ['lingerie', 'swim', 'clothes', 'tights', 'men', 'kids', 'outlet']

export type CatalogParams = {
  q?: string
  section?: string
  cat?: string
  category?: string // старое название параметра
  col?: string
  new?: string
  featured?: string
  sale?: string
  promo?: string
}

export type CategoryLite = { id: string; slug: string; section?: string | null }

// Минимум полей товара, нужный для проверки фильтров
export type ProductLite = {
  category_id: string | null
  is_new?: boolean | null
  is_featured?: boolean | null
  price_old?: number | null
  collection?: string | null
  promos?: string[] | null
}

export const PRODUCT_LITE_FIELDS = 'category_id, is_new, is_featured, price_old, collection'

/**
 * Превращает параметры URL в набор условий.
 * cat=swim / cat=clothes и т.п. в меню на самом деле означает раздел — трактуем как section.
 * Неизвестный cat даёт пустой результат (раньше показывался весь магазин).
 */
export function resolveParams(sp: CatalogParams, categories: CategoryLite[]) {
  let section = sp.section
  let catId: string | null | undefined // undefined — фильтра нет, null — категория не найдена
  const catSlug = sp.cat || sp.category
  if (catSlug) {
    const c = categories.find(x => x.slug === catSlug)
    if (c) catId = c.id
    else if (SECTION_KEYS.includes(catSlug) && !section) section = catSlug
    else catId = null
  }
  let sectionCatIds: string[] | undefined
  if (section) sectionCatIds = categories.filter(c => c.section === section).map(c => c.id)
  return {
    section,
    catId,
    sectionCatIds,
    isNew: sp.new === 'true',
    featured: sp.featured === 'true',
    sale: sp.sale === 'true',
    col: sp.col ? safeDecode(sp.col) : undefined,
    promo: sp.promo || undefined,
  }
}

export type Resolved = ReturnType<typeof resolveParams>

/** Применяет условия к запросу Supabase (страница каталога). */
export function applyFilters(query: any, r: Resolved) {
  if (r.sectionCatIds) query = query.in('category_id', r.sectionCatIds.length ? r.sectionCatIds : [NONE])
  if (r.catId !== undefined) query = query.eq('category_id', r.catId ?? NONE)
  if (r.isNew) query = query.eq('is_new', true)
  if (r.featured) query = query.eq('is_featured', true)
  if (r.sale) query = query.not('price_old', 'is', null)
  if (r.col) query = query.eq('collection', r.col)
  if (r.promo) query = query.contains('promos', [r.promo])
  return query
}

/** Та же логика в памяти — для проверки, что по ссылке есть хоть один товар. */
export function matches(p: ProductLite, r: Resolved): boolean {
  if (r.sectionCatIds && !r.sectionCatIds.includes(p.category_id || '')) return false
  if (r.catId !== undefined && p.category_id !== r.catId) return false
  if (r.isNew && !p.is_new) return false
  if (r.featured && !p.is_featured) return false
  if (r.sale && p.price_old == null) return false
  if (r.col && p.collection !== r.col) return false
  if (r.promo && !(p.promos || []).includes(r.promo)) return false
  return true
}

/** Есть ли товары по ссылке вида /catalog?... Ссылки не на каталог считаем непустыми. */
export function hrefHasProducts(href: string, products: ProductLite[], categories: CategoryLite[]): boolean {
  const [path, qs = ''] = href.split('?')
  if (path !== '/catalog') return true
  const sp: CatalogParams = Object.fromEntries(new URLSearchParams(qs))
  const r = resolveParams(sp, categories)
  return products.some(p => matches(p, r))
}

// Несуществующий id — чтобы фильтр гарантированно ничего не находил
const NONE = '00000000-0000-0000-0000-000000000000'

function safeDecode(s: string) {
  try { return decodeURIComponent(s) } catch { return s }
}

/**
 * Загружает «витринные» товары (в наличии, не скрыты, с фото) в облегчённом виде.
 * Если колонки promos ещё нет в базе — грузит без неё.
 */
export async function loadVisibleLite(sb: any): Promise<ProductLite[]> {
  const base = (fields: string) => sb
    .from('products')
    .select(fields)
    .eq('in_stock', true)
    .eq('is_hidden', false)
    .not('images', 'is', null)
    .not('images', 'eq', '{}')
    .range(0, 4999)
  let { data, error } = await base(PRODUCT_LITE_FIELDS + ', promos')
  if (error) ({ data } = await base(PRODUCT_LITE_FIELDS))
  return (data || []) as ProductLite[]
}
