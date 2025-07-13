'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const languages = [
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'de', label: '🇩🇪 Deutsch' },
]

export default function LanguageSwitcher() {
  const { locale, pathname, asPath, query } = useRouter()
  const [open, setOpen]     = useState(false)
  const [isClient, setIsClient] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Флаг client-only
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Закрытие при клике вне
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Пока не на клиенте — отрисовать только пустой контейнер нужного размера
  if (!isClient) {
    return <div className="w-8 h-8" />
  }

  const current = languages.find(l => l.code === locale) || languages[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:ring-2 hover:ring-blue-400 transition"
        aria-label="Select language"
      >
        <span className="text-xl">
          {current.label.split(' ')[0]}
        </span>
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-md overflow-hidden z-50 transition-opacity duration-150">
          {languages.map(({ code, label }) => {
            if (code === current.code) return null
            return (
              <li key={code}>
                <Link
                  href={{ pathname, query }}
                  as={asPath}
                  locale={code}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">{label.split(' ')[0]}</span>
                  <span className="text-sm">{label.split(' ')[1]}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
