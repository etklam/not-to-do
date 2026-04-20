export function getPublicOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')

  const host = (forwardedHost || hostHeader || '').split(',')[0].trim()
  const proto = (forwardedProto || '').split(',')[0].trim()

  if (host) {
    const safeProto = proto === 'http' || proto === 'https' ? proto : null
    if (safeProto) return `${safeProto}://${host}`
    return `${new URL(request.url).protocol}//${host}`
  }

  return new URL(request.url).origin
}
