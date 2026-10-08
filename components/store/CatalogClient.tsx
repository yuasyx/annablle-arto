'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product, Category } from '@/lib/supabase'
import { formatPrice, optimizeImage} from '@/lib/utils'
import { useCart } from '@/lib/cart'
import QuickView from './QuickView'
import CartDrawer from './CartDrawer'
import { useLang, useT } from '@/lib/i18n/client'

const SIZES = ['XS','S','M','L','XL','2XL','3XL']
const NUMERIC_SIZES = ['38','40','42','44','46','48','50','52','54','56','58','60','62','64']

// Распознаёт настоящий размер, отсекая артикулы/мусор (напр. "S-6219-8 к")
// Поддержка: буквенные (S,M,L), числовые (42,44), бра-размеры (70B, 95/52G)
function normalizeSize(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (SIZES.includes(s)) return s
  if (/^\d{2}$/.test(s) && NUMERIC_SIZES.includes(s)) return s
  // бра-размеры: 70B, 75C, 80D, 85E, 90F, 95G, 100E и сдвоенные 95/52G
  if (/^\d{2,3}[A-HА-З]$/.test(s)) return s
  if (/^\d{2,3}\/\d{2}[A-HА-З]$/.test(s)) return s
  return null
}

// Определяет тип размера для группировки (как в фильтре АА)
function sizeGroup(s: string): 'letter' | 'numeric' | 'bra' | 'other' {
  if (SIZES.includes(s)) return 'letter'
  if (/^\d{2}$/.test(s)) return 'numeric'
  if (/^\d{2,3}(\/\d{2})?[A-HА-З]$/.test(s)) return 'bra'
  return 'other'
}

// Сортировка размеров: буквенные → числовые → бра-размеры (по обхвату, потом по чашке)
function sortSizes(arr: string[]): string[] {
  const groupRank = { letter: 0, numeric: 1, bra: 2, other: 3 }
  const braParts = (x: string) => {
    const m = x.match(/^(\d{2,3})(?:\/\d{2})?([A-HА-З])$/)
    if (!m) return [999, 999] as [number, number]
    return [parseInt(m[1], 10), m[2].charCodeAt(0)] as [number, number]
  }
  return [...new Set(arr)].sort((a, b) => {
    const ga = sizeGroup(a), gb = sizeGroup(b)
    if (ga !== gb) return groupRank[ga] - groupRank[gb]
    if (ga === 'letter') return SIZES.indexOf(a) - SIZES.indexOf(b)
    if (ga === 'numeric') return parseInt(a, 10) - parseInt(b, 10)
    if (ga === 'bra') {
      const [ba, ca] = braParts(a), [bb, cb] = braParts(b)
      return ba !== bb ? ba - bb : ca - cb
    }
    return a.localeCompare(b, 'ru')
  })
}

// Палитра цветов: сопоставление названия → hex для цветных кружков (как в фильтре АА)
const COLOR_SWATCHES: { match: RegExp; hex: string }[] = [
  { match: /чёрн|черн/i, hex: '#2b2b2b' },
  { match: /бел|молочн/i, hex: '#f5f0eb' },
  { match: /беж|пудр|нюд|телесн/i, hex: '#e3c9b6' },
  { match: /красн|алый|вишн/i, hex: '#c0392b' },
  { match: /розов|пудров/i, hex: '#e8a0b0' },
  { match: /малинов|фукси/i, hex: '#c2185b' },
  { match: /жёлт|желт|горчичн/i, hex: '#e6c84f' },
  { match: /синий|тёмно-син|темно-син|лазурн|васильк/i, hex: '#3b5b92' },
  { match: /голуб|небесн/i, hex: '#8fc1e0' },
  { match: /зелён|зелен|изумруд|мят/i, hex: '#5a9e6f' },
  { match: /фиолет|сирен|лилов|пурпур/i, hex: '#8a5a9e' },
  { match: /серый|сер\b|графит|стальн/i, hex: '#9a9a9a' },
  { match: /коричн|шоколад|кофе|капучин/i, hex: '#7a5240' },
  { match: /оранж|терракот|персик|коралл/i, hex: '#e08a4f' },
  { match: /бордов|марсал|винн/i, hex: '#7a2030' },
  { match: /золот|шампань/i, hex: '#d4af6a' },
]

function colorHex(name: string): string {
  for (const { match, hex } of COLOR_SWATCHES) if (match.test(name)) return hex
  return '#cbb8aa' // нейтральный по умолчанию
}

