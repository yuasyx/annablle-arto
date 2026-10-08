import { DICT } from './dict'

// Языки сайта. Русский — основной: всё, чего нет в словаре, показывается по-русски.
export type Lang = 'ru' | 'kk' | 'ky' | 'uz'

export const LANGS: { code: Lang; short: string; name: string; html: string }[] = [
  { code: 'ru', short: 'RU', name: 'Русский', html: 'ru' },
  { code: 'kk', short: 'KZ', name: 'Қазақша', html: 'kk' },
  { code: 'ky', short: 'KG', name: 'Кыргызча', html: 'ky' },
  { code: 'uz', short: 'UZ', name: 'Oʻzbekcha', html: 'uz' },
]

export const LANG_COOKIE = 'lang'

export function normalizeLang(v: string | undefined | null): Lang {
  return LANGS.some(l => l.code === v) ? (v as Lang) : 'ru'
}

const IDX: Record<Exclude<Lang, 'ru'>, number> = { kk: 0, ky: 1, uz: 2 }

export type TFunc = (ru: string, vars?: Record<string, string | number>) => string

/** Переводит строку. Ключ — сам русский текст; {n} и т.п. подставляются из vars. */
export function translate(lang: Lang, ru: string, vars?: Record<string, string | number>): string {
  let s = ru
  if (lang !== 'ru') {
    const row = DICT[ru]
    if (row && row[IDX[lang]]) s = row[IDX[lang]]
  }
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

export const makeT = (lang: Lang): TFunc => (ru, vars) => translate(lang, ru, vars)
