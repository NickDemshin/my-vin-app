// pages/api/check-vin.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { createHash } from 'crypto'
import jsPDF from 'jspdf'
import { prisma } from '../../lib/prisma'

const API_VERSION = '3.2'
const API_BASE    = `https://api.vindecoder.eu/${API_VERSION}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 0) Проверяем сессию
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const userEmail = session.user.email

  // 1) GET — скачивание существующего отчёта
  if (req.method === 'GET') {
    const id = typeof req.query.id === 'string' ? req.query.id : undefined
    if (!id) {
      return res.status(400).json({ error: 'Report ID required' })
    }

    // Достаём отчёт и проверяем владельца
    const report = await prisma.vinReport.findUnique({
      where: { id },
      select: { id: true, vin: true, type: true, data: true, timestamp: true, email: true }
    })
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }
    if (report.email !== userEmail) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Формируем PDF
    const jsonData = (report.data ?? {}) as any
    const results: any[] = Array.isArray(jsonData.Results)
      ? jsonData.Results
      : Array.isArray(jsonData.decode)
      ? jsonData.decode
      : []

    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('VIN Report', 10, 10)
      doc.setFontSize(12)
      doc.text(`VIN: ${report.vin}`, 10, 20)
      doc.text(`Type: ${report.type}`, 10, 28)
      doc.text(`Date: ${new Date(report.timestamp).toLocaleString()}`, 10, 36)

      let y = 45
      for (const item of results) {
        const label = item.Variable || item.label
        const value = item.Value    || item.value
        if (label && value != null) {
          doc.text(`${label}: ${value}`, 10, y)
          y += 7
          if (y > 280) {
            doc.addPage()
            y = 20
          }
        }
      }

      const pdfBuf = doc.output('arraybuffer')
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="vin-report-${report.vin}.pdf"`
      )
      return res.send(Buffer.from(pdfBuf))
    } catch (e: any) {
      console.error('PDF generation error:', e)
      return res.status(500).json({ error: 'PDF generation failed', details: e.message })
    }
  }

  // 2) POST — создание нового отчёта и сразу PDF
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Берём только vin и reportType из тела
  const { vin: rawVin, reportType = 'decode' } = req.body as {
    vin: string
    reportType?: 'info'|'decode'|'stolen-check'|'vehicle-market-value'|'oem'
  }

  // Валидация VIN
  const vin = rawVin.trim().toUpperCase()
  if (!/^[A-Z0-9]{17}$/.test(vin)) {
    return res.status(400).json({ error: 'VIN must be 17 chars A–Z0–9' })
  }
  const valid = ['info','decode','stolen-check','vehicle-market-value','oem']
  if (!valid.includes(reportType)) {
    return res.status(400).json({ error: 'Invalid reportType' })
  }

  // Запрос к внешнему API
  const toHash  = `${vin}|${reportType}|${process.env.VINDECODER_API_KEY}|${process.env.VINDECODER_SECRET_KEY}`
  const control = createHash('sha1').update(toHash).digest('hex').slice(0, 10)
  const pathSeg = reportType === 'decode'
    ? `decode/${vin}.json`
    : `decode/${reportType}/${vin}.json`
  const url = `${API_BASE}/${process.env.VINDECODER_API_KEY}/${control}/${pathSeg}`

  let jsonData: any
  try {
    const apiRes = await fetch(url, { headers: { Accept: 'application/json' } })
    const text   = await apiRes.text()
    if (!apiRes.ok) {
      return res.status(502).json({ error: 'VIN API error', details: text })
    }
    jsonData = JSON.parse(text)
  } catch (e: any) {
    console.error('Fetch error:', e)
    return res.status(500).json({ error: 'Fetch failed', details: e.message })
  }

  // Сохраняем в БД, привязываем к текущему пользователю
  try {
    await prisma.vinReport.create({
      data: {
        vin,
        type: `vindecoder.eu (${reportType})`,
        data: jsonData,
        email: userEmail,
      }
    })
  } catch (e) {
    console.warn('DB save warning:', e)
  }

  // Генерация PDF
  try {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('VIN Report', 10, 10)
    doc.setFontSize(12)
    doc.text(`VIN: ${vin}`, 10, 20)
    doc.text(`Email: ${userEmail}`, 10, 28)
    doc.text(`Type: ${reportType}`, 10, 36)
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 44)

    const results: any[] = Array.isArray(jsonData.Results)
      ? jsonData.Results
      : Array.isArray(jsonData.decode)
      ? jsonData.decode
      : []

    let y = 55
    for (const item of results) {
      const label = item.Variable || item.label
      const value = item.Value    || item.value
      if (label && value != null) {
        doc.text(`${label}: ${value}`, 10, y)
        y += 7
        if (y > 280) { doc.addPage(); y = 20 }
      }
    }

    const pdfBuf = doc.output('arraybuffer')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vin-report-${vin}.pdf"`
    )
    return res.send(Buffer.from(pdfBuf))
  } catch (e: any) {
    console.error('PDF gen error:', e)
    return res.status(500).json({ error: 'PDF failed', details: e.message })
  }
}
