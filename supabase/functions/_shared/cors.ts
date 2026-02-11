const ALLOWED_ORIGINS = [
  'https://casskai.app',
  'https://www.casskai.app',
  'https://staging.casskai.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : 'https://casskai.app'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, stripe-signature',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  }
}

export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(request) })
  }
  return null
}
