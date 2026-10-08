'use client'
import { useEffect, useState } from 'react'
import type { MenuItem } from '@/components/store/menuData'

// Список непустых ссылок каталога (см. /api/menu). Кэшируется на время жизни вкладки.
// null — ещё не загружено или база недоступна: тогда показываем всё как есть.
let cache: Set<string> | null = null
let pending: Promise<Set<string> | null> | null = null

function load() {
  if (!pending) {
    pending = fetch('/api/menu')
      .then(r => r.json())
      .then(d => (cache = Array.isArray(d.available) ? new Set<string>(d.available) : null))
      .catch(() => null)
  }
  return pending
}

export function useMenuAvailability() {
  const [available, setAvailable] = useState<Set<string> | null>(cache)
  useEffect(() => {
    if (!cache) load().then(setAvailable)
  }, [])
  return available
}

export function isAvailable(available: Set<string> | null, href: string) {
  if (!available || !href.startsWith('/catalog')) return true
  return available.has(href)
}

/** Убирает из меню пустые ссылки, пустые колонки и разделы без единого товара. */
export function filterMenu(menu: MenuItem[], available: Set<string> | null): MenuItem[] {
  if (!available) return menu
  return menu
    .map(item => {
      const columns = item.columns
        ?.map(c => ({ ...c, items: c.items.filter(l => isAvailable(available, l.href)) }))
        .filter(c => c.items.length > 0)
      return { ...item, columns: columns && columns.length > 0 ? columns : undefined }
    })
    .filter(item => (item.href ? isAvailable(available, item.href) : (item.columns?.length || 0) > 0))
}
