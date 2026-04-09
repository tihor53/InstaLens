/**
 * POST /api/analyze-instagram
 * Scrapes Instagram profile and analyzes with Mastra AI agents
 * 
 * Request body:
 * {
 *   "username": "peppa_foodie"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "profile": { ... },
 *   "analysis": {
 *     "profileAnalysis": { ... },
 *     "contentAnalysis": { ... },
 *     "audienceAnalysis": { ... },
 *     "structuredData": { ... }
 *   },
 *   "timestamp": "2026-04-09T...",
 *   "processingTime": 5234
 * }
 */

import { NextRequest, NextResponse } from 'next/server'

// Import the scraper from backend
import { scrapeInstagramProfile } from '@/../../backend/scraper'

// Import Mastra workflow
import { instagramAnalysisWorkflow } from '@/instalensagent/src/mastra/workflows/instagram-analysis-workflow'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Validate request
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: username is required'
        },
        { status: 400 }
      )
    }

    // Step 1: Scrape Instagram profile
    console.log(`[1/2] Scraping Instagram profile: @${username}`)
    const scraperResult = await scrapeInstagramProfile(username)

    if (!scraperResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to scrape Instagram profile: ${scraperResult.error}`
        },
        { status: 400 }
      )
    }

    // Step 2: Analyze with Mastra agents
    console.log(`[2/2] Running Mastra AI agents on profile data...`)

    // Prepare input for Mastra workflow
    const agentInput = {
      profileData: {
        username: scraperResult.profile.username,
        fullName: scraperResult.profile.fullName,
        biography: scraperResult.profile.biography,
        followers: scraperResult.profile.followers,
        following: scraperResult.profile.following,
        profilePicUrl: scraperResult.profile.profilePicUrl,
        verified: scraperResult.profile.verified,
        externalUrl: scraperResult.profile.externalUrl
      },
      postData: scraperResult.posts.map((post) => ({
        caption: post.caption,
        timestamp: post.timestamp,
        likes: post.likes,
        comments: post.comments
      })),
      engagementMetrics: scraperResult.engagement,
      hashtags: scraperResult.hashtags.slice(0, 10),
      mentions: scraperResult.mentions.slice(0, 5)
    }

    // Execute Mastra workflow
    const analysisResult = await instagramAnalysisWorkflow.execute(agentInput)

    const processingTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        profile: scraperResult.profile,
        engagement: scraperResult.engagement,
        analysis: analysisResult,
        timestamp: new Date().toISOString(),
        processingTime: `${(processingTime / 1000).toFixed(2)}s`,
        totalPosts: scraperResult.posts.length,
        topHashtags: scraperResult.hashtags.slice(0, 5),
        topMentions: scraperResult.mentions.slice(0, 5)
      },
      { status: 200 }
    )
  } catch (error) {
    const processingTime = Date.now() - startTime

    console.error('API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        processingTime: `${(processingTime / 1000).toFixed(2)}s`
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/analyze-instagram',
    method: 'POST',
    body: {
      username: 'string (required)'
    },
    example: 'curl -X POST http://localhost:3000/api/analyze-instagram -H "Content-Type: application/json" -d \'{"username": "peppa_foodie"}\''
  })
}
