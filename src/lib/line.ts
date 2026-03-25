import { Client } from '@line/bot-sdk'

if (!process.env.LINE_CHANNEL_SECRET) {
  throw new Error('LINE_CHANNEL_SECRET is required')
}

if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  throw new Error('LINE_CHANNEL_ACCESS_TOKEN is required')
}

export const line = new Client({
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
})
