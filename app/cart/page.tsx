'use client'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import { useCart } from '@/lib/cart'
import { formatPrice, optimizeImage } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, totalItems } = useCart()
  const t = useT()

  if (items.length === 0) {
    return (
      <main>
        <Header />
        <div className="max-w-2xl mx-auto px-8 py-24 text-center">
          <h1 className="font-cormorant text-4xl font-light mb-4">
            {t('Корзина пуста')}
          </h1>
          <p className="text-stone-400 text-sm mb-8">{t('Добавьте товары из каталога')}</p>
          <Link
            href="/catalog"
            className="bg-stone-900 text-stone-50 px-8 py-3 text-[12px] tracking-widest uppercase hover:bg-stone-700 transition-colors"
          >
            {t('Перейти в каталог')}
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Header />
      <div className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="font-cormorant text-3xl font-light mb-8">
          {t('Корзина')} <em className="italic text-amber-700">({totalItems()})</em>
        </h1>

        <div className="grid grid-cols-3 gap-10">
          {/* Список товаров */}
          <div className="col-span-2 flex flex-col gap-4">
            {items.map(item => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="flex gap-4 border-b border-stone-100 pb-4"
              >
                {/* Фото */}
                <div className="w-20 h-28 bg-[var(--color-warm)] relative overflow-hidden shrink-0">
                  {item.product.images?.[0] ? (
                    <Image src={optimizeImage(item.product.images[0], {width:250, quality:85})} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[9px] text-stone-400 text-center px-1">{item.product.name}</span>
                    </div>
                  )}
                </div>

                {/* Инфо */}
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-stone-800 mb-1">{item.product.name}</p>
                  <p className="text-[11px] text-stone-400 mb-3">
                    {t('Размер: {s}', { s: item.size })}
                    {item.color && ` · ${item.color}`}
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Количество */}
                    <div className="flex items-center border border-stone-200">
                      <button
                        onClick={() => updateQty(item.product.id, item.size, item.qty - 1)}
                        className="w-8 h-8 text-stone-500 hover:bg-stone-50 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-[13px]">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.size, item.qty + 1)}
                        className="w-8 h-8 text-stone-500 hover:bg-stone-50 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Цена */}
                    <span className="font-cormorant text-lg">
                      {formatPrice(item.product.price * item.qty)}
                    </span>
                  </div>
                </div>

                {/* Удалить */}
                <button
                  onClick={() => removeItem(item.product.id, item.size)}
                  className="text-stone-300 hover:text-stone-500 transition-colors self-start mt-1 text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Итого */}
          <div className="col-span-1">
            <div className="bg-stone-50 p-6 sticky top-24">
              <h2 className="font-cormorant text-xl font-light mb-6">{t('Итого')}</h2>

              <div className="flex flex-col gap-3 text-[13px] mb-6">
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('Товары ({n})', { n: totalItems() })}</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('Доставка')}</span>
                  <span className="text-stone-400">{t('рассчитывается')}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between font-medium">
                  <span>{t('Итого')}</span>
                  <span className="font-cormorant text-xl">{formatPrice(totalPrice())}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-stone-900 text-stone-50 py-4 text-center text-[12px] tracking-widest uppercase hover:bg-stone-700 transition-colors mb-3"
              >
                {t('Оформить заказ')}
              </Link>
              <Link
                href="/catalog"
                className="block w-full border border-stone-200 text-stone-600 py-3 text-center text-[11px] tracking-widest uppercase hover:border-stone-400 transition-colors"
              >
                {t('Продолжить покупки')}
              </Link>

              {/* Платёжки */}
              <div className="flex gap-1 flex-wrap justify-center mt-6">
                {['Visa', 'MC'].map(p => (
                  <span key={p} className="text-[9px] border border-stone-200 text-stone-400 px-2 py-0.5">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
