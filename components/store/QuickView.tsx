'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/supabase'
import { formatPrice, optimizeImage} from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { useT } from '@/lib/i18n/client'

const CARD_BG = ['linear-gradient(165deg,#f3c8be,#d99c8e)','linear-gradient(165deg,#ead0c4,#d4a094)','linear-gradient(165deg,#f5d8d0,#d8a89c)']

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
function sortSizes(arr: (string | null)[]): string[] {
  const clean = arr.filter((s): s is string => !!s)
  const grp = (s: string) => LETTER_SIZES.includes(s) ? 0 : /^\d{2}$/.test(s) ? 1 : /[A-HА-З]$/.test(s) ? 2 : 3
  const braParts = (x: string): [number, number] => {
    const m = x.match(/^(\d{2,3})(?:\/\d{2})?([A-HА-З])$/)
    return m ? [parseInt(m[1], 10), m[2].charCodeAt(0)] : [999, 999]
  }
  return [...new Set(clean)].sort((a, b) => {
    const ga = grp(a), gb = grp(b)
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

const qvCss = `
.qv-grid{background:var(--cream);border-radius:18px;width:100%;max-width:900px;max-height:90vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;position:relative;animation:pop .3s cubic-bezier(.2,.7,.2,1);}
.qv-photo{aspect-ratio:2/3;border-radius:18px 0 0 18px;position:relative;overflow:hidden;background:#ffffff;}
.qv-desc{color:var(--ink-soft);font-size:13px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;}
.qv-thumbs{position:absolute;left:12px;bottom:12px;display:flex;gap:8px;z-index:2;}
.qv-thumb{width:44px;height:56px;border-radius:8px;overflow:hidden;position:relative;border:2px solid rgba(255,255,255,0.7);cursor:pointer;padding:0;background:none;}
.qv-thumb.on{border-color:var(--ink);}
@media (max-width: 700px){
  .qv-grid{grid-template-columns:1fr;max-width:440px;}
  .qv-photo{border-radius:18px 18px 0 0;aspect-ratio:3/4;}
  .qv-info{padding:22px !important;}
}
`

// Категории, не подлежащие возврату по ст. 30 Закона РК «О защите прав потребителей»:
// нательное/нижнее бельё и чулочно-носочные изделия.
function isNonReturnable(p: Product): boolean {
  const cat = (p.categories as any) || {}
  const hay = `${cat.name || ''} ${cat.slug || ''}`.toLowerCase()
  return ['бель', 'lingerie', 'колгот', 'чулк', 'чулоч', 'носк', 'термо', 'tights', 'hosiery', 'sock'].some(k => hay.includes(k))
}

export default function QuickView({ product: p, onClose, onCartOpen }: {
  product: Product; onClose: () => void; onCartOpen: () => void
}) {
  const { addItem } = useCart()
  const t = useT()
  const [size, setSize] = useState('')
  const [added, setAdded] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const sizes = sortSizes((p.product_variants || []).map(v => normalizeSize(v.size)))
  const images = (p.images || []).filter(Boolean)

  function handleAdd() {
    if (!size && sizes.length > 0) { alert(t('Выберите размер')); return }
    addItem(p, size || 'M', null)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose(); onCartOpen() }, 1000)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(58,40,40,0.5)',backdropFilter:'blur(8px)',zIndex:100,display:'grid',placeItems:'center',padding:20,animation:'fadein .25s ease'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style dangerouslySetInnerHTML={{ __html: qvCss }} />
      <div className="qv-grid">
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,zIndex:3,width:36,height:36,borderRadius:999,background:'var(--cream)',border:'1px solid rgba(58,40,40,0.2)',cursor:'pointer',display:'grid',placeItems:'center',fontSize:18}}>×</button>

        {/* Фото */}
        <div className="qv-photo">
          {images.length > 0 && (
            <Image
              src={optimizeImage(images[imgIdx] || images[0], {width:1000, quality:90})}
              alt={p.name}
              fill
              sizes="(max-width:700px) 90vw, 450px"
              style={{objectFit:'cover'}}
            />
          )}
          {images.length > 1 && (
            <div className="qv-thumbs">
              {images.slice(0,4).map((src, i) => (
                <button key={i} className={`qv-thumb ${i === imgIdx ? 'on' : ''}`} onClick={() => setImgIdx(i)} aria-label={`Фото ${i+1}`}>
                  <Image src={optimizeImage(src, {width:200, quality:85})} alt="" fill sizes="44px" style={{objectFit:'cover'}} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Инфо */}
        <div className="qv-info" style={{padding:36,display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <div className="pdp-cat">{t((p.categories as any)?.name || '')}</div>
            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontWeight:300,fontSize:36,lineHeight:1,marginBottom:8}}>{p.name}</h2>
            <div className="pdp-price">
              {p.price_old && <s>{formatPrice(p.price_old)}</s>}
              <span>{formatPrice(p.price)}</span>
              {p.price_old && <span className="save">−{Math.round((1-p.price/p.price_old)*100)}%</span>}
            </div>
          </div>

          {p.description && (
            <div>
              <p className="qv-desc">{p.description}</p>
              <a href={`/product/${p.slug}`} style={{display:'inline-block',marginTop:6,fontSize:13,color:'var(--rose-deep)',textDecoration:'underline',textUnderlineOffset:3}}>
                {t('Полное описание — на странице товара →')}
              </a>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',opacity:0.7,marginBottom:10}}>
                {t('Размер: {s}', { s: size || '—' })}
              </div>
              <div className="size-row">
                {sizes.map(s => (
                  <button key={s} className={`size-btn ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginTop:'auto'}}>
            <button onClick={handleAdd} style={{padding:'16px 24px',borderRadius:999,background:'var(--ink)',color:'var(--cream)',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,letterSpacing:'0.04em',transition:'all .3s'}}>
              {added ? t('✓ Добавлено!') : t('В корзину · {p}', { p: formatPrice(p.price) })}
            </button>
            <a href={`/product/${p.slug}`} style={{width:52,height:52,borderRadius:999,border:'1px solid var(--ink)',display:'grid',placeItems:'center',textDecoration:'none',color:'var(--ink)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17 17 7M9 7h8v8"/></svg>
            </a>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,borderTop:'1px solid var(--line)',paddingTop:16}}>
            {[
              ['🚚','Доставка','KZ · KG · UZ'],
              isNonReturnable(p)
                ? ['✔️','Гарантия качества','обмен при браке']
                : ['↩️','Возврат','14 рабочих дней'],
            ].map(([icon,title,sub]) => [icon, t(title), t(sub)]).map(([icon,title,sub]) => (
              <div key={title} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <span style={{fontSize:16}}>{icon}</span>
                <div><div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{title}</div><div style={{fontSize:12,color:'var(--ink-soft)'}}>{sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
