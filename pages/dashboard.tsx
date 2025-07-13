import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { useSession, signOut } from 'next-auth/react'

export default function Dashboard({ reports }: { reports: any[] }) {
  const { data: session, status } = useSession()

  // пока идёт загрузка сессии — показываем заглушку
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Загрузка…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Выйти
          </button>
        </div>
        <p className="mb-4">
          Вы вошли как{' '}
          <strong>
            {session?.user?.email ?? 'неизвестный пользователь'}
          </strong>
        </p>

        {reports.length === 0 ? (
          <p>У вас пока нет VIN-отчётов.</p>
        ) : (
          <ul className="space-y-4">
            {reports.map((report) => (
              <li
                key={report.id}
                className="border p-4 rounded bg-gray-50"
              >
                <p>
                  <strong>VIN:</strong> {report.vin}
                </p>
                <p>
                  <strong>Тип:</strong> {report.type}
                </p>
                <p>
                  <strong>Дата:</strong>{' '}
                  {new Date(report.timestamp).toLocaleString()}
                </p>
                <a
                  href={`/api/reports/${report.id}/download`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  📄 Скачать PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  )
  if (!session?.user?.email) {
    return {
      redirect: { destination: '/auth/signin', permanent: false },
    }
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { reports: { include: { report: true } } },
  })
  return {
    props: {
      session,
      reports: user?.reports.map((r) => r.report) || [],
    },
  }
}
