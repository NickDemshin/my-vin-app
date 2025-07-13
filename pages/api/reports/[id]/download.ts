import { prisma } from '../../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import jsPDF from 'jspdf'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) return res.status(401).end()

  const report = await prisma.vinReport.findUnique({
    where: { id: req.query.id as string },
  })

  if (!report) return res.status(404).end()

  const doc = new jsPDF()
  doc.text(`VIN Report`, 10, 10)
  doc.text(`VIN: ${report.vin}`, 10, 20)
  doc.text(`Type: ${report.type}`, 10, 30)
  doc.text(`Created: ${new Date(report.timestamp).toLocaleString()}`, 10, 40)

  const pdf = doc.output('arraybuffer')
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="vin-${report.vin}.pdf"`)
  res.send(Buffer.from(pdf))
}
