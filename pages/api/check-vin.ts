// pages/api/check-vin.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jsPDF from 'jspdf'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { vin, email, reportType } = req.body

  try {
    // 🔹 Проверка: всё ли есть
    if (!vin || !email || !reportType) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const doc = new jsPDF()
    doc.text(`VIN Report`, 10, 10)
    doc.text(`VIN: ${vin}`, 10, 20)
    doc.text(`Email: ${email}`, 10, 30)
    doc.text(`Report Type: ${reportType}`, 10, 40)

    const pdf = doc.output('arraybuffer')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="vin-report-${vin}.pdf"`)
    res.send(Buffer.from(pdf))
  } catch (err: any) {
    console.error('PDF generation error:', err)
    res.status(500).json({ error: 'Failed to generate report', details: err.message })
  }
}