// Убирает номера/артикулы из названия цвета: "01 черный" → "черный", "06/24 красный голубой" → "красный голубой"
function cleanColorName(raw: string): string {
  return raw
    .replace(/^\s*\d+(\/\d+)?\s*/, '')  // ведущий номер "01 " или "06/24 "
    .replace(/\s{2,}/g, ' ')
    .trim() || raw.trim()
}

// Отсекает мусор из названий цветов (артикулы, описания, слишком длинные строки)
function isValidColor(raw: string): boolean {
  if (!raw) return false
  const c = raw.trim()
  if (c.length < 2 || c.length > 24) return false        // описания/комплекты слишком длинные
  if (/\d{3,}/.test(c)) return false                      // артикулы с длинными числами
  if (/[a-zA-Z]-\d/.test(c)) return false                 // паттерн артикула типа S-6219
  if (/комплект|жакет|брюки|\(|\)/i.test(c)) return false // описания товара
  return true
}

const CARD_BG = ['linear-gradient(165deg,#f3c8be,#d99c8e)','linear-gradient(165deg,#ead0c4,#d4a094)','linear-gradient(165deg,#f5d8d0,#d8a89c)','linear-gradient(165deg,#e8c4b6,#c8907e)','linear-gradient(165deg,#f0c8be,#d8907e)']
const SECTION_NAMES: Record<string, string> = {
  lingerie: 'Бельё', swim: 'Купальники', clothes: 'Одежда',
  tights: 'Колготки', men: 'Мужчинам', kids: 'Детям',
}

