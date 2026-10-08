'use client'
import { useEffect } from 'react'
import { useT } from '@/lib/i18n/client'

// Размерные таблицы по разделам
type SizeTable = {
  title: string
  intro?: string
  headers: string[]
  rows: (string | number)[][]
  note?: string
}

const SIZE_TABLES: Record<string, SizeTable[]> = {
  // Бельё — две таблицы: бюстгальтеры (отдельный размерный ряд) и трусики/боди/комплекты
  lingerie: [
    {
      title: 'Бюстгальтеры',
      intro: 'Размер бюстгальтера состоит из двух частей: обхват под грудью + размер чашки.',
      headers: ['Под грудью, см', 'Размер пояса', 'A', 'B', 'C', 'D'],
      rows: [
        ['63–67', '70', '82–84', '84–86', '86–88', '88–90'],
        ['68–72', '75', '87–89', '89–91', '91–93', '93–95'],
        ['73–77', '80', '92–94', '94–96', '96–98', '98–100'],
        ['78–82', '85', '97–99', '99–101', '101–103', '103–105'],
        ['83–87', '90', '102–104', '104–106', '106–108', '108–110'],
      ],
      note: 'В таблице указан обхват по выступающим точкам груди.',
    },
    {
      title: 'Трусики, боди, комплекты',
      headers: ['Размер', 'Талия, см', 'Бёдра, см'],
      rows: [
        ['XS', '60–63', '86–89'],
        ['S', '64–67', '90–93'],
        ['M', '68–72', '94–97'],
        ['L', '73–77', '98–101'],
        ['XL', '78–82', '102–105'],
        ['2XL', '83–88', '106–111'],
        ['3XL', '89–94', '112–117'],
      ],
    },
  ],

  // Купальники
  swim: [
    {
      title: 'Купальники',
      intro: 'Подбирайте размер по обхвату груди и бёдер. Если параметры между размерами — берите больший.',
      headers: ['Размер', 'Грудь, см', 'Талия, см', 'Бёдра, см'],
      rows: [
        ['XS', '80–82', '60–63', '86–89'],
        ['S', '83–86', '64–67', '90–93'],
        ['M', '87–90', '68–72', '94–97'],
        ['L', '91–94', '73–77', '98–101'],
        ['XL', '95–99', '78–82', '102–105'],
        ['2XL', '100–105', '83–88', '106–111'],
      ],
    },
  ],

  // Одежда (пижамы, халаты, блузы, спорт)
  clothes: [
    {
      title: 'Женская одежда',
      headers: ['Размер', 'Грудь, см', 'Талия, см', 'Бёдра, см'],
      rows: [
        ['XS (40)', '80–82', '60–63', '86–89'],
        ['S (42)', '83–86', '64–67', '90–93'],
        ['M (44)', '87–90', '68–72', '94–97'],
        ['L (46)', '91–94', '73–77', '98–101'],
        ['XL (48)', '95–99', '78–82', '102–105'],
        ['2XL (50)', '100–105', '83–88', '106–111'],
        ['3XL (52)', '106–112', '89–94', '112–117'],
      ],
      note: 'В скобках указан российский размер.',
    },
  ],

  // Колготки
  tights: [
    {
      title: 'Колготки и чулки',
      intro: 'Размер подбирается по росту и весу.',
      headers: ['Размер', 'Рост, см', 'Вес, кг'],
      rows: [
        ['1 (XS)', '150–158', '40–50'],
        ['2 (S)', '155–165', '50–60'],
        ['3 (M)', '160–170', '55–65'],
        ['4 (L)', '165–175', '65–75'],
        ['5 (XL)', '170–180', '75–85'],
        ['6 (2XL)', '175–185', '85–95'],
      ],
      note: 'Если ваш рост и вес попадают в разные размеры — выбирайте по росту.',
    },
  ],

  // Мужчинам
  men: [
    {
      title: 'Мужская одежда и бельё',
      headers: ['Размер', 'Грудь, см', 'Талия, см', 'Бёдра, см'],
      rows: [
        ['S (46)', '88–92', '74–78', '92–96'],
        ['M (48)', '93–97', '79–83', '97–101'],
        ['L (50)', '98–102', '84–88', '102–106'],
        ['XL (52)', '103–108', '89–94', '107–112'],
        ['2XL (54)', '109–114', '95–100', '113–118'],
        ['3XL (56)', '115–120', '101–106', '119–124'],
      ],
    },
  ],

  // Детям и подросткам
  kids: [
    {
      title: 'Детская и подростковая одежда',
      intro: 'Размер подбирается по росту ребёнка.',
      headers: ['Рост, см', 'Возраст', 'Грудь, см', 'Талия, см'],
      rows: [
        ['110', '4–5 лет', '54–56', '52–53'],
        ['122', '6–7 лет', '58–60', '54–55'],
        ['134', '8–9 лет', '62–66', '56–58'],
        ['146', '10–11 лет', '67–72', '59–61'],
        ['158', '12–13 лет', '73–78', '62–64'],
        ['170', '14–15 лет', '79–84', '65–68'],
      ],
    },
  ],
}

