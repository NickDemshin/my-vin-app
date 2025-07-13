'use client'

import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function Header() {
  const { t } = useTranslation('common')
  const { data: session } = useSession()
  const [isClient, setIsClient] = useState(false)

  const pathname     = usePathname() || ''
  const searchParams = useSearchParams()
  const queryString  = searchParams?.toString()
  const callbackUrl  = `${pathname}${queryString ? `?${queryString}` : ''}`

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg shadow p-4 flex justify-between items-center z-50">
      <Link href="/" className="text-xl font-bold">
        {t('home')}
      </Link>
      <nav className="flex gap-4 items-center">
        <Link href="/" className="hover:underline">{t('home')}</Link>
        <Link href="/faq" className="hover:underline">{t('faq')}</Link>
        <LanguageSwitcher />

        {isClient && session?.user ? (
          <>
            {/* Ссылка в «Кабинет» только если мы не на /dashboard */}
            {pathname !== '/dashboard' && (
              <Link
                href={`/dashboard?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {t('dashboard')}
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-red-500 hover:underline text-sm"
            >
              {t('sign_out')}
            </button>
          </>
        ) : isClient ? (
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            {t('sign_in')}
          </Link>
        ) : null}
      </nav>
    </header>
  )
}