export default function CatalogClient({ products, categories, activeCategory, section, collection, title: titleProp, subtitle: subtitleProp, isNew, isFeatured, colorHexMap = {} }: {
  products: Product[]; categories: Category[]; activeCategory?: string;
  section?: string; collection?: string;
  title?: string; subtitle?: string;
  isNew?: boolean; isFeatured?: boolean;
  colorHexMap?: Record<string, string>
}) {
  const { addItem } = useCart()
  const { lang, t } = useLang()
  const [activeSizes, setActiveSizes] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(500000)
  const [sort, setSort] = useState('article')
  const [quickProduct, setQuickProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeColors, setActiveColors] = useState<string[]>([])

  const toggleSize = (s: string) => setActiveSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const toggleColor = (c: string) => setActiveColors(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])

  // Все доступные цвета среди показанных товаров (без мусора/артикулов)
  const availableColors = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      for (const v of p.product_variants || []) {
        if (v.color && isValidColor(v.color)) set.add(v.color.trim())
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [products])

  // Реально доступные размеры среди товаров (только валидные, отсортированы)
  const availableSizes = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      for (const v of p.product_variants || []) {
        const n = normalizeSize(v.size)
        if (n) set.add(n)
      }
    }
    return sortSizes(Array.from(set))
  }, [products])

  const filtered = useMemo(() => {
    let list = [...products]
    if (activeSizes.length > 0) {
      list = list.filter(p => p.product_variants?.some(v => {
        const n = normalizeSize(v.size)
        return n && activeSizes.includes(n)
      }))
    }
    if (activeColors.length > 0) {
      list = list.filter(p => p.product_variants?.some(v => v.color && activeColors.includes(v.color.trim())))
    }
    list = list.filter(p => p.price <= maxPrice)
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'article') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    return list
  }, [products, activeSizes, activeColors, maxPrice, sort])

  const title = t(titleProp || (isNew ? 'Новинки' : isFeatured ? 'Хиты продаж' : activeCategory
    ? categories.find(c => c.slug === activeCategory)?.name || 'Каталог'
    : 'Бельё'))

  const subtitle = '— ' + t(subtitleProp || (isNew ? 'новинки' : isFeatured ? 'хиты' : 'все модели'))
  const models = (n: number) => lang === 'ru' ? `${n} моделей` : t('{n} моделей', { n })

  const allPrices = products.map(p => p.price)
  const priceMax = allPrices.length > 0 ? Math.max(...allPrices) : 500000

  return (
    <>
      {/* Шапка каталога */}
      <div className="catalog-head">
        <div className="crumbs">
          <Link href="/">{t('Главная')}</Link> / {title}
        </div>
        <div className="catalog-title">
          <h1>{title} <em>{subtitle}</em></h1>
          <span className="section-meta">{models(filtered.length)}</span>
        </div>
      </div>

      {/* Тело каталога */}
      <div className="catalog-body">
        {/* Фильтры */}
        <aside>
          <h6>{t('Фильтры')}</h6>

          {collection && (
            <div className="filter-item">
              <div style={{fontSize:10,opacity:0.5,marginBottom:6,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('Коллекция')}</div>
              <div className="filter-link active" style={{cursor:'default'}}>{decodeURIComponent(collection)}</div>
              <Link href={section ? `/catalog?section=${section}` : '/catalog'} style={{fontSize:11,opacity:0.6,padding:'4px 12px',display:'inline-block',color:'var(--ink-soft)'}}>{t('← снять фильтр')}</Link>
            </div>
          )}

          <div className="filter-item">
            <div style={{fontSize:10,opacity:0.5,marginBottom:6,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.12em',textTransform:'uppercase'}}>
              {t(section ? SECTION_NAMES[section] || 'Категория' : 'Категория')}
            </div>
            <Link href={section ? `/catalog?section=${section}` : '/catalog'} className={`filter-link ${!activeCategory && !isNew && !isFeatured && !collection ? 'active' : ''}`}>
              {t(section ? 'Все товары раздела' : 'Все товары')}
            </Link>
            {(section ? categories.filter((c: any) => c.section === section) : categories).map(cat => {
              const href = section ? `/catalog?section=${section}&cat=${cat.slug}` : `/catalog?cat=${cat.slug}`
              return (
                <Link key={cat.id} href={href} className={`filter-link ${activeCategory === cat.slug ? 'active' : ''}`}>
                  {t(cat.name)}
                </Link>
              )
            })}
          </div>

          <div className="filter-item">
            <div style={{fontSize:10,opacity:0.5,marginBottom:10,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('Размер')}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(46px, 1fr))',gap:6}}>
              {availableSizes.map(s => {
                const on = activeSizes.includes(s)
                return (
                  <button key={s} onClick={() => toggleSize(s)} style={{
                    minHeight:38,padding:'8px 4px',borderRadius:8,
                    border:`1px solid ${on ? 'var(--ink)' : 'rgba(58,40,40,0.18)'}`,
                    background: on ? 'var(--ink)' : 'var(--cream)',
                    color: on ? 'var(--cream)' : 'var(--ink)',
                    fontFamily:'inherit',fontSize:12,fontWeight:on?600:400,cursor:'pointer',
                    transition:'all .15s',textAlign:'center',whiteSpace:'nowrap',
                  }}>{s}</button>
                )
              })}
            </div>
          </div>

          <div className="filter-item">
            <div style={{fontSize:10,opacity:0.5,marginBottom:8,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('Цена')}</div>
            <input type="range" min={0} max={priceMax} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}
              style={{width:'100%',accentColor:'var(--ink)',marginBottom:8}} />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,opacity:0.7}}>
              <span>0 ₸</span><span>{formatPrice(maxPrice)}</span>
            </div>
          </div>

          {availableColors.length > 0 && (
            <div className="filter-item">
              <div style={{fontSize:10,opacity:0.5,marginBottom:10,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('Цвет')}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 12px'}}>
                {availableColors.map(c => {
                  const on = activeColors.includes(c)
                  const dot = colorHexMap[c] || colorHexMap[c.trim()] || colorHex(c)
                  return (
                    <label key={c} onClick={() => toggleColor(c)} style={{
                      display:'flex',alignItems:'center',gap:8,cursor:'pointer',
                      fontSize:13,color:'var(--ink)',userSelect:'none',
                    }}>
                      <span style={{
                        width:16,height:16,borderRadius:4,flexShrink:0,
                        border:`1.5px solid ${on ? 'var(--ink)' : 'rgba(58,40,40,0.25)'}`,
                        background: on ? 'var(--ink)' : 'transparent',
                        display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',
                      }}>
                        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>}
                      </span>
                      <span style={{
                        width:16,height:16,borderRadius:'50%',flexShrink:0,
                        background: dot,
                        border:'1px solid rgba(58,40,40,0.15)',
                      }} />
                      <span style={{lineHeight:1.2,opacity:on?1:0.85}}>{cleanColorName(c)}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="filter-item">
            <Link href={section ? `/catalog?section=${section}&new=true` : '/catalog?new=true'} className={`filter-link ${isNew ? 'active' : ''}`} style={{color: isNew ? undefined : 'var(--rose-deep)'}}>{t('✿ Новинки')}</Link>
            <Link href={section ? `/catalog?section=${section}&featured=true` : '/catalog?featured=true'} className={`filter-link ${isFeatured ? 'active' : ''}`} style={{color: isFeatured ? undefined : 'var(--rose-deep)'}}>{t('✿ Хиты продаж')}</Link>
            <Link href="/catalog?sale=true" className="filter-link" style={{color:'var(--rose-deep)'}}>✿ Outlet</Link>
          </div>
        </aside>

        {/* Товары */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.6}}>
              {lang === 'ru' ? `${filtered.length} моделей ✿ обновлено сегодня` : t('{n} моделей ✿ обновлено сегодня', { n: filtered.length })}
            </span>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              background:'transparent',border:'1px solid rgba(58,40,40,0.2)',padding:'8px 14px',
              borderRadius:999,fontFamily:'inherit',fontSize:13,cursor:'pointer',outline:'none',
            }}>
              <option value="article">{t('Сортировка: по артикулу')}</option>
              <option value="new">{t('Сначала новинки')}</option>
              <option value="price_asc">{t('Сначала дешевле')}</option>
              <option value="price_desc">{t('Сначала дороже')}</option>
            </select>
          </div>

          <div className="product-grid">
            {filtered.map((p, i) => (
              <CatalogCard key={p.id} product={p} idx={i} onQuick={() => setQuickProduct(p)} onCartOpen={() => setCartOpen(true)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{textAlign:'center',padding:'80px 0',color:'var(--ink-soft)'}}>
              <div style={{fontSize:40,opacity:0.3,marginBottom:12}}>✿</div>
              <p style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontStyle:'italic'}}>{t('Ничего не найдено')}</p>
              <p style={{fontSize:13,marginTop:8,opacity:0.6}}>{t('Попробуйте изменить фильтры')}</p>
            </div>
          )}
        </div>
      </div>

      {quickProduct && <QuickView product={quickProduct} onClose={() => setQuickProduct(null)} onCartOpen={() => setCartOpen(true)} />}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  )
}

function CatalogCard({ product, idx, onQuick, onCartOpen }: { product: Product; idx: number; onQuick: () => void; onCartOpen: () => void }) {
  const { addItem } = useCart()
  const t = useT()
  const gi = idx % 5

  return (
    <div className="card" style={{cursor:'pointer'}}>
      <div className="card-img" style={{background: (product.images && product.images.length>0)?'#ffffff':CARD_BG[gi]}} onClick={() => window.location.href = `/product/${product.slug}`}>
        {product.images && product.images.length > 0 ? (
          <>
            <Image src={optimizeImage(product.images[0], {width:800, quality:90})} alt={product.name} fill
              sizes="(max-width:640px) 50vw, (max-width:900px) 33vw, 25vw"
              style={{objectFit:'cover'}} />
            {product.images[1] && (
              <Image src={optimizeImage(product.images[1], {width:800, quality:90})} alt={product.name} fill className="card-img-hover"
                sizes="(max-width:640px) 50vw, (max-width:900px) 33vw, 25vw"
                style={{objectFit:'cover',opacity:0,transition:'opacity .5s'}} />
            )}
          </>
        ) : (
          <>
            <div className="ph"><div className="ph-label">[ {product.name} ]</div></div>
            <div className="card-img-hover" style={{background:'linear-gradient(135deg,#d4a094,#b8786a)'}} />
          </>
        )}
        {product.is_new && <span className="card-tag">{t('Новинка')}</span>}
        {product.price_old && !product.is_new && (
          <span className="card-tag">−{Math.round((1 - product.price / product.price_old) * 100)}%</span>
        )}
        <div className="card-quick">
          <button className="card-quick-btn" onClick={e => { e.stopPropagation(); onQuick() }}>{t('Быстрый просмотр')}</button>
        </div>
      </div>
      <div className="card-info">
        <div>
          <Link href={`/product/${product.slug}`} style={{textDecoration:'none',color:'inherit'}}>
            <h4 style={{cursor:'pointer'}}>{product.name}</h4>
          </Link>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',opacity:0.6,marginTop:2}}>
            {t((product.categories as any)?.name || '')}
          </div>
        </div>
        <div className="card-price">
          {product.price_old && <s>{formatPrice(product.price_old)}</s>}
          {formatPrice(product.price)}
        </div>
      </div>
      {product.product_variants && product.product_variants.length > 0 && (() => {
        const cardSizes = sortSizes(
          product.product_variants
            .map(v => normalizeSize(v.size))
            .filter((s): s is string => !!s)
        ).slice(0, 6)
        if (cardSizes.length === 0) return null
        return (
          <div className="card-sizes">
            {cardSizes.map(s => (
              <span key={s} className="size-chip">{s}</span>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
