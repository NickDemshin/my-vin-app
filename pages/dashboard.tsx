import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { useSession, signOut } from 'next-auth/react'

type R = { id:string; vin:string; type:string; displayDate: string }

export default function Dashboard({ reports }: { reports:R[] }) {
  const { data: session, status } = useSession()
  if (status==='loading') return <p>Загрузка…</p>

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <button onClick={()=>signOut({callbackUrl:'/'})}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Выйти
          </button>
        </div>
        <p className="mb-4">Вы вошли как <strong>{session?.user?.email}</strong></p>

        {reports.length===0
          ? <p>У вас пока нет VIN-отчётов.</p>
          : <ul className="space-y-4">
            {reports.map(r=>(
              <li key={r.id} className="border p-4 rounded bg-gray-50">
                <p><strong>VIN:</strong> {r.vin}</p>
                <p><strong>Тип:</strong> {r.type}</p>
                <p><strong>Дата:</strong> {r.displayDate}</p>
                <a href={`/api/check-vin?id=${r.id}`}
                  className="text-blue-600 hover:underline mt-2 inline-block">
                  📄 Скачать PDF
                </a>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const session = await getServerSession(ctx.req,ctx.res,authOptions)
  if(!session?.user?.email){
    return { redirect:{ destination:'/auth/signin', permanent:false } }
  }
  const reps = await prisma.vinReport.findMany({
    where:{ email: session.user.email },
    orderBy:{ timestamp:'desc' }
  })
  return {
    props:{ session,
       reports: reps.map(r=>({
      id:r.id, vin:r.vin, type:r.type, timestamp:r.timestamp.toISOString()
    })) }
  }
}
