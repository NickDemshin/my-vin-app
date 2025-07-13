import type { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'
import jsPDF from 'jspdf'
import { prisma } from '../../lib/prisma'

const API_VERSION = '3.2'
const API_BASE    = `https://api.vindecoder.eu/${API_VERSION}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: скачивание уже сохранённого отчёта
  if (req.method === 'GET') {
    const id = typeof req.query.id === 'string' ? req.query.id : undefined
    if (!id) {
      return res.status(400).json({ error: 'Report ID required' })
    }

    const report = await prisma.vinReport.findUnique({ where: { id } })
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    // Приводим к any, чтобы TS не ругался на поля Results/decode
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

      const pdfBuffer = doc.output('arraybuffer')
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="vin-report-${report.vin}.pdf"`
      )
      return res.send(Buffer.from(pdfBuffer))
    } catch (err: any) {
      console.error('PDF gen error:', err)
      return res
        .status(500)
        .json({ error: 'PDF generation failed', details: err.message })
    }
  }

  // POST: создание нового отчёта + сразу PDF
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { vin: rawVin, email, reportType = 'decode' } = req.body as {
    vin: string
    email: string
    reportType?: 'info' | 'decode' | 'stolen-check' | 'vehicle-market-value' | 'oem'
  }

  // 1) Валидация
  const vin = rawVin.trim().toUpperCase()
  if (!/^[A-Z0-9]{17}$/.test(vin)) {
    return res.status(400).json({ error: 'VIN must be 17 chars A–Z0–9' })
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  const valid = ['info','decode','stolen-check','vehicle-market-value','oem']
  if (!valid.includes(reportType)) {
    return res.status(400).json({ error: 'Invalid reportType' })
  }

  // 2) Запрос к VIN API
  const toHash  = `${vin}|${reportType}|${process.env.VINDECODER_API_KEY}|${process.env.VINDECODER_SECRET_KEY}`
  const control = createHash('sha1').update(toHash).digest('hex').slice(0, 10)
  const pathSeg = reportType === 'decode'
    ? `decode/${vin}.json`
    : `decode/${reportType}/${vin}.json`
  const url = `${API_BASE}/${process.env.VINDECODER_API_KEY}/${control}/${pathSeg}`
  console.log('VIN API URL:', url)

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

  // 3) Сохранение в БД
  let report
  try {
    report = await prisma.vinReport.create({
      data: { vin, type: `vindecoder.eu (${reportType})`, data: jsonData, email }
    })
  } catch (e) {
    console.warn('DB save warning:', e)
  }

  // 4) Генерация PDF
  const dataForPdf = (jsonData ?? {}) as any
  const pdfResults: any[] = Array.isArray(dataForPdf.Results)
    ? dataForPdf.Results
    : Array.isArray(dataForPdf.decode)
    ? dataForPdf.decode
    : []

  try {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('VIN Report', 10, 10)
    doc.setFontSize(12)
    doc.text(`VIN: ${vin}`, 10, 20)
    doc.text(`Email: ${email}`, 10, 28)
    doc.text(`Type: ${reportType}`, 10, 36)
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 44)

    let y = 55
    for (const item of pdfResults) {
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
      `attachment; filename="vin-report-${vin}.pdf"`
    )
    return res.send(Buffer.from(pdfBuf))
  } catch (e: any) {
    console.error('PDF gen error:', e)
    return res.status(500).json({ error: 'PDF failed', details: e.message })
  }
}
