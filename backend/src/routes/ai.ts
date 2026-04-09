import { Router, Request, Response } from 'express'
import { successResponse, errorResponse } from '../lib/validation/errors'
import { setupMastra } from '../lib/ai/mastra'
import { analyzeInstagramProfile } from '../lib/ai/simple-analysis'

/**
 * AI Analysis Routes
 * Uses Mastra agents to analyze Instagram profiles with Groq Llama 3.3 70B
 */
export function createAIRoutes(): Router {
  const router = Router()

  // Track initialization state
  let mastraInitialized = false
  let mastraError: Error | null = null

  /**
   * POST /api/ai/analyze
   * Analyze Instagram profile data using Mastra AI agents with Groq
   * Runs on backend where DuckDB and native bindings are available
   */
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { profileData } = req.body

      if (!profileData || !profileData.username) {
        return res.status(400).json(
          errorResponse(400, 'Profile data with username is required', 'INVALID_INPUT')
        )
      }

      console.log(`🤖 [/api/ai/analyze] Analyzing @${profileData.username} with Mastra + Groq Llama 3.3 70B`)

      // Check if Groq API key is configured
      const groqKey = process.env.GROQ_API_KEY
      if (!groqKey) {
        console.warn('⚠️ GROQ_API_KEY not configured, returning fallback data')
        return res.status(200).json(
          successResponse({
            username: profileData.username,
            profileAnalysis: null,
            contentAnalysis: null,
            audienceInsights: null,
            structuredData: null,
            timestamp: new Date().toISOString(),
            warning: 'AI analysis skipped: GROQ_API_KEY not configured. Using fallback data.',
          })
        )
      }

      try {
        // Initialize Mastra if not already done
        if (!mastraInitialized && !mastraError) {
          try {
            console.log('🔧 Initializing Mastra (first request)...')
            await setupMastra()
            mastraInitialized = true
            console.log('✅ Mastra initialized successfully')
          } catch (initError: any) {
            mastraError = initError
            console.error('❌ Mastra initialization failed:', initError.message)
            throw initError
          }
        }

        if (mastraError) {
          throw new Error(`Mastra initialization failed: ${mastraError.message}`)
        }

        console.log('✅ Mastra instance ready with Groq configuration')
        console.log('🚀 Executing Instagram analysis (direct agent calls, no workflow)...')

        // Use simple direct analysis instead of complex workflow
        const result = await analyzeInstagramProfile(profileData)

        console.log(`✅ Analysis complete for @${profileData.username}`)
        console.log('📊 Profile Analysis:', result.profileAnalysis ? 'received' : 'fallback')
        console.log('📊 Content Analysis:', result.contentAnalysis ? 'received' : 'fallback')
        console.log('📊 Audience Analysis:', result.audienceInsights ? 'received' : 'fallback')

        return res.status(200).json(
          successResponse({
            username: profileData.username,
            profileAnalysis: result.profileAnalysis,
            contentAnalysis: result.contentAnalysis,
            audienceInsights: result.audienceAnalysis,
            structuredData: result.structuredData,
            timestamp: new Date().toISOString(),
          })
        )
      } catch (workflowError: any) {
        const errorMsg = workflowError?.message || 'Unknown workflow error'
        console.error(`❌ Mastra workflow error: ${errorMsg}`)
        console.error('Full error:', workflowError)
        console.error('Error stack:', workflowError?.stack)

        // Return success with warning instead of failing
        return res.status(200).json(
          successResponse({
            username: profileData.username,
            profileAnalysis: null,
            contentAnalysis: null,
            audienceInsights: null,
            structuredData: null,
            timestamp: new Date().toISOString(),
            warning: `AI analysis encountered an error but fallback data will be used: ${errorMsg}`,
          })
        )
      }
    } catch (error: any) {
      console.error('❌ [/api/ai/analyze] Unexpected error:', error)
      return res.status(500).json(
        errorResponse(500, error?.message || 'Analysis failed', 'AI_ANALYSIS_FAILED')
      )
    }
  })

  return router
}

export default createAIRoutes
