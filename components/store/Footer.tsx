'use client'
import Link from 'next/link'
import { useMenuAvailability, isAvailable } from '@/lib/useMenuAvailability'

// Ссылки «Каталог» в футере. Пустые категории не показываются.
const CATALOG_LINKS = [
  ['Бельё', '/catalog?section=lingerie'],
  ['Пижамы', '/catalog?cat=pajamas'],
  ['Боди', '/catalog?cat=bodysuit'],
  ['Халаты', '/catalog?cat=robes'],
  ['Новинки', '/catalog?new=true'],
]

export default function Footer() {
  const available = useMenuAvailability()
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <h3>Будь <em>нежной.</em></h3>
          <p style={{opacity:0.7,fontSize:13,maxWidth:320}}>
            Письма раз в месяц: о новинках, скидках и секретах ухода за бельём.
          </p>
          <div className="subscribe">
            <input placeholder="Твой email" />
            <button>Подписаться</button>
          </div>
        </div>
        <div>
          <h6>Каталог</h6>
          <ul>
            {CATALOG_LINKS.filter(([, h]) => isAvailable(available, h)).map(([l,h]) => (
              <li key={h}><Link href={h}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h6>Сервис</h6>
          <ul>
            {[['Доставка и оплата','/delivery'],['Возврат товара','/returns'],['Таблица размеров','/size-guide'],['Контакты','/contacts'],['Политика конфиденциальности','/privacy'],['Публичная оферта','/offer']].map(([l,h]) => (
              <li key={h}><Link href={h}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h6>POD PLATIEM</h6>
          <ul>
            <li><Link href="/about">О бренде</Link></li>
            <li><a href="https://www.instagram.com/pod_platiem.official/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://wa.me/77001234567">WhatsApp</a></li>
            <li><a>Казахстан 🇰🇿</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 POD PLATIEM</span>
        <span style={{ fontSize: 11, opacity: 0.6, lineHeight: 1.6 }}>ТОО «Anabel Arto Lingerie» · БИН 150740013086 · г. Алматы, ул. Навои 7, корп. 2 · +7 776 699 9905 · podplatiem@gmail.com</span>
        <span>КАЗАХСТАН · БЕЛЬЁ С ЛЮБОВЬЮ</span>
        <span>KZ · ₸</span>
      </div>
    </footer>
  )
}
