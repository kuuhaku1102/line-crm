import { NextRequest, NextResponse } from 'next/server'

// Basic認証をスキップするパス
const PUBLIC_PATHS = [
  '/api/webhook',        // LINE Webhook
  '/api/steps/process',  // Cron Job
  '/api/forms/',         // フォーム送信API
  '/forms/',             // 公開フォームページ
]

function decodeBase64(str: string): string {
  try {
    // Edge Runtime対応
    const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 公開パスはスキップ
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Basic認証チェック
  const authHeader = req.headers.get('authorization')

  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts[0] === 'Basic' && parts[1]) {
      const decoded = decodeBase64(parts[1])
      // コロンで分割（最初のコロンのみ。パスワードにコロンが含まれるケース対応）
      const colonIndex = decoded.indexOf(':')
      if (colonIndex > -1) {
        const user = decoded.substring(0, colonIndex)
        const pass = decoded.substring(colonIndex + 1)

        const validUser = process.env.BASIC_AUTH_USER || 'admin'
        const validPass = process.env.BASIC_AUTH_PASSWORD || 'line@blank'

        if (user === validUser && pass === validPass) {
          return NextResponse.next()
        }
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
