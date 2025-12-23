import type { NextApiRequest, NextApiResponse } from 'next'

interface TestResult {
  domain: string
  blocked: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResult>
) {
  return res.status(200).json({
    domain: req.body?.domain || '',
    blocked: false,
    error: 'Use client-side testing instead'
  })
}

