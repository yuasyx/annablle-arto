'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/supabase'
import { formatPrice, optimizeImage} from '@/lib/utils'
import { useCart } from '@/lib/cart'
import QuickView from './QuickView'
import CartDrawer from './CartDrawer'
import { useT, useLang } from '@/lib/i18n/client'

const CARD_BG = [
  'linear-gradient(165deg,#f3c8be,#d99c8e)',
  'linear-gradient(165deg,#ead0c4,#d4a094)',
  'linear-gradient(165deg,#f5d8d0,#d8a89c)',
  'linear-gradient(165deg,#e8c4b6,#c8907e)',
  'linear-gradient(165deg,#f0c8be,#d8907e)',
]

const CATS = [
  { name: 'Бельё', sub: 'комплекты', key: 'lingerie-all', href: '/catalog?section=lingerie', bg: 'linear-gradient(165deg,#f3c8be 0%,#d99c8e 100%)' },
  { name: 'Пижамы', sub: 'домашняя', key: 'pajamas', href: '/catalog?cat=pajamas', bg: 'linear-gradient(165deg,#e8b4a6 0%,#c98e88 100%)', italic: true },
  { name: 'Боди', sub: 'корсеты', key: 'bodysuit', href: '/catalog?cat=bodysuit', bg: 'linear-gradient(165deg,#f5d4ca 0%,#e8b4a6 100%)' },
  { name: 'Халаты', sub: 'уют', key: 'robes', href: '/catalog?cat=robes', bg: 'linear-gradient(165deg,#ead0c4 0%,#d4a094 100%)', italic: true },
  { name: 'Трусики', sub: 'базовые', key: 'panties-all', href: '/catalog?cat=panties', bg: 'linear-gradient(165deg,#d9a594 0%,#b8786a 100%)' },
]

const PROMISE = [
  { icon: '🚚', title: 'Бесплатная доставка', sub: 'по Казахстану от 15 000 ₸' },
  { icon: '↩️', title: 'Лёгкий обмен', sub: '14 рабочих дней' },
  { icon: '💳', title: 'Оплата картой', sub: 'Visa · Mastercard' },
  { icon: '✦', title: 'Размеры XS–3XL', sub: 'для всех' },
]

function ArrowUR() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17 17 7M9 7h8v8"/></svg>
}

