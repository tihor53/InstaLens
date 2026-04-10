import { NextRequest, NextResponse } from 'next/server'
import { MastraOrchestrator } from '@/lib/ai/orchestrator'

interface AnalyzeRequest {
  profileData: {
    username: string
    fullName: string
    biography: string
    website?: string
    followerCount: number
    followingCount: number
    postCount: number
    isBusinessAccount: boolean
    category?: string
    contactInfo?: {
      email?: string
      phone?: string
      address?: string
    }
    posts?: Array<{
      caption: string
      hashtags: string[]
      mentions: string[]
      imageUrl?: string
      likes: number
      comments: number
      timestamp?: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()

    if (!body.profileData) {
      return NextResponse.json(
        { success: false, error: { message: 'Profile data is required' } },
        { status: 400 }
      )
    }

    console.log(`🔍 [/api/analyze] Starting AI analysis for @${body.profileData.username}`)
    console.log(`📊 [/api/analyze] Profile data received:`, {
      username: body.profileData.username,
      followers: body.profileData.followerCount,
      posts: body.profileData.posts?.length,
    })

    // Check if Groq API key is configured (for Mastra agents)
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      console.warn('⚠️ [/api/analyze] GROQ_API_KEY not configured')
      return NextResponse.json({
        success: true,
        data: {
          username: body.profileData.username,
          profileAnalysis: null,
          contentAnalysis: null,
          audienceInsights: null,
          structuredData: null,
        },
        timestamp: new Date().toISOString(),
        warning: 'AI analysis skipped: GROQ_API_KEY not configured. Using fallback data.',
      })
    }

    console.log('✅ [/api/analyze] GROQ_API_KEY is configured')

    try {
      // Initialize orchestrator and run analysis
      console.log('📋 [/api/analyze] Initializing MastraOrchestrator with Groq Llama 3.3 70B...')
      const orchestrator = new MastraOrchestrator()
      
      // Normalize profile data with defaults for optional fields
      const normalizedProfileData = {
        ...body.profileData,
        website: body.profileData.website || '',
        category: body.profileData.category || 'uncategorized',
        posts: (body.profileData.posts || []).map((post: any) => ({
          caption: post.caption || '',
          hashtags: post.hashtags || [],
          mentions: post.mentions || [],
          imageUrl: post.imageUrl || '', // Default to empty string if missing
          likes: post.likes || 0,
          comments: post.comments || 0,
          timestamp: post.timestamp ? new Date(post.timestamp) : new Date(), // Convert to Date or use current time
        })),
        contactInfo: body.profileData.contactInfo || { email: undefined, phone: undefined, address: undefined },
      }
      
      console.log('🚀 [/api/analyze] Calling orchestrator.analyzeProfile() to execute Mastra workflow...')
      const analysis = await orchestrator.analyzeProfile(normalizedProfileData)
      
      console.log(`✅ [/api/analyze] Analysis complete for @${body.profileData.username}`)
      console.log('📋 [/api/analyze] Analysis structure:', {
        hasProfileAnalysis: !!analysis.profileAnalysis,
        hasContentAnalysis: !!analysis.contentAnalysis,
        hasAudienceInsights: !!analysis.audienceInsights,
        hasStructuredData: !!analysis.structuredData,
      })

      return NextResponse.json({
        success: true,
        data: {
          username: body.profileData.username,
          profileAnalysis: analysis.profileAnalysis,
          contentAnalysis: analysis.contentAnalysis,
          audienceInsights: analysis.audienceInsights,
          structuredData: analysis.structuredData,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (orchError: any) {
      const errorMsg = orchError?.message || 'Unknown orchestrator error'
      const errorStack = orchError?.stack || ''
      
      console.error(`❌ [/api/analyze] Orchestrator error: ${errorMsg}`)
      console.error(`❌ [/api/analyze] Error stack:`, errorStack)
      console.error(`❌ [/api/analyze] Full error object:`, orchError)
      
      // Return partial success with fallback data instead of failing completely
      return NextResponse.json({
        success: true,
        data: {
          username: body.profileData.username,
          profileAnalysis: null,
          contentAnalysis: null,
          audienceInsights: null,
          structuredData: null,
        },
        timestamp: new Date().toISOString(),
        warning: `AI analysis encountered an error but fallback data will be used: ${errorMsg}`,
        debugInfo: process.env.NODE_ENV === 'development' ? {
          error: errorMsg,
          stack: errorStack,
        } : undefined,
      })
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error(`❌ [/api/analyze] Endpoint error: ${errorMsg}`)
    console.error(`❌ [/api/analyze] Full endpoint error:`, error)

    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMsg,
          details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        },
      },
      { status: 500 }
    )
  }
}
