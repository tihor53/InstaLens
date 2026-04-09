import { NextRequest, NextResponse } from 'next/server'
import { IntegrationManager, IntegrationTarget } from '@/lib/integrations/manager'

interface PushRequest {
  analysisData: any
  integrationTargets: IntegrationTarget[]
  credentials: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: PushRequest = await request.json()

    if (!body.analysisData) {
      return NextResponse.json(
        { error: 'Analysis data is required' },
        { status: 400 }
      )
    }

    if (!body.integrationTargets || body.integrationTargets.length === 0) {
      return NextResponse.json(
        { error: 'At least one integration target is required' },
        { status: 400 }
      )
    }

    if (!body.credentials) {
      return NextResponse.json(
        { error: 'Integration credentials are required' },
        { status: 400 }
      )
    }

    console.log(
      `📤 Pushing data to integrations: ${body.integrationTargets.join(', ')}`
    )

    // Initialize integration manager and push to targets
    const manager = new IntegrationManager()

    // Validate credentials for each target
    const invalidTargets: string[] = []
    for (const target of body.integrationTargets) {
      const config = body.credentials[target]
      if (!config || !manager.validateCredentials(target, config)) {
        invalidTargets.push(target)
      }
    }

    if (invalidTargets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid credentials for some integrations',
            invalidTargets,
          },
        },
        { status: 400 }
      )
    }

    // Push to all integrations with the complete analysis data
    const results = await manager.pushToIntegrations(
      body.analysisData,
      body.integrationTargets,
      body.credentials
    )

    console.log(`✅ Integration push complete`)

    return NextResponse.json({
      success: true,
      data: {
        results,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Integration push failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Integration push failed',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    )
  }
}
