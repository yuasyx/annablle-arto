'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LANG_COOKIE, makeT, type Lang, type TFunc } from './index'

type Ctx = { lang: Lang; t: TFunc; setLang: (l: Lang) => void }
const LangContext = createContext<Ctx>({ lang: 'ru', t: makeT('ru'), setLang: () => {} })

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initial)
  const setLang = useCallback((l: Lang) => {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = l
    setLangState(l)
    router.refresh() // перерисовать серверные части (заголовки каталога и т.п.)
  }, [router])
  return <LangContext.Provider value={{ lang, t: makeT(lang), setLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
export const useT = () => useContext(LangContext).t
