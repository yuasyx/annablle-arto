'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { PROMOS, promoLabel } from '@/lib/promos'

let _sb: ReturnType<typeof createClient> | null = null
function getSupabaseClient() {
  if (!_sb) {
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _sb
}

type Product = {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  price_old?: number
  in_stock: boolean
  is_new: boolean
  is_featured: boolean
  is_hidden: boolean
  promos?: string[] | null
  images: string[]
  created_at: string
  categories?: { name: string; slug: string } | null
  product_variants?: { size: string; color?: string }[]
}

type Order = {
  id: string
  order_number: number
  status: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  city?: string
  address?: string
  delivery_method?: string
  payment_method?: string
  notes?: string
  total_amount: number
  created_at: string
}

type Category = { id: string; name: string; slug: string }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Новый',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#c084fc',
  paid: '#60a5fa',
  shipped: '#fb923c',
  delivered: '#4ade80',
  cancelled: '#f87171',
}

function formatPrice(n: number) {
  return n?.toLocaleString('ru-RU') + ' ₸'
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const S = {
  page: { minHeight: '100vh', background: 'var(--cream, #faf7f4)', color: 'var(--ink, #1a1a1a)', fontFamily: 'inherit' } as React.CSSProperties,
  header: { borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' } as React.CSSProperties,
  logo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, textDecoration: 'none', color: 'inherit' } as React.CSSProperties,
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' } as React.CSSProperties,
  title: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 'clamp(32px,4vw,48px)', lineHeight: 1.1, marginBottom: 8 } as React.CSSProperties,
  tabs: { display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 0 } as React.CSSProperties,
  tab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' as const, opacity: 0.5, borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { opacity: 1, borderBottomColor: 'var(--ink, #1a1a1a)' },
  tabBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 999, background: '#c084fc', color: 'white', fontSize: 10, fontWeight: 700, marginLeft: 6 } as React.CSSProperties,
  card: { background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 12 } as React.CSSProperties,
  btn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, letterSpacing: '0.04em' } as React.CSSProperties,
  btnDark: { background: 'var(--ink, #1a1a1a)', color: 'white' } as React.CSSProperties,
  btnOutline: { background: 'transparent', color: 'var(--ink, #1a1a1a)', border: '1px solid rgba(0,0,0,0.2)' } as React.CSSProperties,
  input: { width: '100%', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const },
  label: { display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, opacity: 0.5, marginBottom: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
  statusBadge: (s: string): React.CSSProperties => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11,
    fontWeight: 600, background: STATUS_COLORS[s] + '22', color: STATUS_COLORS[s],
  }),
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<'products' | 'orders' | 'settings'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // блокируем прокрутку фона, пока открыта модалка формы
  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showForm])
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [form, setForm] = useState<{
    name: string; description: string; price: string; price_old: string;
    category_id: string; is_new: boolean; is_featured: boolean; in_stock: boolean; is_hidden: boolean;
    promos: string[];
    colors: { name: string; hex: string; images: string; sizes: string }[];
  }>({
    name: '', description: '', price: '', price_old: '',
    category_id: '', is_new: false, is_featured: false, in_stock: true, is_hidden: false, promos: [],
    colors: [{ name: 'Основной', hex: '#3a2828', images: '', sizes: 'XS,S,M,L,XL' }],
  })
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [uploadingColorIdx, setUploadingColorIdx] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const newOrdersCount = orders.filter(o => o.status === 'pending').length

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) { setAuthed(true); loadData() }
    else alert('Неверный пароль')
  }

  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    try {
      const sb = getSupabaseClient()
      const [prodRes, ordersRes, catRes, settingsRes] = await Promise.allSettled([
        sb.from('products').select('*, categories(*), product_variants(size, color)').order('created_at', { ascending: false }),
        fetch('/api/admin/orders').then(r => r.json()),
        sb.from('categories').select('*').order('name'),
        sb.from('site_settings').select('key, value'),
      ])

      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data || [])
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data || [])
      if (settingsRes.status === 'fulfilled') {
        const map: Record<string, string> = {}
        const rows = (settingsRes.value as any).data || []
        for (const row of rows) {
          if (row.value) map[row.key] = row.value
        }
        setSettings(map)
      }
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setOrders(ordersRes.value)
      } else {
        setOrders([])
        if (ordersRes.status === 'fulfilled') console.error('Orders API error:', ordersRes.value)
      }
    } catch (err) { console.error(err) }
    if (!silent) setLoading(false)
  }

  async function saveSettings() {
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const data = await res.json()
      if (!res.ok) { alert('Ошибка сохранения: ' + (data?.error || res.status)) }
      else { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2500) }
    } catch (err: any) {
      alert('Ошибка: ' + (err?.message || err))
    }
    setSettingsSaving(false)
  }

  async function updateOrderStatus(id: string, status: string) {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  function openAddForm() {
    setEditProduct(null)
    setForm({
      name: '', description: '', price: '', price_old: '',
      category_id: categories[0]?.id || '', is_new: false, is_featured: false, in_stock: true, is_hidden: false, promos: [],
      colors: [{ name: 'Основной', hex: '#3a2828', images: '', sizes: 'XS,S,M,L,XL' }],
    })
    setShowForm(true)
  }

  async function openEditForm(p: Product) {
    setEditProduct(p)
    const sb = getSupabaseClient()
    const { data: colorRows } = await sb
      .from('product_colors')
      .select('*')
      .eq('product_id', p.id)
      .order('sort_order', { ascending: true })

    let colors: { name: string; hex: string; images: string; sizes: string }[]
    if (colorRows && colorRows.length > 0) {
      colors = colorRows.map((c: any) => {
        const sizesForColor = (p.product_variants || [])
          .filter((v: any) => v.color === c.name)
          .map((v: any) => v.size)
        const uniqueSizes = Array.from(new Set(sizesForColor))
        return {
          name: c.name,
          hex: c.hex || '#3a2828',
          images: (c.images || []).join('\n'),
          sizes: uniqueSizes.length > 0 ? uniqueSizes.join(',') : 'XS,S,M,L,XL',
        }
      })
    } else {
      const allSizes = Array.from(new Set(p.product_variants?.map((v: any) => v.size) || []))
      colors = [{
        name: 'Основной', hex: '#3a2828',
        images: (p.images || []).join('\n'),
        sizes: allSizes.length > 0 ? allSizes.join(',') : 'XS,S,M,L,XL',
      }]
    }

    setForm({
      name: p.name, description: p.description || '', price: String(p.price),
      price_old: p.price_old ? String(p.price_old) : '',
      category_id: (p.categories as any)?.id || (p as any).category_id || '',
      is_new: p.is_new, is_featured: p.is_featured, in_stock: p.in_stock, is_hidden: p.is_hidden,
      promos: p.promos || [],
      colors,
    })
    setShowForm(true)
  }

  function addColor() {
    setForm(f => ({ ...f, colors: [...f.colors, { name: '', hex: '#3a2828', images: '', sizes: 'XS,S,M,L,XL' }] }))
  }
  function removeColor(idx: number) {
    setForm(f => ({ ...f, colors: f.colors.filter((_, i) => i !== idx) }))
  }
  function updateColor(idx: number, field: 'name' | 'hex' | 'images' | 'sizes', value: string) {
    setForm(f => ({ ...f, colors: f.colors.map((c, i) => i === idx ? { ...c, [field]: value } : c) }))
  }

  // Просто возвращаем файл как есть — без сжатия
  async function compressImage(file: File): Promise<Blob> {
    return file
  }

  async function uploadColorPhotos(colorIdx: number, files: FileList | null) {
    if (!files || files.length === 0) { console.log('uploadColorPhotos: no files'); return }
    console.log('uploadColorPhotos: start', colorIdx, files.length, files[0].name, files[0].type, files[0].size)
    setUploadingColorIdx(colorIdx)
    setUploadProgress({ done: 0, total: files.length })

    const sb = getSupabaseClient()
    console.log('uploadColorPhotos: supabase client created')
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image:', file.name)
          continue
        }
        console.log('Compressing:', file.name)
        const compressed = await compressImage(file)
        console.log('Compressed size:', compressed.size)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        console.log('Uploading to path:', path)
        const { error } = await sb.storage.from('product-images').upload(path, compressed, {
          contentType: file.type, upsert: false,
        })
        if (error) {
          console.error('Upload error full:', JSON.stringify(error))
          alert('Ошибка загрузки ' + file.name + ': ' + error.message + '\n\nПроверь:\n1. Существует ли bucket "product-images" в Supabase Storage\n2. Есть ли политика INSERT (public upload)')
          continue
        }
        console.log('Upload success, getting public URL')
        const { data: pub } = sb.storage.from('product-images').getPublicUrl(path)
        console.log('Public URL:', pub?.publicUrl)
        if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl)
        setUploadProgress({ done: i + 1, total: files.length })
      }

      if (uploadedUrls.length > 0) {
        setForm(f => ({
          ...f,
          colors: f.colors.map((c, i) => {
            if (i !== colorIdx) return c
            const existing = c.images.split('\n').map(s => s.trim()).filter(Boolean)
            return { ...c, images: [...existing, ...uploadedUrls].join('\n') }
          }),
        }))
      }
    } catch (err: any) {
      alert('Ошибка: ' + (err?.message || err))
    } finally {
      setUploadingColorIdx(null)
      setUploadProgress({ done: 0, total: 0 })
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    const sb = getSupabaseClient()

    function slugify(s: string) {
      return s.toLowerCase().replace(/[^a-zа-яё0-9\s-]/gi, '').replace(/\s+/g, '-').replace(/[а-яё]/g, c => ({ а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }[c] || c))
    }

    // Чистим цвета: только заполненные
    const colors = form.colors
      .map(c => ({
        name: c.name.trim(),
        hex: c.hex || '#3a2828',
        images: c.images.split('\n').map(s => s.trim()).filter(Boolean),
        sizes: c.sizes.split(',').map(s => s.trim()).filter(Boolean),
      }))
      .filter(c => c.name.length > 0)

    if (colors.length === 0) { alert('Добавьте хотя бы один цвет с названием'); return }

    // Фото товара (для превью каталога) = фото первого цвета
    const mainImages = colors[0].images

    const payload: Record<string, unknown> = {
      name: form.name,
      slug: editProduct?.slug || slugify(form.name) + '-' + Date.now(),
      description: form.description,
      price: Number(form.price),
      price_old: form.price_old ? Number(form.price_old) : null,
      category_id: form.category_id || null,
      is_new: form.is_new,
      is_featured: form.is_featured,
      in_stock: form.in_stock,
      is_hidden: form.is_hidden,
      images: mainImages,
    }
    // Акции (1+1=3 и т.п.). Сохраняем, только если в базе уже есть колонка promos —
    // иначе сохранение товара упало бы до выполнения SQL-миграции.
    if (products.some(p => 'promos' in p)) payload.promos = form.promos

    // ID товара (создаём или обновляем)
    let productId: string
    if (editProduct) {
      await (sb.from('products') as any).update(payload).eq('id', editProduct.id)
      productId = editProduct.id
      // чистим старые цвета и варианты
      await sb.from('product_colors').delete().eq('product_id', productId)
      await sb.from('product_variants').delete().eq('product_id', productId)
    } else {
      const { data: newP, error } = await (sb.from('products') as any).insert(payload).select().single()
      if (error || !newP) { alert('Ошибка создания товара: ' + (error?.message || '')); return }
      productId = newP.id
    }

    // Записываем цвета в product_colors
    const colorRows = colors.map((c, i) => ({
      product_id: productId,
      name: c.name,
      hex: c.hex,
      images: c.images,
      sort_order: i,
    }))
    const { error: colorErr } = await (sb.from('product_colors') as any).insert(colorRows)
    if (colorErr) { alert('Ошибка сохранения цветов: ' + colorErr.message); return }

    // Записываем варианты (size + color) — чтобы цвет и размер попали в фильтры каталога
    const variantRows: { product_id: string; size: string; color: string }[] = []
    for (const c of colors) {
      for (const size of c.sizes) {
        variantRows.push({ product_id: productId, size, color: c.name })
      }
    }
    if (variantRows.length > 0) {
      const { error: varErr } = await (sb.from('product_variants') as any).insert(variantRows)
      if (varErr) { alert('Ошибка сохранения размеров: ' + varErr.message); return }
    }

    setShowForm(false)
    loadData(true)  // тихо: без размонтирования списка, скролл сохраняется
  }

  async function deleteProduct(id: string) {
    if (!confirm('Удалить товар?')) return
    const sb = getSupabaseClient()
    await sb.from('product_colors').delete().eq('product_id', id)
    await sb.from('product_variants').delete().eq('product_id', id)
    await sb.from('products').delete().eq('id', id)
    loadData(true)
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 360, background: 'white', borderRadius: 16, padding: '40px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 32, marginBottom: 4, textAlign: 'center' }}>
          Annabelle Arto
        </h1>
        <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 32 }}>
          Панель управления
        </p>
        <form onSubmit={handleLogin}>
          <label style={S.label}>Пароль</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ ...S.input, marginBottom: 20 }} placeholder="••••••••" autoFocus
          />
          <button type="submit" style={{ ...S.btn, ...S.btnDark, width: '100%', justifyContent: 'center' }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  )

  // ─── MAIN ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={S.logo}>Annabelle Arto</Link>
          <span style={{ fontSize: 11, opacity: 0.3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>· admin</span>
        </div>
        <Link href="/" style={{ ...S.btn, ...S.btnOutline, fontSize: 12 }}>← На сайт</Link>
      </header>

      <div style={S.wrap}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={S.title}>Панель <em style={{ fontStyle: 'italic', color: 'var(--rose-deep, #b07060)' }}>управления</em></h1>
          <p style={{ fontSize: 12, opacity: 0.4, letterSpacing: '0.06em' }}>
            · {products.length} товаров · {orders.length} заказов
          </p>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {(['products', 'orders', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}>
              {t === 'products' ? 'Товары' : t === 'orders' ? (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Заказы {newOrdersCount > 0 && <span style={S.tabBadge}>{newOrdersCount}</span>}
                </span>
              ) : 'Настройки'}
            </button>
          ))}
        </div>

        {loading && <p style={{ opacity: 0.4, fontSize: 13 }}>Загрузка...</p>}

        {/* ═══════════════ ORDERS TAB ═══════════════ */}
        {tab === 'orders' && !loading && (
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.4, marginBottom: 20 }}>
              История заказов
            </p>

            {orders.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '60px 24px' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 24, opacity: 0.3, marginBottom: 8 }}>Пока тихо</p>
                <p style={{ fontSize: 13, opacity: 0.4 }}>Заказы появятся здесь.</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} style={S.card}>
                {/* Order header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400 }}>
                      #{order.order_number}
                    </span>
                    <span style={S.statusBadge(order.status)}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span style={{ fontSize: 13, opacity: 0.5 }}>{order.customer_name}</span>
                    <span style={{ fontSize: 13, opacity: 0.5 }}>{order.customer_phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                      {formatPrice(order.total_amount)}
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.4 }}>{formatDate(order.created_at)}</span>
                    <span style={{ opacity: 0.3 }}>{expandedOrder === order.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Order details */}
                {expandedOrder === order.id && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={S.grid2}>
                      <div>
                        <p style={S.label}>Покупатель</p>
                        <p style={{ fontSize: 14, marginBottom: 4 }}>{order.customer_name}</p>
                        <p style={{ fontSize: 13, opacity: 0.6 }}>{order.customer_phone}</p>
                        {order.customer_email && <p style={{ fontSize: 13, opacity: 0.6 }}>{order.customer_email}</p>}
                      </div>
                      <div>
                        <p style={S.label}>Доставка</p>
                        <p style={{ fontSize: 14, marginBottom: 4 }}>{order.city}</p>
                        {order.address && <p style={{ fontSize: 13, opacity: 0.6 }}>{order.address}</p>}
                        {order.delivery_method && <p style={{ fontSize: 12, opacity: 0.4, marginTop: 4 }}>{order.delivery_method}</p>}
                      </div>
                    </div>

                    {order.notes && (
                      <div style={{ marginTop: 16 }}>
                        <p style={S.label}>Примечание</p>
                        <p style={{ fontSize: 13, opacity: 0.7, fontStyle: 'italic' }}>{order.notes}</p>
                      </div>
                    )}

                    {/* Status change */}
                    <div style={{ marginTop: 20 }}>
                      <p style={S.label}>Изменить статус</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => updateOrderStatus(order.id, key)}
                            style={{
                              ...S.btn,
                              padding: '6px 14px',
                              fontSize: 12,
                              background: order.status === key ? STATUS_COLORS[key] : 'transparent',
                              color: order.status === key ? 'white' : STATUS_COLORS[key],
                              border: `1px solid ${STATUS_COLORS[key]}`,
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ PRODUCTS TAB ═══════════════ */}
        {tab === 'products' && !loading && (() => {
          const q = searchQuery.trim().toLowerCase()
          const filteredProducts = q
            ? products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.slug.toLowerCase().includes(q) ||
                (p.promos || []).some(k => promoLabel(k).toLowerCase().includes(q)) ||
                ((p.categories as any)?.name || '').toLowerCase().includes(q)
              )
            : products
          return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.4 }}>
                Все товары ({products.length}){q && ` — найдено: ${filteredProducts.length}`}
              </p>
              <button onClick={openAddForm} style={{ ...S.btn, ...S.btnDark }}>+ Добавить товар</button>
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Поиск по названию, slug или категории..."
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  background: 'white',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Очистить"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Product form — модалка поверх списка, чтобы не прыгать по странице */}
            {showForm && (
              <div
                onClick={e => e.target === e.currentTarget && setShowForm(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(58,40,40,0.45)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 20 }}
              >
              <div style={{ ...S.card, margin: 0, border: '1px solid rgba(0,0,0,0.15)', width: '100%', maxWidth: 860, maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Закрыть"
                  style={{ position: 'sticky', top: 0, float: 'right', width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(0,0,0,0.15)', background: '#fff', cursor: 'pointer', fontSize: 18, zIndex: 2 }}
                >×</button>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 24, marginBottom: 20 }}>
                  {editProduct ? 'Редактировать товар' : 'Новый товар'}
                </h3>
                <form onSubmit={handleSaveProduct}>
                  <div style={{ ...S.grid2, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>Название *</label>
                      <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={S.label}>Категория</label>
                      <select style={S.input} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                        <option value="">— без категории —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Описание</label>
                    <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div style={{ ...S.grid2, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>Цена ₸ *</label>
                      <input style={S.input} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={S.label}>Старая цена ₸</label>
                      <input style={S.input} type="number" value={form.price_old} onChange={e => setForm(f => ({ ...f, price_old: e.target.value }))} />
                    </div>
                  </div>
                  {/* ── ЦВЕТА ── */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ ...S.label, marginBottom: 0 }}>Цвета товара</label>
                      <button type="button" onClick={addColor} style={{ ...S.btn, ...S.btnOutline, padding: '5px 12px', fontSize: 12 }}>+ Добавить цвет</button>
                    </div>

                    {form.colors.map((c, idx) => (
                      <div key={idx} style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: 16, marginBottom: 12, background: 'rgba(0,0,0,0.015)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, opacity: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>Цвет {idx + 1}</span>
                          {form.colors.length > 1 && (
                            <button type="button" onClick={() => removeColor(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>✕ Удалить цвет</button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-end' }}>
                          <div style={{ flex: 1 }}>
                            <label style={S.label}>Название цвета *</label>
                            <input style={S.input} value={c.name} onChange={e => updateColor(idx, 'name', e.target.value)} placeholder="Чёрный, Бежевый, Красный..." />
                          </div>
                          <div>
                            <label style={S.label}>Оттенок</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="color" value={c.hex} onChange={e => updateColor(idx, 'hex', e.target.value)} style={{ width: 44, height: 40, padding: 2, border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, cursor: 'pointer', background: 'white' }} />
                              <input style={{ ...S.input, width: 90 }} value={c.hex} onChange={e => updateColor(idx, 'hex', e.target.value)} placeholder="#000000" />
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={S.label}>Размеры этого цвета (через запятую)</label>
                          <input style={S.input} value={c.sizes} onChange={e => updateColor(idx, 'sizes', e.target.value)} placeholder="XS,S,M,L,XL или 70B,75C,80D" />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label style={{ ...S.label, marginBottom: 0 }}>Фото этого цвета</label>
                            <UploadButton
                              idx={idx}
                              uploadingColorIdx={uploadingColorIdx}
                              uploadProgress={uploadProgress}
                              onFiles={(files) => uploadColorPhotos(idx, files)}
                            />
                          </div>
                          <textarea
                            style={{ ...S.input, minHeight: 70, resize: 'vertical', fontSize: 12 }}
                            value={c.images}
                            onChange={e => updateColor(idx, 'images', e.target.value)}
                            placeholder="Каждая ссылка с новой строки, или загрузи кнопкой выше"
                          />
                          {c.images.split('\n').map(s => s.trim()).filter(Boolean).length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                              {c.images.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6).map((url, i) => (
                                <div key={i} style={{ width: 40, height: 52, borderRadius: 6, overflow: 'hidden', background: '#e8d5ce', flexShrink: 0 }}>
                                  <img src={url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                    {[['is_new', 'Новинка'], ['is_featured', 'Хит'], ['in_stock', 'В наличии'], ['is_hidden', 'Скрыт с сайта']].map(([key, label]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={S.label}>Акции</div>
                    {products.length > 0 && !products.some(p => 'promos' in p) ? (
                      <p style={{ fontSize: 12, color: '#991b1b' }}>Чтобы отмечать акции, выполните в Supabase SQL из файла supabase-promos.sql</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                        {PROMOS.map(pr => (
                          <label key={pr.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.promos.includes(pr.key)}
                              onChange={e => setForm(f => ({ ...f, promos: e.target.checked ? [...f.promos, pr.key] : f.promos.filter(k => k !== pr.key) }))} />
                            {pr.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="submit" style={{ ...S.btn, ...S.btnDark }}>
                      {editProduct ? 'Сохранить' : 'Создать товар'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ ...S.btn, ...S.btnOutline }}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
              </div>
            )}

            {/* Products list */}
            {filteredProducts.length === 0 && q && (
              <div style={{ ...S.card, textAlign: 'center', padding: '40px 20px', opacity: 0.5 }}>
                Ничего не найдено по запросу «{searchQuery}»
              </div>
            )}
            {filteredProducts.map(p => (
              <div key={p.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 64, borderRadius: 8, background: '#e8d5ce', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill sizes="48px" quality={45} style={{ objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{p.name}</span>
                    {p.is_new && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 999 }}>Новинка</span>}
                    {(p.promos || []).map(k => <span key={k} style={{ fontSize: 10, background: '#fce7f3', color: '#9d174d', padding: '2px 8px', borderRadius: 999 }}>{promoLabel(k)}</span>)}
                    {!p.in_stock && <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 999 }}>Нет в наличии</span>}
                  </div>
                  <span style={{ fontSize: 13, opacity: 0.5 }}>{(p.categories as any)?.name}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{formatPrice(p.price)}</p>
                  {p.price_old && <p style={{ fontSize: 12, opacity: 0.4, textDecoration: 'line-through' }}>{formatPrice(p.price_old)}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEditForm(p)} style={{ ...S.btn, ...S.btnOutline, padding: '6px 14px', fontSize: 12 }}>Изменить</button>
                  <button onClick={() => deleteProduct(p.id)} style={{ ...S.btn, background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 14px', fontSize: 12 }}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
          )
        })()}

        {/* ═══════════════ SETTINGS TAB ═══════════════ */}
        {tab === 'settings' && !loading && (
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.4, marginBottom: 20 }}>
              Изображения сайта
            </p>

            {/* Главная страница */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 22, marginBottom: 16 }}>
                Главная страница
              </h3>
              <SettingField label="Фоновое изображение (hero)" k="hero_bg" settings={settings} setSettings={setSettings} />
            </div>

            {/* Контакты */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 22, marginBottom: 16 }}>
                Блок контактов
              </h3>
              <div style={S.grid2}>
                <SettingField label="Картинка 1" k="contact_img_1" settings={settings} setSettings={setSettings} />
                <SettingField label="Картинка 2" k="contact_img_2" settings={settings} setSettings={setSettings} />
                <SettingField label="Картинка 3" k="contact_img_3" settings={settings} setSettings={setSettings} />
                <SettingField label="Картинка 4" k="contact_img_4" settings={settings} setSettings={setSettings} />
              </div>
            </div>

            {/* Баннеры меню */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 22, marginBottom: 16 }}>
                Баннеры в мега-меню
              </h3>
              <div style={S.grid2}>
                <SettingField label="Бельё" k="menu_banner_lingerie" settings={settings} setSettings={setSettings} />
                <SettingField label="Купальники" k="menu_banner_swim" settings={settings} setSettings={setSettings} />
                <SettingField label="Одежда" k="menu_banner_clothes" settings={settings} setSettings={setSettings} />
                <SettingField label="Колготки" k="menu_banner_tights" settings={settings} setSettings={setSettings} />
                <SettingField label="Мужчинам" k="menu_banner_men" settings={settings} setSettings={setSettings} />
                <SettingField label="Детям" k="menu_banner_kids" settings={settings} setSettings={setSettings} />
              </div>
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
              <button onClick={saveSettings} disabled={settingsSaving} style={{ ...S.btn, ...S.btnDark, opacity: settingsSaving ? 0.6 : 1 }}>
                {settingsSaving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
              {settingsSaved && <span style={{ fontSize: 13, color: '#4ade80' }}>✓ Сохранено</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upload button with ref-based file input (avoids form/label click issues) ─
function UploadButton({ idx, uploadingColorIdx, uploadProgress, onFiles }: {
  idx: number
  uploadingColorIdx: number | null
  uploadProgress: { done: number; total: number }
  onFiles: (files: FileList | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploading = uploadingColorIdx === idx
  const isDisabled = uploadingColorIdx !== null

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        disabled={isDisabled}
        onChange={e => { onFiles(e.target.files); e.target.value = '' }}
      />
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', fontSize: 12, cursor: isDisabled ? 'not-allowed' : 'pointer',
          borderRadius: 999, border: '1px solid rgba(0,0,0,0.2)', background: 'transparent',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        {isUploading ? `Загрузка ${uploadProgress.done}/${uploadProgress.total}...` : '📷 Загрузить с компьютера'}
      </button>
    </>
  )
}

// ─── Settings field with URL input + preview ──────────────────────────────
function SettingField({
  label, k, settings, setSettings,
}: {
  label: string
  k: string
  settings: Record<string, string>
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  const value = settings[k] || ''
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 64, height: 64, borderRadius: 8, background: '#e8d5ce', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
          {value && <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }} />}
        </div>
        <input
          style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' }}
          value={value}
          placeholder="https://... ссылка на картинку"
          onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))}
        />
      </div>
    </div>
  )
}
