export const revalidate = 0
import { supabase } from '@/lib/supabase'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import HomeClient from '@/components/store/HomeClient'

const SELECT = '*, categories(*), product_variants(*)'

export default async function HomePage() {
  // Избранное (is_featured). Если таких нет — показываем свежие товары, чтобы блок не пустовал.
  let { data: featured } = await supabase
    .from('products')
    .select(SELECT)
    .eq('in_stock', true)
    .eq('is_featured', true).eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(8)

  if (!featured || featured.length === 0) {
    const res = await supabase
      .from('products')
      .select(SELECT)
      .eq('in_stock', true)
      .eq('is_hidden', false)
      .not('images', 'is', null)
      .not('images', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(8)
    featured = res.data || []
  }

  // Новинки (is_new)
  const { data: newProducts } = await supabase
    .from('products')
    .select(SELECT)
    .eq('in_stock', true)
    .eq('is_new', true).eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(8)

  // Фото для плиток категорий. Каждой плитке на главной соответствует набор реальных
  // категорий из БД. Берём случайный товар с фото из этих категорий (меняется при загрузке).
  const CAT_TILE_GROUPS: Record<string, string[]> = {
    'lingerie-all': ['classic-lingerie', 'fashion-lingerie', 'seamless'], // Бельё
    'pajamas': ['pajamas'],                                                // Пижамы
    'bodysuit': ['bodysuit'],                                              // Боди
    'robes': ['robes'],                                                    // Халаты
    'panties-all': ['panties', 'panties-cotton'],                         // Трусики
  }
  const { data: pool } = await supabase
    .from('products')
    .select('images, categories(slug)')
    .eq('in_stock', true)
    .eq('is_hidden', false)
    .not('images', 'is', null)
    .range(0, 4999)

  const withPhoto = (pool || []).filter(
    (p: any) => Array.isArray(p.images) && p.images.length > 0 && p.images[0]
  )
  const pick = (arr: any[]) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : null)

  const catImages: Record<string, string> = {}
  // Плитки категорий без товаров не показываем (null — база не ответила, показываем все)
  let visibleTiles: string[] | null = withPhoto.length ? [] : null
  for (const [tile, slugs] of Object.entries(CAT_TILE_GROUPS)) {
    const matches = withPhoto.filter((p: any) => slugs.includes((p.categories as any)?.slug))
    const chosen = pick(matches)
    if (chosen) {
      catImages[tile] = chosen.images[0]
      visibleTiles?.push(tile)
    }
  }

  return (
    <main>
      <Header />
      <HomeClient featured={featured || []} newProducts={newProducts || []} catImages={catImages} visibleTiles={visibleTiles} />
      <Footer />
    </main>
  )
}
