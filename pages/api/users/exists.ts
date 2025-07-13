// pages/api/users/exists.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { email } = req.query
  if (typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  return res.status(200).json({ exists: Boolean(user) })
}
