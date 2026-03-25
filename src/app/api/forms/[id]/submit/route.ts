import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendConversion } from '@/lib/meta'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { userId, data } = body

    if (!userId || !data) {
      return NextResponse.json(
        { error: 'userId and data are required' },
        { status: 400 }
      )
    }

    // Create form submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: params.id,
        userId,
        data: JSON.stringify(data),
      },
    })

    // Add scoring for form submission
    const scoringRules = await prisma.scoringRule.findMany({
      where: {
        isActive: true,
        eventType: 'form_submit',
      },
    })

    let scoreToAdd = 0
    for (const rule of scoringRules) {
      scoreToAdd += rule.points
    }

    if (scoreToAdd > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { score: { increment: scoreToAdd } },
      })
    }

    // Send to Meta CAPI
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineUserId: true },
    })

    if (user) {
      await sendConversion('Lead', {
        email: data.email || undefined,
        phone: data.phone || undefined,
      })
    }

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
