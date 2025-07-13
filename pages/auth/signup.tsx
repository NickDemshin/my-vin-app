// pages/auth/signup.tsx
import { getCsrfToken } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

type SignUpProps = {
  csrfToken: string
}

export default function SignUp({ csrfToken }: SignUpProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('invalid_email'))
      return
    }
    if (password.length < 8) {
      setError(t('password_too_short'))
      return
    }
    if (password !== confirm) {
      setError(t('password_mismatch'))
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error || t('registration_failed'))
    } else {
      router.push('/auth/signin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <h1 className="text-2xl font-bold mb-6 text-center">{t('sign_up')}</h1>

        <label className="block mb-1">{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <label className="block mb-1">{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder={t('password_hint')}
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <label className="block mb-1">{t('confirm_password')}</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          placeholder={t('confirm_password')}
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? t('loading') : t('sign_up')}
        </button>

        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}

        <p className="text-center text-sm mt-4">
          {t('already_have_account')}{' '}
          <a href="/auth/signin" className="text-blue-600 underline">
            {t('sign_in')}
          </a>
        </p>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const csrfToken = await getCsrfToken(ctx)
  const locale = ctx.locale ?? ctx.defaultLocale!
  return {
    props: {
      csrfToken,
      ...(await serverSideTranslations(locale, ['common']))
    }
  }
}
