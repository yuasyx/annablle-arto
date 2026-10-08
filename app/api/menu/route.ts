import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MENU } from '@/components/store/menuData'
import { hrefHasProducts, loadVisibleLite } from '@/lib/catalogFilters'

// Какие ссылки меню/футера/главной сейчас не пустые. Пересчитывается раз в минуту,
// поэтому новая категория появляется на сайте сама, как только в ней есть товар с фото.
export const revalidate = 60

// Ссылки вне меню, которые тоже прячем, если они пустые
const EXTRA_HREFS = [
  '/catalog?section=lingerie',
  '/catalog?cat=pajamas',
  '/catalog?cat=bodysuit',
  '/catalog?cat=robes',
  '/catalog?cat=panties',
  '/catalog?new=true',
]

export async function GET() {
  const [{ data: categories, error }, products] = await Promise.all([
    supabase.from('categories').select('id, slug, section'),
    loadVisibleLite(supabase),
  ])
  // База не ответила — ничего не прячем (null = показывать всё)
  if (error || !categories || products.length === 0) return NextResponse.json({ available: null })

  const hrefs = new Set<string>(EXTRA_HREFS)
  for (const item of MENU) {
    if (item.href) hrefs.add(item.href)
    for (const col of item.columns || []) for (const l of col.items) hrefs.add(l.href)
    if (item.banner?.href) hrefs.add(item.banner.href)
  }

  const available = Array.from(hrefs).filter(h => hrefHasProducts(h, products, categories))
  return NextResponse.json({ available })
}
