import Link from 'next/link'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import { getLang, getT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

type SP = { [key: string]: string | string[] | undefined }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

export default function PaymentFailPage({ searchParams }: { searchParams: SP }) {
  const invId = one(searchParams.InvId)
  const lang = getLang()
  const t = getT()

  return (
    <main>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--line)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', fontSize: 30, color: 'var(--ink)' }}>✕</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 40, lineHeight: 1.1, marginBottom: 16 }}>
          {lang === 'ru'
            ? <>Оплата <em style={{ fontStyle: 'italic', color: 'var(--rose-deep)' }}>не завершена</em></>
            : t('Оплата не завершена')}
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          {lang === 'ru'
            ? <>Платёж {invId && <>по заказу №{invId} </>}не был завершён или был отменён. Ваш заказ сохранён — вы можете повторить оплату из корзины или связаться с нами, и мы поможем.</>
            : <>{invId ? t('Платёж по заказу №{n} не был завершён или был отменён.', { n: invId }) : t('Платёж не был завершён или был отменён.')} {t('Ваш заказ сохранён — вы можете повторить оплату из корзины или связаться с нами.')}</>}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 999, background: 'var(--ink)', color: 'var(--cream)', textDecoration: 'none', fontSize: 13, letterSpacing: '0.04em' }}>
            {t('Вернуться в корзину')}
          </Link>
          <Link href="/contacts" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 999, background: 'transparent', color: 'var(--ink)', textDecoration: 'none', fontSize: 13, letterSpacing: '0.04em', border: '1px solid var(--line)' }}>
            {t('Связаться с нами')}
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
