// pages/api/check-vin.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'
import jsPDF from 'jspdf'
import { prisma } from '../../lib/prisma'

const API_VERSION = '3.2'
const API_BASE    = `https://api.vindecoder.eu/${API_VERSION}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
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
    return res.status(400).json({ error: 'VIN должен быть ровно 17 символов (A–Z, 0–9).' })
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Неверный формат e-mail.' })
  }
  const validTypes = ['info','decode','stolen-check','vehicle-market-value','oem']
  if (!validTypes.includes(reportType)) {
    return res.status(400).json({ error: 'Неподдерживаемый reportType.' })
  }

  // 2) Контрольная сумма
  const toHash   = `${vin}|${reportType}|${process.env.VINDECODER_API_KEY}|${process.env.VINDECODER_SECRET_KEY}`
  const fullHash = createHash('sha1').update(toHash).digest('hex')
  const control  = fullHash.substring(0, 10)

  // 3) Формируем путь
  // Для полного Decode: decode/VIN.json
  // Для остальных:       decode/{reportType}/VIN.json
  const pathSegment = reportType === 'decode'
    ? `decode/${vin}.json`
    : `decode/${reportType}/${vin}.json`
  const url = `${API_BASE}/${process.env.VINDECODER_API_KEY}/${control}/${pathSegment}`

  console.log('🔗 VIN API URL:', url)

  // 4) Запрос к VIN-сервису
  let jsonData: any
  try {
    const apiRes = await fetch(url, { headers: { Accept: 'application/json' } })
    const text   = await apiRes.text()
    console.log('🛰 VIN API status:', apiRes.status)
    console.log('🛰 VIN API response:', text.slice(0, 300) + '…')
    if (!apiRes.ok) {
      return res.status(502).json({ error: 'Bad response from VIN service', details: text })
    }
    jsonData = JSON.parse(text)
  } catch (err: any) {
    console.error('❌ Fetch error:', err)
    return res.status(500).json({ error: 'Fetch failed', details: err.message })
  }

  // 5) (Опционально) Сохранение в БД
  try {
    await prisma.vinReport.create({
      data: {
        vin,
        type: `vindecoder.eu (${reportType})`,
        data: jsonData,
        email,
      },
    })
  } catch (e) {
    console.warn('⚠️ DB save warning:', e)
  }

  // 6) Генерация PDF
  try {
    const doc     = new jsPDF()
    const results = jsonData.Results || jsonData.decode || []

    doc.setFontSize(16)
    doc.text('VIN Report', 10, 10)
    doc.setFontSize(12)
    doc.text(`VIN: ${vin}`, 10, 20)
    doc.text(`Email: ${email}`, 10, 28)
    doc.text(`Type: ${reportType}`, 10, 36)
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 44)

    let y = 55
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
    res.setHeader('Content-Disposition', `attachment; filename="vin-report-${vin}.pdf"`)
    return res.send(Buffer.from(pdfBuffer))
  } catch (err: any) {
    console.error('❌ PDF generation error:', err)
    return res.status(500).json({ error: 'PDF failed', details: err.message })
  }
}
