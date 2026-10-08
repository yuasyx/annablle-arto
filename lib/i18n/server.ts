import { cookies } from 'next/headers'
import { LANG_COOKIE, makeT, normalizeLang, type Lang } from './index'

// Язык для серверных страниц — из cookie, которую ставит переключатель в шапке.
export function getLang(): Lang {
  return normalizeLang(cookies().get(LANG_COOKIE)?.value)
}

export function getT() {
  return makeT(getLang())
}
