'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/supabase'
import { formatPrice, optimizeImage} from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { useT } from '@/lib/i18n/client'
import ProductGrid from './ProductGrid'
import CartDrawer from './CartDrawer'
import SizeGuideModal from './SizeGuideModal'

// Категории, не подлежащие возврату по ст. 30 Закона РК «О защите прав потребителей»
function isNonReturnable(p: Product): boolean {
  const cat = (p.categories as any) || {}
  const hay = `${cat.name || ''} ${cat.slug || ''}`.toLowerCase()
  return ['бель', 'lingerie', 'колгот', 'чулк', 'чулоч', 'носк', 'термо', 'tights', 'hosiery', 'sock'].some(k => hay.includes(k))
}
import ProductDescription from './ProductDescription'

const CARD_BG = ['linear-gradient(165deg,#f3c8be,#d99c8e)','linear-gradient(165deg,#ead0c4,#d4a094)','linear-gradient(165deg,#f5d8d0,#d8a89c)','linear-gradient(165deg,#e8c4b6,#c8907e)']

const LETTER_SIZES = ['XS','S','M','L','XL','2XL','3XL']
const NUMERIC_SIZES = ['38','40','42','44','46','48','50','52','54','56','58','60','62','64']
function normalizeSize(raw: string): string | null {
  if (!raw) return null
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '')
  if (LETTER_SIZES.includes(s)) return s
  if (/^\d{2}$/.test(s) && NUMERIC_SIZES.includes(s)) return s
  if (/^\d{2,3}[A-HА-З]$/.test(s)) return s
  if (/^\d{2,3}\/\d{2}[A-HА-З]$/.test(s)) return s
  return null
}
function sizeGroup(s: string): number {
  if (LETTER_SIZES.includes(s)) return 0
  if (/^\d{2}$/.test(s)) return 1
  if (/^\d{2,3}(\/\d{2})?[A-HА-З]$/.test(s)) return 2
  return 3
}
function sortSizes(arr: string[]): string[] {
  const braParts = (x: string): [number, number] => {
    const m = x.match(/^(\d{2,3})(?:\/\d{2})?([A-HА-З])$/)
    return m ? [parseInt(m[1], 10), m[2].charCodeAt(0)] : [999, 999]
  }
  return [...new Set(arr)].sort((a, b) => {
    const ga = sizeGroup(a), gb = sizeGroup(b)
    if (ga !== gb) return ga - gb
    if (ga === 0) return LETTER_SIZES.indexOf(a) - LETTER_SIZES.indexOf(b)
    if (ga === 1) return parseInt(a, 10) - parseInt(b, 10)
    if (ga === 2) {
      const [ba, ca] = braParts(a), [bb, cb] = braParts(b)
      return ba !== bb ? ba - bb : ca - cb
    }
    return a.localeCompare(b, 'ru')
  })
}

function cleanColorName(raw: string): string {
  return raw.replace(/^\s*\d+(\/\d+)?\s*/, '').replace(/\s{2,}/g, ' ').trim() || raw.trim()
}

type ColorRow = {
  id: string
  product_id: string
  name: string
  hex: string
  images: string[]
  sort_order: number
}

