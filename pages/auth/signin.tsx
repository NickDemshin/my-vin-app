import Link from 'next/link'
import { getCsrfToken } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

type Props = {
  csrfToken: string
  callbackUrl: string
}

export default function SignIn({ csrfToken, callbackUrl }: Props) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Показ ошибки, если NextAuth вернул ?error=CredentialsSignin
  useEffect(() => {
    if (router.query.error) {
      setError(t('invalid_credentials'))
      // убираем query, чтобы сообщение не висело
      router.replace(router.pathname, undefined, { shallow: true })
    }
  }, [router, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        method="post"
        action={`/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

        <h1 className="text-2xl font-bold mb-6 text-center">
          {t('sign_in')}
        </h1>

        <label className="block mb-1">{t('email')}</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <label className="block mb-1">{t('password')}</label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {t('sign_in')}
        </button>

        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}

        <p className="text-center text-sm mt-4">
          {t('no_account')}{' '}
          <Link href="/auth/signup" className="text-blue-600 underline">
            {t('sign_up')}
          </Link>
        </p>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const { locale, defaultLocale, query } = ctx
  const csrfToken = await getCsrfToken(ctx)

  // Если пришёл callbackUrl в query — используем его, иначе — корень сайта
  const callbackUrl = typeof query.callbackUrl === 'string'
    ? query.callbackUrl
    : '/dashboard'

  return {
    props: {
      csrfToken,
      callbackUrl,
      ...(await serverSideTranslations(locale ?? defaultLocale!, ['common']))
    }
  }
}
