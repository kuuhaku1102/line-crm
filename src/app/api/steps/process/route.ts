import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lineClient } from '@/lib/line'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  try {
    // Get all active user sequences
    const userSequences = await prisma.userStepSequence.findMany({
      where: { isActive: true },
      include: {
        user: true,
        sequence: {
          include: {
            steps: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    let processedCount = 0
    const now = new Date()

    for (const userSeq of userSequences) {
      const steps = userSeq.sequence.steps
      if (steps.length === 0) continue

      // Calculate elapsed days since enrollment
      const startDate = new Date(userSeq.startedAt)
      const elapsedDays = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Find the next message to send
      const currentStepIndex = userSeq.currentStep
      if (currentStepIndex >= steps.length) {
        // Sequence completed
        await prisma.userStepSequence.update({
          where: { id: userSeq.id },
          data: {
            isActive: false,
            completedAt: now,
          },
        })
        continue
      }

      const currentStep = steps[currentStepIndex]
      const currentHour = now.getHours()

      // Check if it's time to send this message
      if (
        elapsedDays >= currentStep.dayOffset &&
        currentHour === currentStep.hour
      ) {
        // Send message
        try {
          const message: any = currentStep.messageType === 'flex'
            ? {
                type: 'flex',
                altText: currentStep.title,
                contents: JSON.parse(currentStep.content),
              }
            : {
                type: 'text',
                text: currentStep.content,
              }

          await lineClient.pushMessage({
            to: userSeq.user.lineUserId,
            messages: [message],
          })

          console.log(
            'Sent step message to',
            userSeq.user.lineUserId,
            'step:',
            currentStepIndex
          )

          // Update progress
          await prisma.userStepSequence.update({
            where: { id: userSeq.id },
            data: { currentStep: currentStepIndex + 1 },
          })

          processedCount++
        } catch (error) {
          console.error(
            'Failed to send message to',
            userSeq.user.lineUserId,
            error
          )
        }
      }
    }

    return NextResponse.json({
      message: 'Step processing completed',
      processedCount,
    })
  } catch (error) {
    console.error('Error processing steps:', error)
    return NextResponse.json(
      { error: 'Failed to process steps' },
      { status: 500 }
    )
  }
}
