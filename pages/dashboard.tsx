// pages/dashboard.tsx
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Link from 'next/link'

type R = {
  id: string
  vin: string
  type: string
  displayDate: string
}

export default function Dashboard({ reports }: { reports: R[] }) {
  const { t } = useTranslation('common')
  const { data: session, status } = useSession()
  if (status === 'loading') return <p>{t('loading')}</p>

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        </div>
        <p className="mb-4">
          {t('logged_in_as')} <strong>{session?.user?.email}</strong>
        </p>

        {reports.length === 0 ? (
          <p>{t('no_reports')}</p>
        ) : (
          <ul className="space-y-4">
            {reports.map(r => (
              <li key={r.id} className="border p-4 rounded bg-gray-50">
                <p>
                  <strong>{t('vin')}:</strong> {r.vin}
                </p>
                <p>
                  <strong>{t('type')}:</strong> {r.type}
                </p>
                <p>
                  <strong>{t('date')}:</strong> {r.displayDate}
                </p>
                <Link
                  href={`/api/check-vin?id=${r.id}`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
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
    return { redirect: { destination: '/auth/signin', permanent: false } }
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
