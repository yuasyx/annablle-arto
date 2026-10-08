import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LangProvider } from '@/lib/i18n/client'
import { getLang } from '@/lib/i18n/server'

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap'

export const metadata: Metadata = {
  metadataBase: new URL('https://podplatiem.com'),
  verification: { google: 'iAobtB07L6xt5GasPfduNv2v7LqHG63L9VExtgGlH8I' },
  title: 'POD PLATIEM — Женское бельё в Казахстане, Кыргызстане и Узбекистане',
  description: 'Изысканное женское бельё с доставкой по Казахстану, Кыргызстану и Узбекистану. Оплата банковской картой Visa, Mastercard.',
  openGraph: {
    title: 'POD PLATIEM — Женское бельё в Казахстане, Кыргызстане и Узбекистане',
    description: 'Изысканное женское бельё с доставкой по Казахстану, Кыргызстану и Узбекистану. Оплата банковской картой Visa, Mastercard.',
    url: 'https://podplatiem.com',
    siteName: 'POD PLATIEM',
    locale: 'ru_RU',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang()
  return (
    <html lang={lang}>
      <body>
        {/* Ранняя загрузка шрифтов: соединение и CSS шрифтов стартуют сразу,
            не дожидаясь @import внутри globals.css */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
        <div className="app-bg" />
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  )
}
