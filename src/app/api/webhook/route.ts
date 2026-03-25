import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { lineClient } from '@/lib/line'
import { sendConversion } from '@/lib/meta'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

function verifySignature(body: string, secret: string, signature: string): boolean {
  if (!secret || !signature) return false
  try {
    const hash = createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64')
    const hashBuffer = Buffer.from(hash, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (hashBuffer.length !== signatureBuffer.length) return false
    return timingSafeEqual(hashBuffer, signatureBuffer)
  } catch {
    return false
  }
}

// POST handler for webhook
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-line-signature') || ''
    const body = await req.text()
    const channelSecret = process.env.LINE_CHANNEL_SECRET || ''

    // Verify LINE signature
    if (channelSecret) {
      const isValid = verifySignature(body, channelSecret, signature)
      if (!isValid) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
    }

    // Parse body - handle empty body for verification requests
    let events = []
    try {
      const parsed = JSON.parse(body)
      events = parsed.events || []
    } catch {
      return NextResponse.json({ message: 'OK' })
    }

    // LINE verification request sends empty events array - return 200
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ message: 'OK' })
    }

    // Process events
    for (const event of events) {
      try {
        await handleEvent(event)
      } catch (error) {
        console.error('Error handling event:', error)
      }
    }

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ message: 'OK' })
  }
}

async function handleEvent(event: any) {
  const userId = event.source?.userId
  if (!userId) return

  switch (event.type) {
    case 'follow':
      await handleFollow(userId, event)
      break
    case 'unfollow':
      await handleUnfollow(userId)
      break
    case 'message':
      await handleMessage(userId, event)
      break
    default:
      console.log('Unknown event type:', event.type)
  }
}

async function handleFollow(lineUserId: string, event: any) {
  try {
    // Get user profile from LINE
    let displayName = null
    let pictureUrl = null
    let statusMessage = null
    try {
      const profile = await lineClient.getProfile(lineUserId)
      displayName = profile.displayName
      pictureUrl = profile.pictureUrl || null
      statusMessage = profile.statusMessage || null
    } catch (e) {
      console.error('Failed to get profile:', e)
    }

    // Extract source from ref parameter if present
    let source: string | null = null
    if (event.replyToken) {
      // Source can be extracted from context if available
      source = event.source?.source || null
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { lineUserId },
      update: {
        displayName,
        pictureUrl,
        statusMessage,
        unfollowedAt: null,
        isBlocked: false,
        source: source || undefined,
      },
      create: {
        lineUserId,
        displayName,
        pictureUrl,
        statusMessage,
        source,
      },
    })

    // Send to Meta CAPI
    await sendConversion('Subscribe', {
      email: undefined,
    })

    console.log('User followed:', lineUserId, displayName)
  } catch (error) {
    console.error('handleFollow error:', error)
  }
}

async function handleUnfollow(lineUserId: string) {
  try {
    await prisma.user.update({
      where: { lineUserId },
      data: { unfollowedAt: new Date() },
    })
    console.log('User unfollowed:', lineUserId)
  } catch (error) {
    console.error('handleUnfollow error:', error)
  }
}

async function handleMessage(lineUserId: string, event: any) {
  try {
    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { lineUserId },
      update: { updatedAt: new Date() },
      create: { lineUserId },
    })

    const messageType = event.message?.type || 'unknown'
    const messageText = event.message?.text || ''
    console.log('Message from', lineUserId, ':', messageType, messageText.substring(0, 50))

    // Save incoming message to ChatLog
    await prisma.chatLog.create({
      data: {
        lineUserId,
        direction: 'INCOMING',
        messageType,
        content: messageType === 'text' ? messageText : JSON.stringify(event.message),
      },
    })

    // Auto-tag based on keywords
    if (messageType === 'text' && messageText) {
      const rules = await prisma.autoTagRule.findMany({
        where: { isActive: true },
      })

      for (const rule of rules) {
        if (messageText.includes(rule.keyword)) {
          // Check if user already has this tag
          const existingTag = await prisma.userTag.findUnique({
            where: {
              userId_tagId: {
                userId: user.id,
                tagId: rule.tagId,
              },
            },
          })

          if (!existingTag) {
            await prisma.userTag.create({
              data: {
                userId: user.id,
                tagId: rule.tagId,
              },
            })
            console.log('Auto-tagged user:', user.id, 'with tag:', rule.tagId)
          }
        }
      }

      // Apply scoring rules
      const scoringRules = await prisma.scoringRule.findMany({
        where: {
          isActive: true,
          eventType: 'message_sent',
        },
      })

      let scoreToAdd = 0
      for (const rule of scoringRules) {
        if (!rule.eventValue || messageText.includes(rule.eventValue)) {
          scoreToAdd += rule.points
        }
      }

      if (scoreToAdd > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { score: { increment: scoreToAdd } },
        })
        console.log('Added score:', scoreToAdd, 'to user:', user.id)
      }

      // Check scenario triggers
      const scenarios = await prisma.scenario.findMany({
        where: {
          isActive: true,
          triggerType: 'keyword',
        },
      })

      for (const scenario of scenarios) {
        if (scenario.triggerValue && messageText.includes(scenario.triggerValue)) {
          // Execute scenario actions
          const actions = await prisma.scenarioAction.findMany({
            where: { scenarioId: scenario.id },
            orderBy: { sortOrder: 'asc' },
          })

          for (const action of actions) {
            await executeScenarioAction(user.id, action, lineUserId)
          }
          console.log('Executed scenario:', scenario.id, 'for user:', user.id)
        }
      }
    }

    // Auto-reply with echo (simple for now)
    if (messageType === 'text' && messageText) {
      try {
        const replyText = `受信しました: ${messageText}`
        await lineClient.replyMessage({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: replyText,
          }],
        })

        // Save outgoing reply to ChatLog
        await prisma.chatLog.create({
          data: {
            lineUserId,
            direction: 'OUTGOING',
            messageType: 'text',
            content: replyText,
          },
        })
      } catch (e) {
        console.error('Reply failed:', e)
      }
    }
  } catch (error) {
    console.error('handleMessage error:', error)
  }
}

async function executeScenarioAction(userId: string, action: any, lineUserId: string) {
  try {
    switch (action.actionType) {
      case 'send_message':
        const messageData = JSON.parse(action.actionValue)
        await lineClient.pushMessage({
          to: lineUserId,
          messages: [messageData],
        })
        break

      case 'add_tag':
        const tagName = action.actionValue
        const tag = await prisma.tag.findUnique({
          where: { name: tagName },
        })
        if (tag) {
          await prisma.userTag.create({
            data: {
              userId,
              tagId: tag.id,
            },
          }).catch(() => {
            // Already has tag
          })
        }
        break

      case 'add_score':
        const points = parseInt(action.actionValue)
        await prisma.user.update({
          where: { id: userId },
          data: { score: { increment: points } },
        })
        break

      case 'start_sequence':
        const sequenceId = action.actionValue
        await prisma.userStepSequence.create({
          data: {
            userId,
            sequenceId,
          },
        }).catch(() => {
          // Already enrolled
        })
        break

      default:
        console.log('Unknown action type:', action.actionType)
    }
  } catch (error) {
    console.error('Error executing scenario action:', error)
  }
}

// Health check endpoint
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
