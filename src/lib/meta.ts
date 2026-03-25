import crypto from 'crypto'

interface UserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface CustomData {
  value?: number
  currency?: string
  contentName?: string
  contentType?: string
  contentId?: string
}

function hashData(data: string | undefined): string | undefined {
  if (!data) return undefined
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex')
}

function hashUserData(userData: UserData): any {
  return {
    ...(userData.email && { em: hashData(userData.email) }),
    ...(userData.phone && { ph: hashData(userData.phone) }),
    ...(userData.firstName && { fn: hashData(userData.firstName) }),
    ...(userData.lastName && { ln: hashData(userData.lastName) }),
    ...(userData.city && { ct: hashData(userData.city) }),
    ...(userData.state && { st: hashData(userData.state) }),
    ...(userData.zipCode && { zp: hashData(userData.zipCode) }),
    ...(userData.country && { country: hashData(userData.country) }),
  }
}

export async function sendConversion(
  eventName: string,
  userData: UserData,
  customData?: CustomData
): Promise<boolean> {
  try {
    const pixelId = process.env.META_PIXEL_ID
    const accessToken = process.env.META_ACCESS_TOKEN

    if (!pixelId || !accessToken) {
      console.log('Meta CAPI credentials not configured')
      return false
    }

    const eventTime = Math.floor(Date.now() / 1000)
    const hashedUserData = hashUserData(userData)

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          user_data: hashedUserData,
          ...(customData && { custom_data: customData }),
        },
      ],
      access_token: accessToken,
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()

    if (response.ok) {
      console.log('Meta CAPI event sent:', eventName, result)
      return true
    } else {
      console.error('Meta CAPI error:', result)
      return false
    }
  } catch (error) {
    console.error('Meta CAPI request failed:', error)
    return false
  }
}
