// components/LanguageSwitcher.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'

export default function LanguageSwitcher() {
  const { pathname, query } = useRouter()
  // Не используем asPath и query для href, чтобы на сервере/клиенте было одинаково
  const langs = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
  ]

  return (
    <div className="flex space-x-2">
      {langs.map(({ code, label }) => (
        <Link
          key={code}
          href={pathname}         // единственный неизменный маршрут
          locale={code}           // переключаем язык
          className="px-2 py-1 border rounded hover:bg-gray-200 text-sm"
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
