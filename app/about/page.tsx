import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'

export const metadata = {
  title: 'О бренде — POD PLATIEM',
  description:
    'POD PLATIEM — казахстанский бренд женского белья. 12 лет на рынке Казахстана: комфорт, качество материалов и размеры от XS до 3XL.',
}

const STATS: [string, string][] = [
  ['2013', 'год основания'],
  ['12 лет', 'на рынке Казахстана'],
  ['XS–3XL', 'все размеры'],
  ['KZ · KG · UZ', 'доставка'],
]

const VALUES: [string, string][] = [
  [
    'Комфорт прежде всего',
    'Мы не верим в бельё, которое нужно терпеть. Каждая модель создана так, чтобы вы забыли, что она на вас.',
  ],
  [
    'Качество материалов',
    'Премиальная микрофибра, натуральное кружево, хлопок и мягкий сатин — только те ткани, которые выбрали бы для себя.',
  ],
  [
    'Красиво для всех',
    'Размеры от XS до 3XL. Красивое бельё создано для настоящих женщин, а не для манекенов.',
  ],
  [
    'Казахстан — наш дом',
    'Мы выросли здесь и доставляем по всей стране, а также в Кыргызстан и Узбекистан — бережно и вовремя.',
  ],
]

const css = `
.about-hero{background:var(--ink);color:var(--cream);padding:120px 24px 96px;}
.about-hero .inner{max-width:900px;margin:0 auto;}
.about-eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:var(--rose);opacity:0.9;margin-bottom:24px;}
.about-hero h1{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(40px,6.5vw,84px);line-height:1.02;letter-spacing:-0.01em;margin:0 0 26px;}
.about-hero p{font-size:16px;line-height:1.7;max-width:560px;opacity:0.82;}

.about-wrap{max-width:900px;margin:0 auto;padding:0 24px;}
.about-section{padding:80px 0;border-bottom:1px solid var(--line);}
.about-section:last-of-type{border-bottom:none;}
.about-label{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:var(--rose-deep);margin-bottom:20px;}
.about-section h2{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(30px,4.5vw,52px);line-height:1.05;margin:0 0 24px;}
.about-section p{font-size:16px;line-height:1.8;color:var(--ink-soft);margin:0 0 18px;max-width:680px;}

.about-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:56px 0;}
.about-stat .num{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:clamp(28px,3.5vw,44px);line-height:1;color:var(--ink);}
.about-stat .lbl{font-size:12px;letter-spacing:0.04em;color:var(--ink-soft);margin-top:8px;}

.about-values{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.about-value{background:rgba(255,247,243,0.6);border:1px solid var(--line);border-radius:16px;padding:30px 26px;transition:transform .25s,box-shadow .25s;}
.about-value:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(58,40,40,0.08);}
.about-value h3{font-family:'Cormorant Garamond',serif;font-weight:400;font-style:italic;font-size:24px;line-height:1.1;margin:0 0 10px;}
.about-value p{font-size:14px;line-height:1.7;color:var(--ink-soft);margin:0;}

.about-cta{display:flex;gap:14px;flex-wrap:wrap;padding:64px 0 96px;}
.about-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-size:14px;letter-spacing:0.03em;text-decoration:none;transition:all .25s;}
.about-btn.primary{background:var(--ink);color:var(--cream);}
.about-btn.primary:hover{background:var(--rose-deep);}
.about-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--ink);}
.about-btn.ghost:hover{background:var(--ink);color:var(--cream);}

@media(max-width:680px){
  .about-stats{grid-template-columns:1fr 1fr;gap:28px 16px;}
  .about-values{grid-template-columns:1fr;}
  .about-hero{padding:88px 20px 64px;}
}
`

export default function AboutPage() {
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Header />

      <section className="about-hero">
        <div className="inner">
          <div className="about-eyebrow">POD PLATIEM · О бренде</div>
          <h1>Бельё, в котором вам хорошо — уже 12 лет</h1>
          <p>
            Казахстанский бренд женского белья. С 2013 года мы создаём вещи, которые хочется
            носить каждый день — и к которым возвращаются.
          </p>
        </div>
      </section>

      <div className="about-wrap">
        <section className="about-section">
          <div className="about-label">— Наша история</div>
          <h2>Начиналось с простого желания</h2>
          <p>
            POD PLATIEM появился в Казахстане в 2013 году — из желания сделать красивое бельё,
            которое не нужно терпеть. Тогда это был один небольшой магазин и несколько моделей,
            отшитых с вниманием к каждой детали.
          </p>
          <p>
            За 12 лет мы выросли в бренд, которому доверяют тысячи женщин по всей стране. Но
            принцип остался прежним: сначала — комфорт, потом всё остальное. Мы по-прежнему сами
            выбираем ткани, проверяем посадку и отвечаем за каждую вещь, которая уезжает к вам.
          </p>
          <p>
            Сегодня мы доставляем по всему Казахстану — от Алматы и Астаны до небольших городов,
            а также в Кыргызстан и Узбекистан — и продолжаем расширять коллекции, оставаясь бельём, к которому возвращаются.
          </p>

          <div className="about-stats">
            {STATS.map(([num, lbl]) => (
              <div className="about-stat" key={lbl}>
                <div className="num">{num}</div>
                <div className="lbl">{lbl}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-label">— Что для нас важно</div>
          <h2>Наши принципы</h2>
          <div className="about-values">
            {VALUES.map(([title, text]) => (
              <div className="about-value" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-label">— Материалы</div>
          <h2>Ткани, которые чувствуешь</h2>
          <p>
            Мы работаем с премиальной микрофиброй, натуральным кружевом, хлопком и сатином.
            Каждая ткань проходит проверку на комфорт: она должна быть мягкой к коже, держать
            форму и оставаться приятной даже в конце длинного дня. Мы не гонимся за количеством
            моделей — важнее, чтобы каждая садилась идеально.
          </p>
        </section>

        <div className="about-cta">
          <a href="/catalog" className="about-btn primary">
            Смотреть каталог →
          </a>
          <a href="/contacts" className="about-btn ghost">
            Связаться с нами
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}
