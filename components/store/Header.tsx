'use client'
import { useCart } from '@/lib/cart'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import CartDrawer from './CartDrawer'
import BrandLogo from './BrandLogo'
import { MENU, MenuItem } from './menuData'
import { useMenuAvailability, filterMenu } from '@/lib/useMenuAvailability'

export default function Header() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  function doSearch() { const q = searchText.trim(); if (q) router.push('/catalog?q=' + encodeURIComponent(q)) }
  const totalItems = useCart(s => s.totalItems())
  const [mounted, setMounted] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mExpanded, setMExpanded] = useState<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Пустые категории и акции не показываем — они появятся сами, когда в них будут товары
  const available = useMenuAvailability()
  const menu = filterMenu(MENU, available)

  useEffect(() => setMounted(true), [])

  // Блокируем прокрутку body, когда открыто мобильное меню
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Закрываем меню с задержкой — чтобы можно было водить мышью между пунктом и панелью
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenIndex(null), 150)
  }
  function cancelClose() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }
  function closeMobile() { setMobileOpen(false); setMExpanded(null) }

  // ESC закрывает меню
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpenIndex(null); setMobileOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="nav">
        <div className="nav-left-wrap">
          <button className="nav-burger" onClick={() => setMobileOpen(true)} aria-label="Открыть меню" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <nav className="mega-nav" onMouseLeave={scheduleClose}>
            {menu.map((item, i) => (
              <MegaItem
                key={item.label}
                item={item}
                isOpen={openIndex === i}
                onOpen={() => { cancelClose(); setOpenIndex(i) }}
              />
            ))}
          </nav>
        </div>

        <Link href="/" className="brand" onMouseEnter={() => setOpenIndex(null)} aria-label="POD PLATIEM — на главную">
          <BrandLogo />
        </Link>

        <div className="nav-right" onMouseEnter={() => setOpenIndex(null)}>
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); if (e.key === 'Escape') setSearchOpen(false) }} placeholder="Поиск по названию или артикулу" autoFocus={searchOpen} style={{ width: searchOpen ? 190 : 0, opacity: searchOpen ? 1 : 0, padding: searchOpen ? '4px 8px' : '4px 0', marginRight: searchOpen ? 4 : 0, border: 'none', borderBottom: searchOpen ? '1px solid var(--ink, #333)' : '1px solid transparent', background: 'transparent', fontSize: 13, fontFamily: 'inherit', outline: 'none', transition: 'width .25s ease, opacity .25s ease', pointerEvents: searchOpen ? 'auto' : 'none' }} />
        <button className="nav-icon" title="Поиск" type="button" onClick={() => { if (searchOpen && searchText.trim()) { doSearch() } else { setSearchOpen(o => !o) } }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <button onClick={() => setCartOpen(true)} className="cart-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            Корзина
            {mounted && totalItems > 0 && (
              <span style={{ background:'var(--rose)', color:'var(--ink)', fontSize:10, width:18, height:18, borderRadius:999, display:'grid', placeItems:'center', fontFamily:'JetBrains Mono,monospace', fontWeight:500 }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="marquee" onMouseEnter={() => setOpenIndex(null)}>
        <div className="marquee-track">
          {['Доставка по всему Казахстану','Оплата картой Visa / Mastercard','Возврат 14 рабочих дней','Размеры XS – 3XL','Новая коллекция 2025',
            'Доставка по всему Казахстану','Оплата картой Visa / Mastercard','Возврат 14 рабочих дней','Размеры XS – 3XL','Новая коллекция 2025',
          ].map((t,i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {/* ===== МОБИЛЬНОЕ МЕНЮ ===== */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={closeMobile}>
          <aside className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mdrawer-top">
              <Link href="/" className="mdrawer-brand" onClick={closeMobile} aria-label="POD PLATIEM — на главную">
                <BrandLogo />
              </Link>
              <button className="mdrawer-close" onClick={closeMobile} aria-label="Закрыть" type="button">×</button>
            </div>
            <nav className="mdrawer-nav">
              {menu.map((item, i) => {
                if (item.href && !item.columns) {
                  return (
                    <Link key={item.label} href={item.href} className="mdrawer-link" onClick={closeMobile}>
                      {item.label}
                    </Link>
                  )
                }
                const expanded = mExpanded === i
                return (
                  <div key={item.label} className="mdrawer-group">
                    <button className="mdrawer-grouphead" type="button" onClick={() => setMExpanded(expanded ? null : i)}>
                      <span>{item.label}</span>
                      <span className={`mdrawer-chev ${expanded ? 'open' : ''}`}>›</span>
                    </button>
                    {expanded && (
                      <div className="mdrawer-sub">
                        {item.href && (
                          <Link href={item.href} className="mdrawer-sublink strong" onClick={closeMobile}>
                            Все {item.label.toLowerCase()}
                          </Link>
                        )}
                        {item.columns?.map(col => (
                          <div key={col.title}>
                            <div className="mdrawer-coltitle">{col.title}</div>
                            {col.items.map(it => (
                              <Link key={it.label} href={it.href} className="mdrawer-sublink" onClick={closeMobile}>
                                {it.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  )
}

function MegaItem({ item, isOpen, onOpen }: { item: MenuItem; isOpen: boolean; onOpen: () => void }) {
  if (item.href && !item.columns) {
    return <Link href={item.href} className="mega-link">{item.label}</Link>
  }

  const colCount = item.columns?.length || 0
  const hasBanner = !!item.banner

  return (
    <div className="mega-wrap" onMouseEnter={onOpen}>
      {item.href ? (
        <Link href={item.href} className={`mega-link ${isOpen ? 'is-active' : ''}`}>
          {item.label}
        </Link>
      ) : (
        <button className={`mega-link ${isOpen ? 'is-active' : ''}`} type="button">
          {item.label}
        </button>
      )}

      {isOpen && item.columns && (
        <div className="mega-panel" data-cols={colCount + (hasBanner ? 1 : 0)}>
          <div className="mega-panel-inner">
            {item.columns.map(col => (
              <div key={col.title} className="mega-col">
                <div className="mega-col-title">{col.title}</div>
                <ul className="mega-col-list">
                  {col.items.map(it => (
                    <li key={it.label}>
                      <Link href={it.href} className="mega-col-link">{it.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {item.banner && (
              <Link href={item.banner.href} className="mega-banner">
                <div className="mega-banner-overlay" />
                <div className="mega-banner-text">
                  <div className="mega-banner-title">{item.banner.title}</div>
                  <div className="mega-banner-subtitle">{item.banner.subtitle}</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
