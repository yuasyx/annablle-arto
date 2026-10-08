'use client'
import { useState } from 'react'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import SizeGuideModal from '@/components/store/SizeGuideModal'
import { useT } from '@/lib/i18n/client'

const SECTIONS = [
  { value: 'lingerie', label: 'Бельё' },
  { value: 'swim', label: 'Купальники' },
  { value: 'clothes', label: 'Одежда' },
  { value: 'tights', label: 'Колготки' },
  { value: 'men', label: 'Мужчинам' },
  { value: 'kids', label: 'Детям' },
]

export default function SizeGuidePage() {
  const [active, setActive] = useState<string>('lingerie')
  const [open, setOpen] = useState(false)
  const t = useT()

  function openSection(s: string) {
    setActive(s)
    setOpen(true)
  }

  return (
    <main>
      <Header />

      <div className="catalog-head" style={{maxWidth:1100,margin:'0 auto',padding:'40px 20px 32px'}}>
        <div className="crumbs" style={{marginBottom:18}}>
          <a href="/">{t('Главная')}</a> / {t('Таблица размеров')}
        </div>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontWeight:300,fontStyle:'italic',fontSize:'clamp(36px, 5vw, 56px)',lineHeight:1.05,marginBottom:14}}>
          {t('Таблица')} <em>{t('размеров')}</em>
        </h1>
        <p style={{fontSize:14,color:'var(--ink-soft)',maxWidth:560,lineHeight:1.6}}>
          {t('Подбирайте размер по своим параметрам. Если ваши мерки между двумя размерами — берите больший. Не уверены? Напишите нам в WhatsApp или Instagram, поможем.')}
        </p>
      </div>

      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 20px 80px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:18}}>
          {SECTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => openSection(s.value)}
              style={{
                background:'rgba(255,247,243,0.6)',
                border:'1px solid var(--line)',
                borderRadius:14,
                padding:'28px 22px',
                cursor:'pointer',
                textAlign:'left',
                display:'flex',
                flexDirection:'column',
                gap:8,
                transition:'all .25s',
                fontFamily:'inherit',
                color:'var(--ink)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,247,243,1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(58,40,40,0.08)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255,247,243,0.6)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',opacity:0.55}}>
                {t('Раздел')}
              </div>
              <h3 style={{fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',fontWeight:300,fontSize:28,lineHeight:1}}>
                {t(s.label)}
              </h3>
              <div style={{fontSize:12,color:'var(--rose-deep)',marginTop:6,display:'flex',alignItems:'center',gap:6}}>
                {t('Открыть таблицу')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Footer />
      {open && <SizeGuideModal section={active} onClose={() => setOpen(false)} />}
    </main>
  )
}