export default function ProductDetail({ product: p, colors, related, collectionProducts = [] }: {
  product: Product; colors: ColorRow[]; related: Product[]; collectionProducts?: Product[]
}) {
  const { addItem } = useCart()
  const t = useT()
  const [size, setSize] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [zoom, setZoom] = useState<{ x: number; y: number; on: boolean }>({ x: 50, y: 50, on: false })

  // Активный цвет: первый из списка (или null если цветов нет — старый товар)
  const [activeColorIdx, setActiveColorIdx] = useState(0)
  const activeColor = colors[activeColorIdx] || null

  // Размеры — отфильтрованные по выбранному цвету (если есть variants с color), очищенные от мусора и отсортированные
  const sizes = useMemo(() => {
    if (!p.product_variants) return []
    const source = activeColor
      ? p.product_variants.filter((v: any) => v.color === activeColor.name)
      : p.product_variants
    const clean = source
      .map((v: any) => normalizeSize(v.size))
      .filter((s: string | null): s is string => !!s)
    return sortSizes(clean)
  }, [p.product_variants, activeColor])

  // Фото — для активного цвета (или общие images товара если цветов нет)
  const images = useMemo(() => {
    if (activeColor && activeColor.images && activeColor.images.length > 0) {
      return activeColor.images
    }
    return p.images && p.images.length > 0 ? p.images : []
  }, [activeColor, p.images])

  // При смене цвета — сбрасываем выбранное фото и размер
  function pickColor(idx: number) {
    setActiveColorIdx(idx)
    setActiveImg(0)
    setSize('')
  }

  function handleAdd() {
    if (sizes.length > 0 && !size) { setError(t('Выберите размер')); return }
    setError('')
    addItem(p, size || 'M', activeColor?.name || null)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    setCartOpen(true)
  }

  return (
    <>
      <div className="catalog-head">
        <div className="crumbs">
          <Link href="/">{t('Главная')}</Link> / <Link href="/catalog">{t('Каталог')}</Link>
          {p.categories && <> / <Link href={`/catalog?cat=${(p.categories as any).slug}`}>{t((p.categories as any).name)}</Link></>}
          {' '} / {p.name}
        </div>
      </div>

      <div className="pdp">
        {/* Галерея */}
        <div className="pdp-gallery">
          <div className="thumbs">
            {(images.length > 0 ? images : [null, null, null, null]).slice(0,4).map((img, i) => (
              <div key={i} className={`thumb ${activeImg === i ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
                style={{background: CARD_BG[i % CARD_BG.length], position:'relative', overflow:'hidden'}}>
                {img ? (
                  <Image src={optimizeImage(img, {width:250, quality:85})} alt={`${p.name} ${i+1}`} fill sizes="90px"
                    style={{objectFit:'cover'}} />
                ) : (
                  <div className="ph" style={{borderRadius:8}}></div>
                )}
              </div>
            ))}
          </div>
          <div
            className="pdp-main"
            style={{background: images[activeImg] ? '#ffffff' : CARD_BG[activeImg % CARD_BG.length], position:'relative', overflow:'hidden', cursor: images[activeImg] ? 'zoom-in' : 'default'}}
            onMouseEnter={() => images[activeImg] && setZoom(z => ({ ...z, on: true }))}
            onMouseLeave={() => setZoom(z => ({ ...z, on: false }))}
            onMouseMove={e => {
              if (!images[activeImg]) return
              const r = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - r.left) / r.width) * 100
              const y = ((e.clientY - r.top) / r.height) * 100
              setZoom({ x, y, on: true })
            }}
          >
            {images[activeImg] ? (
              <Image src={optimizeImage(images[activeImg], {width:1600, quality:90})} alt={p.name} fill priority
                sizes="(max-width:900px) 100vw, 640px"
                quality={85}
                style={{
                  objectFit:'cover',
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  transform: zoom.on ? 'scale(2)' : 'scale(1)',
                  transition: zoom.on ? 'transform .1s ease-out' : 'transform .3s ease-out',
                }} />
            ) : (
              <div className="ph"><div className="ph-label">[ {p.name} · вид {activeImg+1}/{Math.max(images.length,1)} ]</div></div>
            )}
            {p.is_new && <span className="card-tag" style={{top:16,left:16,zIndex:2}}>{t('Новинка')}</span>}
          </div>
        </div>

        {/* Инфо */}
        <div className="pdp-info">
          <div className="pdp-cat">{t((p.categories as any)?.name || '')} ✿ {p.name}</div>
          <h1>{p.name}</h1>
          <div className="pdp-price">
            {p.price_old && <s>{formatPrice(p.price_old)}</s>}
            <span>{formatPrice(p.price)}</span>
            {p.price_old && <span className="save">−{Math.round((1-p.price/p.price_old)*100)}%</span>}
          </div>

          {p.description && (
            <ProductDescription text={p.description} />
          )}

          {/* Цвета */}
          {colors.length > 0 && (
            <div className="pdp-row">
              <div className="head">
                <span>{t('Цвет: {c}', { c: activeColor ? cleanColorName(activeColor.name) : '—' })}</span>
              </div>
              <div className="color-row">
                {colors.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => pickColor(i)}
                    className={`color-swatch ${i === activeColorIdx ? 'on' : ''}`}
                    style={{ background: c.hex }}
                    title={cleanColorName(c.name)}
                    aria-label={`Выбрать цвет ${cleanColorName(c.name)}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Размеры */}
          {sizes.length > 0 && (
            <div className="pdp-row">
              <div className="head">
                <span>{t('Размер: {s}', { s: size || '—' })}</span>
                <button onClick={() => setSizeGuideOpen(true)} style={{textTransform:'none',letterSpacing:0,opacity:0.7,textDecoration:'underline',fontFamily:'Inter Tight,sans-serif',fontSize:12,background:'none',border:'none',color:'inherit',cursor:'pointer',padding:0}}>
                  {t('Таблица размеров')}
                </button>
              </div>
              <div className="size-row" style={sizes.length > 8 ? {display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(52px, 1fr))',gap:8} : undefined}>
                {sizes.map(s => (
                  <button key={s} className={`size-btn ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
              {error && <p style={{color:'#c0392b',fontSize:12,marginTop:8}}>{error}</p>}
            </div>
          )}

          {/* CTA */}
          <div className="pdp-cta">
            <button onClick={handleAdd} style={{padding:'18px 28px',borderRadius:999,background:'var(--ink)',color:'var(--cream)',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:14,letterSpacing:'0.04em',transition:'all .3s',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
              {added ? t('✓ Добавлено!') : t('В корзину · {p}', { p: formatPrice(p.price) })}
            </button>
            <button onClick={() => setCartOpen(true)} style={{width:56,height:56,borderRadius:999,border:'1px solid var(--ink)',background:'transparent',cursor:'pointer',display:'grid',placeItems:'center'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
            </button>
          </div>

          {/* Фичи */}
          <div className="pdp-features">
            {[
              [<svg key="t" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 19c5-13 14-15 16-15 0 7-3 18-15 16M5 19l8-8"/></svg>, 'Материал', '78% полиамид · 22% эластан'],
              [<svg key="c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg>, 'Уход', 'Стирка 30°C · без отбеливания'],
              [<svg key="d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h12v10H3zM15 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>, 'Доставка', 'Казахстан, Кыргызстан, Узбекистан'],
              isNonReturnable(p)
                ? [<svg key="r" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"/></svg>, 'Гарантия качества', 'обмен при производственном браке']
                : [<svg key="r" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"/></svg>, 'Возврат', '14 рабочих дней'],
            ].map(([icon, title, sub], i) => (
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:22,height:22,color:'var(--rose-deep)',flexShrink:0,marginTop:2}}>{icon}</div>
                <div><h6 style={{fontSize:13,fontWeight:500,marginBottom:2}}>{t(title as string)}</h6><p style={{fontSize:12,color:'var(--ink-soft)'}}>{t(sub as string)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Из этой коллекции */}
      {collectionProducts.length > 0 && (
        <section>
          <div className="section-head">
            <div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',opacity:0.55,marginBottom:8}}>
                {t('Коллекция {c}', { c: (p as any).collection })}
              </div>
              <h2>{t('Из этой')} <em>{t('коллекции')}</em></h2>
            </div>
            <Link href={`/catalog?col=${encodeURIComponent((p as any).collection)}`}
              style={{fontSize:12,color:'var(--rose-deep)',textDecoration:'underline',fontFamily:'Inter Tight,sans-serif',display:'inline-flex',alignItems:'center',gap:6}}>
              {t('Вся коллекция')}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          </div>
          <ProductGrid products={collectionProducts} />
        </section>
      )}

      {/* Похожие — показываем только если нет коллекции (иначе дублирование) */}
      {collectionProducts.length === 0 && related.length > 0 && (
        <section>
          <div className="section-head">
            <h2>{t('Похожие')} <em>{t('товары')}</em></h2>
          </div>
          <ProductGrid products={related} />
        </section>
      )}

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      {sizeGuideOpen && <SizeGuideModal section={(p.categories as any)?.section || null} onClose={() => setSizeGuideOpen(false)} />}
    </>
  )
}
