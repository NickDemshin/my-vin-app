// pages/dashboard.tsx
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Link from 'next/link'
import { useState } from 'react'

type R = {
  id: string
  vin: string
  type: string
  displayDate: string
}

export default function Dashboard({ reports: initialReports }: { reports: R[] }) {
  const { t } = useTranslation('common')
  const { data: session, status } = useSession()
  const [vin, setVin]                 = useState('')
  const [reportType, setReportType]   = useState<'info'|'decode'|'stolen-check'>('decode')
  const [pdfUrl, setPdfUrl]           = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [message, setMessage]         = useState<string | null>(null)
  const [reports, setReports]         = useState<R[]>(initialReports)

  if (status === 'loading') return <p>{t('loading')}</p>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPdfUrl(null)
    setMessage(null)

    if (!/^[A-Z0-9]{17}$/.test(vin)) {
      setMessage(t('invalid_vin'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/check-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, reportType })
      })
      if (!res.ok) {
        const err = await res.json()
        setMessage(err.error || t('report_error'))
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
        setMessage(t('report_saved'))
        // Добавим в список
        setReports(prev => [
          { id: 'new', vin, type: reportType, displayDate: new Date().toLocaleString('ru-RU') },
          ...prev
        ])
      }
    } catch {
      setMessage(t('network_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
          
        </div>
        <p>{t('logged_in_as')} <strong>{session?.user?.email}</strong></p>

        {/* Форма проверки VIN */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold">{t('check_vin')}</h2>
          <div className="flex gap-2">
            <input
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
              placeholder={t('vin')}
              maxLength={17}
              className="flex-1 px-4 py-2 border rounded"
              required
            />
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="px-4 py-2 border rounded"
            >
              <option value="info">{t('report_type_info')}</option>
              <option value="decode">{t('report_type_decode')}</option>
              <option value="stolen-check">{t('report_type_stolen')}</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? t('loading') : t('check_vin')}
            </button>
          </div>
          {pdfUrl && (
            <p>
              <a href={pdfUrl} download={`vin-report-${vin}.pdf`} className="text-blue-600 underline">
                📄 {t('download_report')}
              </a>
            </p>
          )}
          {message && <p className="mt-2 text-center">{message}</p>}
        </form>

        {/* Список прошлых отчётов */}
        {reports.length === 0 ? (
          <p>{t('no_reports')}</p>
        ) : (
          <ul className="space-y-4">
            {reports.map(r => (
              <li key={r.id} className="border p-4 rounded bg-gray-50">
                <p><strong>{t('vin')}:</strong> {r.vin}</p>
                <p><strong>{t('type')}:</strong> {r.type}</p>
                <p><strong>{t('date')}:</strong> {r.displayDate}</p>
                <Link href={`/api/check-vin?id=${r.id}`} className="text-blue-600 hover:underline">
                  📄 {t('download_pdf')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) {
    return { redirect: { destination: '/auth/signin?callbackUrl=/dashboard', permanent: false } }
  }

  const reps = await prisma.vinReport.findMany({
    where: { email: session.user.email },
    orderBy: { timestamp: 'desc' },
  })

  const reports = reps.map(r => ({
    id: r.id,
    vin: r.vin,
    type: r.type,
    displayDate: r.timestamp.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
  }))

  const locale = ctx.locale ?? ctx.defaultLocale ?? 'ru'
  return {
    props: {
      session,
      reports,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
