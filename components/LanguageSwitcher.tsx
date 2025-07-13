
'use client'
import { useRouter } from 'next/router'

export default function LanguageSwitcher() {
  const router = useRouter()
  const { locale, locales, asPath } = router

  return (
    <select
      value={locale}
      onChange={(e) => router.push(asPath, asPath, { locale: e.target.value })}
      className="border px-2 py-1 rounded"
    >
      {locales?.map((loc) => (
        <option key={loc} value={loc}>
          {loc.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