const SECTION_LABELS: Record<string, string> = {
  lingerie: 'Бельё',
  swim: 'Купальники',
  clothes: 'Одежда',
  tights: 'Колготки',
  men: 'Мужская одежда',
  kids: 'Детям',
}

export default function SizeGuideModal({ section, onClose }: { section: string | null; onClose: () => void }) {
  const tr = useT()
  // Esc-закрытие
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Если раздел не определён — показываем общую женскую таблицу
  const tables = (section && SIZE_TABLES[section]) || SIZE_TABLES.clothes
  const sectionLabel = (section && SECTION_LABELS[section]) || 'Все товары'

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(58,40,40,0.55)',backdropFilter:'blur(8px)',zIndex:120,animation:'fadein .25s ease'}} />
      <div style={{
        position:'fixed', inset:'5vh 50% auto auto', transform:'translateX(50%)',
        right:'50%', top:'5vh', width:'min(820px, 92vw)', maxHeight:'90vh',
        background:'var(--cream)', borderRadius:18, zIndex:121,
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow:'0 30px 80px rgba(58,40,40,0.25)',
        animation:'fadein .3s ease',
      }}>
        {/* Шапка */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'24px 28px 18px',borderBottom:'1px solid var(--line)'}}>
          <div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,letterSpacing:'0.14em',textTransform:'uppercase',opacity:0.55,marginBottom:6}}>
              {tr(sectionLabel)} ✿ {tr('Размерная сетка')}
            </div>
            <h3 style={{fontFamily:'Cormorant Garamond,serif',fontWeight:300,fontStyle:'italic',fontSize:32,lineHeight:1.1,color:'var(--ink)'}}>
              {tr('Таблица')} <em>{tr('размеров')}</em>
            </h3>
          </div>
          <button onClick={onClose} aria-label={tr('Закрыть')} style={{background:'none',border:'none',cursor:'pointer',fontSize:28,color:'var(--ink)',opacity:0.5,padding:'4px 8px',lineHeight:1,transition:'opacity .2s'}}
            onMouseOver={e => (e.currentTarget.style.opacity = '1')}
            onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}
          >×</button>
        </div>

        {/* Таблицы */}
        <div style={{flex:1,overflow:'auto',padding:'22px 28px 28px'}}>
          {tables.map((t, idx) => (
            <div key={idx} style={{marginBottom: idx < tables.length - 1 ? 36 : 0}}>
              <h4 style={{fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',fontWeight:300,fontSize:24,color:'var(--ink)',marginBottom:10}}>
                {tr(t.title)}
              </h4>
              {t.intro && (
                <p style={{fontSize:13,color:'var(--ink-soft)',marginBottom:14,lineHeight:1.55,maxWidth:640}}>
                  {tr(t.intro)}
                </p>
              )}

              <div style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--line)'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,fontFamily:'Inter Tight,sans-serif'}}>
                  <thead>
                    <tr style={{background:'rgba(255,247,243,0.6)'}}>
                      {t.headers.map((h, i) => (
                        <th key={i} style={{
                          padding:'12px 14px',
                          textAlign:'left',
                          fontFamily:'JetBrains Mono,monospace',
                          fontSize:11,
                          letterSpacing:'0.08em',
                          textTransform:'uppercase',
                          color:'var(--ink)',
                          fontWeight:500,
                          borderBottom:'1px solid var(--line)',
                        }}>{tr(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, ri) => (
                      <tr key={ri} style={{borderBottom: ri < t.rows.length - 1 ? '1px solid var(--line)' : 'none', transition:'background .15s'}}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{
                            padding:'12px 14px',
                            color: ci === 0 ? 'var(--ink)' : 'var(--ink-soft)',
                            fontWeight: ci === 0 ? 500 : 400,
                          }}>{tr(String(cell))}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {t.note && (
                <p style={{fontSize:12,color:'var(--ink-soft)',opacity:0.75,marginTop:10,fontStyle:'italic',maxWidth:640}}>
                  ✿ {tr(t.note)}
                </p>
              )}
            </div>
          ))}

          {/* Подсказка */}
          <div style={{marginTop:32,padding:'16px 18px',background:'rgba(255,247,243,0.5)',borderRadius:12,fontSize:12,color:'var(--ink-soft)',lineHeight:1.6}}>
            <strong style={{color:'var(--ink)',fontWeight:500}}>{tr('Не получается определить размер?')}</strong> {tr('Свяжитесь с нами в WhatsApp или Instagram — поможем подобрать.')}
          </div>
        </div>
      </div>
    </>
  )
}
