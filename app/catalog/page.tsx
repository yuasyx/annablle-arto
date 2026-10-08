export const revalidate = 0
import { supabase } from '@/lib/supabase'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import CatalogClient from '@/components/store/CatalogClient'
import { resolveParams, applyFilters, loadVisibleLite } from '@/lib/catalogFilters'
import { promoLabel } from '@/lib/promos'

const SECTION_NAMES: Record<string, string> = {
  lingerie: 'Бельё',
  swim: 'Купальники',
  clothes: 'Одежда',
  tights: 'Колготки',
  men: 'Мужчинам',
  kids: 'Детям',
  outlet: 'Outlet',
}

type SP = {
  q?: string
  section?: string       // lingerie | swim | clothes | tights | men | kids
  cat?: string           // slug категории (например, 'bra', 'panties')
  category?: string      // legacy — старое название параметра, поддерживаем для обратной совместимости
  col?: string           // название коллекции (FATALE, Cotton...)
  new?: string
  featured?: string
  sale?: string
  promo?: string
}

export default async function CatalogPage({ searchParams }: { searchParams: SP }) {
  // Поддерживаем оба параметра (cat и category) для совместимости
  const catSlug = searchParams.cat || searchParams.category

  const { data: categories } = await supabase.from('categories').select('*').order('name')

  const resolved = resolveParams(searchParams, (categories || []) as any)

  // Определяем раздел: либо из URL (?section=, в т.ч. ?cat=swim), либо по выбранной категории
  let effectiveSection = resolved.section
  if (!effectiveSection && resolved.catId) {
    const cat = (categories || []).find(c => c.id === resolved.catId)
    if (cat && (cat as any).section) effectiveSection = (cat as any).section
  }

  let query = supabase
    .from('products')
    .select('*, categories(*), product_variants(*)')
    .eq('in_stock', true)
    .eq('is_hidden', false)
    .not('images', 'is', null)
    .not('images', 'eq', '{}')
    .order('name', { ascending: true }) as any

  if (searchParams.q) query = query.ilike('name', '%' + searchParams.q + '%')

  // Раздел, категория, новинки, акции, коллекция, промо (1+1=3 и т.п.)
  query = applyFilters(query, resolved)

  const { data: products } = await query

  // В списке категорий слева показываем только те, где есть товары
  const visible = await loadVisibleLite(supabase)
  const nonEmptyCatIds = new Set(visible.map(p => p.category_id))
  const shownCategories = (categories || []).filter(c => nonEmptyCatIds.has(c.id))

  // Карта "название цвета → hex" из product_colors (для правильных кружков в фильтре)
  const { data: colorRows } = await supabase
    .from('product_colors')
    .select('name, hex')
  const colorHexMap: Record<string, string> = {}
  for (const row of colorRows || []) {
    if (row.name && row.hex) colorHexMap[row.name.trim()] = row.hex
  }

  // Заголовок страницы
  let title = 'Каталог'
  let subtitle = 'все модели'
  if (resolved.promo) {
    title = promoLabel(resolved.promo)
    subtitle = 'акция'
  } else if (resolved.col) {
    title = resolved.col
    subtitle = 'коллекция'
  } else if (resolved.catId) {
    const cat = categories?.find(c => c.id === resolved.catId)
    if (cat) { title = cat.name; subtitle = 'все модели' }
  } else if (resolved.section && SECTION_NAMES[resolved.section]) {
    title = SECTION_NAMES[resolved.section]
    subtitle = 'все модели'
  } else if (searchParams.sale === 'true') {
    title = 'Outlet'
    subtitle = 'товары со скидкой'
  } else if (searchParams.new === 'true') {
    title = 'Новинки'
    subtitle = 'свежее в каталоге'
  }

  return (
    <main>
      <Header />
      <CatalogClient
        products={products || []}
        categories={shownCategories}
        activeCategory={resolved.catId ? catSlug : undefined}
        section={effectiveSection}
        collection={searchParams.col}
        title={title}
        subtitle={subtitle}
        isNew={searchParams.new === 'true'}
        isFeatured={searchParams.featured === 'true'}
        colorHexMap={colorHexMap}
      />
      <Footer />
    </main>
  )
}