function ProductCard({ p, idx, onQuick }: { p: Product; idx: number; onQuick: () => void }) {
  const t = useT()
  const { addItem } = useCart()
  const [hovered, setHovered] = useState(false)
  const gi = idx % 5

  return (
    <div className="card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="card-img" style={{ background: CARD_BG[gi] }} onClick={() => window.location.href = `/product/${p.slug}`}>
        {p.images && p.images[0] ? (
          <>
            <Image src={optimizeImage(p.images[0], {width:1000, quality:90})} alt={p.name} fill
              sizes="(max-width:640px) 50vw, (max-width:900px) 33vw, 25vw"
              style={{ objectFit: 'cover' }} />
            {p.images[1] && (
              <Image src={optimizeImage(p.images[1], {width:1000, quality:90})} alt={p.name} fill className="card-img-hover"
                sizes="(max-width:640px) 50vw, (max-width:900px) 33vw, 25vw"
                style={{ objectFit: 'cover' }} />
            )}
          </>
        ) : (
          <>
            <div className="ph"><div className="ph-label">[ {(p.categories as any)?.name || ''} · {p.name} ]</div></div>
            <div className="card-img-hover" style={{ background: 'linear-gradient(135deg,#d4a094,#b8786a)' }} />
          </>
        )}
        {p.is_new && <span className="card-tag">{t('Новинка')}</span>}
        {p.price_old && !p.is_new && <span className="card-tag">−{Math.round((1 - p.price / p.price_old) * 100)}%</span>}
        <div className="card-quick">
          <button className="card-quick-btn" onClick={e => { e.stopPropagation(); onQuick() }}>{t('Быстрый просмотр')}</button>
        </div>
      </div>
      <div className="card-info">
        <div>
          <h4>{p.name}</h4>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.6, marginTop: 2 }}>
            {t((p.categories as any)?.name || '')}
          </div>
        </div>
        <div className="card-price">
          {p.price_old && <s>{formatPrice(p.price_old)}</s>}
          {formatPrice(p.price)}
        </div>
      </div>
      {p.product_variants && p.product_variants.length > 0 && (
        <div className="card-sizes">
          {[...new Set(p.product_variants.map(v => v.size))].slice(0, 5).map(s => (
            <span key={s} className="size-chip">{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomeClient({ featured, newProducts, catImages = {}, visibleTiles = null }: { featured: Product[]; newProducts: Product[]; catImages?: Record<string, string>; visibleTiles?: string[] | null }) {
  const cats = visibleTiles ? CATS.filter(c => visibleTiles.includes(c.key)) : CATS
  const { lang, t } = useLang()
  const [quickProduct, setQuickProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      {/* ===== HERO ===== */}
      <div className="hero">
        <div className="hero-grid">
          {/* Главная большая карточка */}
          <div className="hero-img">
            <div className="ph"><div className="ph-label">[ campaign ]</div></div>
            <div className="hero-overlay">
              <div className="hero-meta">
                <span className="hero-tag">POD PLATIEM ✿ KZ · KG · UZ</span>
              </div>
              <div>
                <h1 className="hero-title">
                  {t('Мягкие')} <em>{t('вещи,')}</em><br />{t('нежные')} <em>{t('намерения')}</em>
                </h1>
                <div className="hero-bottom">
                  <Link href="/catalog" className="hero-cta">
                    {t('В коллекцию')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </Link>
                  <span className="hero-tag hero-note" style={{ maxWidth: 260, textAlign: 'right', lineHeight: 1.6, opacity: 0.85 }}>
                    {t('Доставка в Казахстан,')}<br />{t('Кыргызстан и Узбекистан.')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Правые карточки */}
          <div className="hero-side">
            <div className="hero-card" style={{ background: 'linear-gradient(160deg,#d4a094 0%,#8a5448 100%)' }}>
              <div className="ph"><div className="ph-label">[ editorial 01 · still life ]</div></div>
              <div className="hero-card-mini">
                <span className="hero-tag" style={{ color: 'rgba(255,247,243,0.7)' }}>Editorial 01</span>
                <div>
                  <h3>{t('Сделано')}<br /><em>{t('для тебя')}</em><br />{t('каждый день')}</h3>
                  <Link href="/about" className="hero-cta" style={{ marginTop: 14, fontSize: 12, padding: '10px 18px' }}>
                    {t('О бренде')} <ArrowUR />
                  </Link>
                </div>
              </div>
            </div>
            <div className="hero-card" style={{ background: 'linear-gradient(160deg,#f0c8be 0%,#c98e88 100%)' }}>
              <div className="ph"><div className="ph-label">[ new ]</div></div>
              <div className="hero-card-mini">
                <span className="hero-tag" style={{ color: 'rgba(58,40,40,0.6)' }}>{t('Новинки')}</span>
                <div>
                  <h3 style={{ color: 'var(--ink)' }}>{t('Новинки')}<br /><em>{t('сезона')}</em></h3>
                  <Link href="/catalog?new=true" className="hero-cta" style={{ marginTop: 14, fontSize: 12, padding: '10px 18px', background: 'var(--ink)', color: 'var(--cream)' }}>
                    {t('Смотреть')} <ArrowUR />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== КАТЕГОРИИ ===== */}
      {cats.length > 0 && (
      <section>
        <div className="section-head">
          <h2>{t('Категории,')} <em>{t('выбери своё')}</em></h2>
          <span className="section-meta">{lang === 'ru' ? `${cats.length} ${cats.length === 1 ? 'категория' : cats.length < 5 ? 'категории' : 'категорий'}` : t('{n} категорий', { n: cats.length })}</span>
        </div>
        <div className="cats">
          {cats.map((cat, i) => (
            <Link key={cat.key} href={cat.href} style={{ textDecoration: 'none' }}>
              <div className="cat" style={{ background: catImages[cat.key] ? '#f6ede8' : cat.bg }}>
                {catImages[cat.key] ? (
                  <>
                    <img
                      src={optimizeImage(catImages[cat.key], {width:1000, quality:90})}
                      alt={t(cat.name)}
                      loading="lazy"
                      decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(58,40,40,0.55), transparent 45%)' }} />
                  </>
                ) : (
                  <div className="ph"><div className="ph-label">[ {cat.sub} ]</div></div>
                )}
                <div className="cat-label">
                  <h3>{cat.italic ? <em>{t(cat.name)}</em> : t(cat.name)}</h3>
                  <div className="cat-arrow"><ArrowUR /></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* ===== БЕСТСЕЛЛЕРЫ ===== */}
      {featured.length > 0 && (
        <section>
          <div className="section-head">
            <h2>{t('Бестселлеры,')} <em>{t('нежно любимы')}</em></h2>
            <span className="section-meta">{t('Хиты сезона')}</span>
          </div>
          <div className="product-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.id} p={p} idx={i} onQuick={() => setQuickProduct(p)} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/catalog?featured=true" className="btn btn-ghost">
              {t('Смотреть все хиты')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          </div>
        </section>
      )}

      {/* ===== PROMISE ===== */}
      <div className="promise">
        {PROMISE.map(p => (
          <div key={p.title}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
            <h5>{t(p.title)}</h5>
            <p>{t(p.sub)}</p>
          </div>
        ))}
      </div>

      {/* ===== ЛУКБУК ПРЕВЬЮ ===== */}
      <section>
        <div className="section-head">
          <h2>{t('О бренде —')} <em>POD PLATIEM</em></h2>
          <Link href="/about" className="btn btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }}>
            {t('Читать историю')} <ArrowUR />
          </Link>
        </div>
        <div className="lookbook">
          {/* Большая карточка слева */}
          <div className="lookbook-main" style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,#d4a094,#8a5448)', position: 'relative', cursor: 'pointer' }}
            onClick={() => window.location.href = '/about'}>
            <div className="ph"><div className="ph-label">[ brand story ]</div></div>
            <div className="lookbook-main-text" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: 'var(--cream)' }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 12 }}>{t('— Манифест')}</span>
              <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 300, fontSize: 'clamp(34px,8vw,48px)', lineHeight: 1, marginBottom: 16 }}>
                POD PLATIEM —<br /><em style={{ fontStyle: 'italic' }}>{t('это про тебя')}</em>
              </h2>
              <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, maxWidth: 360, marginBottom: 24 }}>
                {t('Бельё, в котором не хочется снимать. Свободные посадки, мягкие посадки, ткани которые ведут себя по-человечески.')}
              </p>
              <Link href="/about" className="hero-cta" style={{ width: 'fit-content' }}>
                {t('О нас')} <ArrowUR />
              </Link>
            </div>
          </div>

          {/* Правая колонка 2×2 */}
          <div className="lookbook-grid">
            {[
              { bg: 'linear-gradient(165deg,#f5d4ca,#d4a094)', label: 'Утро', num: '01' },
              { bg: 'linear-gradient(165deg,#e8b4a6,#c98e88)', label: 'Шёлк', num: '02' },
              { bg: 'linear-gradient(165deg,#f0c8be,#c98e88)', label: 'Кружево', num: '03' },
              { bg: 'linear-gradient(165deg,#ead0c4,#a87864)', label: 'Закат', num: '04' },
            ].map((item, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: item.bg, position: 'relative', cursor: 'pointer' }}
                onClick={() => window.location.href = '/about'}>
                <div className="ph"><div className="ph-label">[ frame {item.num} ]</div></div>
                <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--cream)' }}>
                  <h4 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 300, fontStyle: 'italic', fontSize: 22, lineHeight: 1 }}>{t(item.label)}</h4>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: '0.14em', opacity: 0.8 }}>N°{item.num}/04</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== НОВИНКИ ===== */}
      {newProducts.length > 0 && (
        <section>
          <div className="section-head">
            <h2>{t('Новинки,')} <em>{t('свежее')}</em></h2>
            <Link href="/catalog?new=true" className="btn btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }}>
              {t('Все новинки →')}
            </Link>
          </div>
          <div className="product-grid">
            {newProducts.map((p, i) => (
              <ProductCard key={p.id} p={p} idx={i + 2} onQuick={() => setQuickProduct(p)} />
            ))}
          </div>
        </section>
      )}

      {quickProduct && <QuickView product={quickProduct} onClose={() => setQuickProduct(null)} onCartOpen={() => setCartOpen(true)} />}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  )
}
