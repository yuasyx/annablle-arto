import Link from 'next/link'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import { verifySuccessSignature } from '@/lib/robokassa'
import ClearCart from './ClearCart'
import { getLang, getT } from '@/lib/i18n/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SP = { [key: string]: string | string[] | undefined }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

export default function PaymentSuccessPage({ searchParams }: { searchParams: SP }) {
  const outSum = one(searchParams.OutSum)
  const invId = one(searchParams.InvId)
  const signature = one(searchParams.SignatureValue)

  const verified = outSum && invId && signature
    ? verifySuccessSignature(outSum, invId, signature)
    : false

  const lang = getLang()
  const t = getT()

  return (
    <main>
      <Header />
      {verified && <ClearCart />}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--rose)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', fontSize: 32, color: 'var(--ink)' }}>✓</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 40, lineHeight: 1.1, marginBottom: 16 }}>
          {lang === 'ru'
            ? <>Оплата <em style={{ fontStyle: 'italic', color: 'var(--rose-deep)' }}>прошла!</em></>
            : t('Оплата прошла!')}
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
          {t('Спасибо за покупку!')} {invId && <>{t('Ваш заказ №{n} оплачен.', { n: invId })}</>} {t('Мы свяжемся с вами для подтверждения деталей доставки.')}
        </p>
        <p style={{ color: 'var(--ink-soft)', fontSize: 12, lineHeight: 1.6, marginBottom: 32, opacity: 0.7 }}>
          {t('Чек и статус оплаты придут на указанный e-mail.')}
        </p>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 999, background: 'var(--ink)', color: 'var(--cream)', textDecoration: 'none', fontSize: 13, letterSpacing: '0.04em' }}>
          {t('На главную')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
      <Footer />
    </main>
  )
}
