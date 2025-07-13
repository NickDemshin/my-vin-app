// pages/index.tsx
import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Header from '../components/Header'

export default function Home() {
  const { t } = useTranslation('common')

  const [vin, setVin] = useState('')
  const [email, setEmail] = useState('')
  const [reportType, setReportType] = useState<'info'|'decode'|'stolen-check'>('decode')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userExists, setUserExists] = useState<boolean | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPdfUrl(null)
    setUserExists(null)

    if (!/^[A-Z0-9]{17}$/.test(vin)) {
      alert(t('invalid_vin'))
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert(t('invalid_email'))
      return
    }

    // проверка пользователя
    try {
      const resp = await fetch(`/api/users/exists?email=${encodeURIComponent(email)}`)
      const { exists } = await resp.json()
      setUserExists(exists)
    } catch {
      alert(t('check_email_error'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/check-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, email, reportType }),
      })
      if (res.ok) {
        const blob = await res.blob()
        setPdfUrl(URL.createObjectURL(blob))
      } else {
        const err = await res.json()
        alert(err.error || t('report_error'))
      }
    } catch {
      alert(t('network_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-100 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="pt-16 flex justify-center items-center py-12 px-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 w-full max-w-md bg-white/60 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-white/30"
        >
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            {t('title')}
          </h1>

          <input
            value={vin}
            onChange={e => setVin(e.target.value.toUpperCase())}
            placeholder={t('vin')}
            maxLength={17}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('email')}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
            required
          />

          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
          >
            <option value="info">{t('report_type_info')}</option>
            <option value="decode">{t('report_type_decode')}</option>
            <option value="stolen-check">{t('report_type_stolen')}</option>
          </select>

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow-md disabled:opacity-50"
          >
            {loading ? t('loading') : t('check_vin')}
          </button>

          {pdfUrl && (
            <div className="mt-4 text-center">
              <a
                href={pdfUrl}
                download={`vin-report-${vin}.pdf`}
                className="text-blue-700 hover:underline font-medium"
              >
                📄 {t('download_report')}
              </a>
            </div>
          )}

          {userExists === true && (
            <p className="mt-4 text-center text-green-800">
              {t('report_saved')}
            </p>
          )}
          {userExists === false && (
            <p className="mt-4 text-center text-red-800">
              {t('please_register')}{' '}
              <a href="/auth/signup" className="underline text-blue-600">
                {t('signup')}
              </a>
            </p>
          )}
        </form>
      </main>
    </div>
  )
}

// подгружаем переводы на этапе сборки
export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
