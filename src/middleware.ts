import { NextRequest, NextResponse } from 'next/server'

// Basic認証をスキップするパス
const PUBLIC_PATHS = [
  '/api/webhook',        // LINE Webhook
  '/api/steps/process',  // Cron Job
  '/api/forms/',         // フォーム送信API
  '/forms/',             // 公開フォームページ
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 公開パスはスキップ
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Basic認証チェック
  const authHeader = req.headers.get('authorization')

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded)
      const [user, pass] = decoded.split(':')

      const validUser = process.env.BASIC_AUTH_USER || 'admin'
      const validPass = process.env.BASIC_AUTH_PASSWORD || ''

      if (user === validUser && pass === validPass) {
        return NextResponse.next()
      }
    }
  }

  // 認証失敗 → 401を返す
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="LINE CRM Admin"',
    },
  })
}

export const config = {
  matcher: [
    /*
     * 以下を除外:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
