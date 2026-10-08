import type { ReactNode } from 'react'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import { getLang, getT } from '@/lib/i18n/server'

const css = `
.legal-body{max-width:820px;margin:0 auto;padding:0 20px 90px;font-size:15px;line-height:1.7;color:var(--ink);}
.legal-body h2{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:26px;line-height:1.1;margin:34px 0 12px;padding-top:26px;border-top:1px solid var(--line);}
.legal-body h2:first-child{border-top:none;padding-top:0;margin-top:0;}
.legal-body p{margin:0 0 14px;}
.legal-body ul{margin:0 0 16px;padding-left:20px;}
.legal-body li{margin-bottom:8px;}
.legal-body a{color:var(--rose-deep);}
.legal-fill{background:var(--rose);color:var(--ink);border-radius:4px;padding:1px 6px;font-weight:600;}
.legal-note{margin:6px 0 14px;padding:16px 18px;border-left:3px solid var(--rose-deep);background:rgba(232,180,166,0.18);border-radius:0 8px 8px 0;font-size:14px;}
`

export default function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: ReactNode
  intro?: ReactNode
  updated?: string
  children: ReactNode
}) {
  const t = getT()
  const lang = getLang()
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Header />

      <div className="catalog-head" style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 24px' }}>
        <div className="crumbs" style={{ marginBottom: 18 }}>
          <a href="/">{t('Главная')}</a> / {typeof title === 'string' ? title : 'Информация'}
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.05, marginBottom: intro ? 14 : 8 }}>
          {title}
        </h1>
        {intro ? (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', maxWidth: 620, lineHeight: 1.6 }}>{intro}</p>
        ) : null}
        {lang !== 'ru' ? (
          <p style={{ fontSize: 12, color: 'var(--rose-deep)', marginTop: 10 }}>{t('Раздел на русском языке')}</p>
        ) : null}
        {updated ? (
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', opacity: 0.7, marginTop: 10 }}>Обновлено: {updated}</p>
        ) : null}
      </div>

      <section className="legal-body">{children}</section>

      <Footer />
    </main>
  )
}
