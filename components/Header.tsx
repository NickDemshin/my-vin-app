'use client'

import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function Header() {
  const { t } = useTranslation('common')
  const { data: session } = useSession()

  const [isClient, setIsClient] = useState(false)

  // Убедимся, что компонент только на клиенте
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <header className="bg-white/70 backdrop-blur-lg shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        {t('title')}
      </Link>

      <nav className="flex gap-4 items-center">
        <Link href="/">{t('home')}</Link>
        <Link href="/faq">{t('faq')}</Link>
        <LanguageSwitcher />

        {isClient && session?.user ? (
          <>
            <Link href="/dashboard" className="text-blue-600 font-medium">
              Кабинет
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-red-500 hover:underline text-sm"
            >
              Выйти
            </button>
          </>
        ) : isClient ? (
          <Link
            href="/auth/signin"
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            Вход / Регистрация
          </Link>
        ) : null}
      </nav>
    </header>
  )
}
