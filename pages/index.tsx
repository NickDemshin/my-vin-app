import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import Header from '../components/Header'

export default function Home() {
  const { t } = useTranslation('common')

  const [vin, setVin] = useState('')
  const [email, setEmail] = useState('')
  const [reportType, setReportType] = useState('VIN Decode')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/check-vin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vin, email, reportType }),
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } else {
      alert('Ошибка генерации отчета')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-100 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex justify-center items-center py-12 px-4">
        <div className="w-full max-w-md bg-white/60 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-white/30">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 drop-shadow-md">
            {t('title')}
          </h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder={t('vin')}
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 placeholder-gray-500"
              required
            />
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 placeholder-gray-500"
              required
            />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 text-gray-700"
            >
              <option value="VIN Decode">VIN Decode</option>
              <option value="Stolen Check">Stolen Check</option>
            </select>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 shadow-md"
            >
              {t('check_vin')}
            </button>
          </form>

          {pdfUrl && (
            <div className="mt-6 text-center">
              <a
                href={pdfUrl}
                download={`vin-report-${vin}.pdf`}
                className="text-blue-700 hover:underline font-medium"
              >
                📄 Скачать PDF-отчёт
              </a>
              <p className="mt-2 text-gray-600 text-sm">
                Хотите сохранить отчёт?{' '}
                <a href="/auth/signup" className="text-blue-500 hover:underline">
                  Зарегистрируйтесь
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
