'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/supabase'
import { formatPrice, optimizeImage} from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { useState } from 'react'
import { useT } from '@/lib/i18n/client'

const CARD_GRADIENTS = [
  'linear-gradient(165deg,#f3c8be,#d99c8e)',
  'linear-gradient(165deg,#ead0c4,#d4a094)',
  'linear-gradient(165deg,#f5d8d0,#d8a89c)',
  'linear-gradient(165deg,#e8c4b6,#c8907e)',
  'linear-gradient(165deg,#f0c8be,#d8907e)',
]
const CARD_HOVER = [
  'linear-gradient(135deg,#d4a094,#b8786a)',
  'linear-gradient(135deg,#c8907e,#9a6858)',
  'linear-gradient(135deg,#d4a094,#8a5448)',
  'linear-gradient(135deg,#b8786a,#8a5448)',
  'linear-gradient(135deg,#c98e88,#9a6858)',
]

function ProductCard({ product, idx }: { product: Product; idx: number }) {
  const t = useT()
  const addItem = useCart(s => s.addItem)
  const [added, setAdded] = useState(false)
  const sizes = [...new Set(product.product_variants?.map(v => v.size) || [])]
  const firstImage = product.images?.[0]
  const gi = idx % 5

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    const v = product.product_variants?.[0]
    if (v) { addItem(product, v.size, v.color); setAdded(true); setTimeout(() => setAdded(false), 2000) }
  }

  return (
    <Link href={`/product/${product.slug}`} className="card">
      <div className="card-img" style={{background: firstImage ? '#ffffff' : CARD_GRADIENTS[gi]}}>
        {firstImage ? (
          <div className="card-img-inner">
            <Image src={optimizeImage(firstImage, {width:800, quality:90})} alt={product.name} fill style={{objectFit:'cover'}} />
          </div>
        ) : (
          <>
            <div className="ph"><div className="ph-label">[ {product.name} ]</div></div>
            <div className="card-img-hover" style={{background: CARD_HOVER[gi]}} />
          </>
        )}
        {(product.is_new || (product.price_old && !product.is_new)) && (
          <span className="card-tag">{product.is_new ? t('Новинка') : `−${Math.round((1 - product.price / product.price_old!) * 100)}%`}</span>
        )}
        {sizes.length > 0 && (
          <div className="card-quick">
            <button className="card-quick-btn" onClick={handleQuickAdd}>
              {added ? t('✓ Добавлено') : t('Быстро в корзину')}
            </button>
          </div>
        )}
      </div>
      <div className="card-info">
        <div>
          <h4>{product.name}</h4>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',opacity:0.6,marginTop:2}}>
            {t((product.categories as any)?.name || '')}
          </div>
        </div>
        <div className="card-price">
          {product.price_old && <s>{formatPrice(product.price_old)}</s>}
          {formatPrice(product.price)}
        </div>
      </div>
      {sizes.length > 0 && (
        <div className="card-sizes">
          {sizes.slice(0,5).map(s => <span key={s} className="size-chip">{s}</span>)}
        </div>
      )}
    </Link>
  )
}

export default function ProductGrid({ products }: { products: Product[] }) {
  const t = useT()
  if (!products || products.length === 0) {
    return (
      <div style={{textAlign:'center',padding:'80px 20px',color:'var(--ink-soft)'}}>
        <div style={{fontSize:40,opacity:0.3,marginBottom:12}}>✿</div>
        <p style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontStyle:'italic',fontWeight:300}}>{t('Товары не найдены')}</p>
        <p style={{fontSize:13,marginTop:8,opacity:0.6}}>{t('Попробуйте изменить фильтры')}</p>
      </div>
    )
  }
  return (
    <div className="product-grid">
      {products.map((p, i) => <ProductCard key={p.id} product={p} idx={i} />)}
    </div>
  )
}
