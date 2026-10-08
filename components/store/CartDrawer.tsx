'use client'
import { useCart } from '@/lib/cart'
import { formatPrice, optimizeImage } from '@/lib/utils'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, removeItem, updateQty, totalPrice, totalItems } = useCart()
  const t = useT()
  const subtotal = totalPrice()
  const shipping = subtotal > 15000 ? 0 : 1500

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(58,40,40,0.5)',backdropFilter:'blur(6px)',zIndex:90,animation:'fadein .25s ease'}} />
      <div style={{position:'fixed',right:0,top:0,height:'100vh',width:480,maxWidth:'100vw',background:'var(--cream)',zIndex:91,display:'flex',flexDirection:'column',animation:'slidein .35s cubic-bezier(.2,.7,.2,1)'}}>
        {/* Шапка */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'22px 24px',borderBottom:'1px solid var(--line)'}}>
          <h3 style={{fontFamily:'Cormorant Garamond,serif',fontWeight:300,fontStyle:'italic',fontSize:28}}>
            {t('Корзина')} <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,opacity:0.5,fontStyle:'normal'}}>({totalItems()})</span>
          </h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:24,color:'var(--ink)'}}>×</button>
        </div>

        {/* Товары */}
        <div style={{flex:1,overflow:'auto',padding:'18px 24px'}}>
          {items.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 20px',color:'var(--ink-soft)'}}>
              <div style={{fontSize:48,opacity:0.3,marginBottom:12}}>✿</div>
              <h4 style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontStyle:'italic',fontWeight:300}}>{t('Пусто и нежно')}</h4>
              <p style={{fontSize:13,marginTop:8}}>{t('Добавь что-нибудь, что хочется носить')}</p>
            </div>
          ) : items.map((item, idx) => {
            const itemImage = item.product.images && item.product.images.length > 0 ? item.product.images[0] : null
            return (
            <div key={`${item.product.id}-${item.size}`} style={{display:'grid',gridTemplateColumns:'80px 1fr auto',gap:14,padding:'14px 0',borderBottom:'1px solid var(--line)'}}>
              <Link href={`/product/${item.product.slug}`} onClick={onClose} style={{aspectRatio:'3/4',borderRadius:8,background:'linear-gradient(165deg,#e8b4a6,#c98e88)',position:'relative',overflow:'hidden',display:'block'}}>
                {itemImage ? (
                  <img src={optimizeImage(itemImage, {width:250, quality:85})} alt={item.product.name}
                    style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  <div className="ph" style={{borderRadius:8}}></div>
                )}
              </Link>
              <div>
                <h4 style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:400}}>{item.product.name}</h4>
                <p style={{fontSize:12,color:'var(--ink-soft)',margin:'2px 0'}}>
                  {t((item.product.categories as any)?.name || '')} · {t('р. {s}', { s: item.size })}{item.color ? ` · ${item.color}` : ''}
                </p>
                <div style={{display:'inline-flex',alignItems:'center',gap:4,border:'1px solid var(--line)',borderRadius:999,padding:2,marginTop:6}}>
                  <button onClick={() => updateQty(item.product.id, item.size, item.qty - 1)} style={{width:26,height:26,borderRadius:999,background:'transparent',border:'none',cursor:'pointer',fontSize:16}}>−</button>
                  <span style={{width:24,textAlign:'center',fontSize:13}}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, item.size, item.qty + 1)} style={{width:26,height:26,borderRadius:999,background:'transparent',border:'none',cursor:'pointer',fontSize:16}}>+</button>
                </div>
              </div>
              <div style={{textAlign:'right',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <span style={{fontSize:14}}>{formatPrice(item.product.price * item.qty)}</span>
                <button onClick={() => removeItem(item.product.id, item.size)} style={{background:'none',border:'none',fontSize:11,color:'var(--ink-soft)',cursor:'pointer',textDecoration:'underline'}}>
                  {t('удалить')}
                </button>
              </div>
            </div>
            )
          })}
        </div>

        {/* Итого */}
        {items.length > 0 && (
          <div style={{padding:'22px 24px',borderTop:'1px solid var(--line)',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span>{t('Подытог')}</span><span>{formatPrice(subtotal)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span>{t('Доставка')}</span><span>{shipping === 0 ? t('Бесплатно') : formatPrice(shipping)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Cormorant Garamond,serif',fontSize:22,paddingTop:8,borderTop:'1px solid var(--line)',marginTop:4}}><span>{t('Итого')}</span><span>{formatPrice(subtotal + shipping)}</span></div>
            <Link href="/checkout" onClick={onClose} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px 24px',borderRadius:999,background:'var(--ink)',color:'var(--cream)',textDecoration:'none',fontSize:13,letterSpacing:'0.04em',marginTop:8}}>
              {t('Оформить заказ')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
            {shipping > 0 && (
              <p style={{textAlign:'center',fontSize:12,color:'var(--ink-soft)',opacity:0.7}}>
                {t('Бесплатная доставка по Казахстану от {p}', { p: formatPrice(15000) })}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
