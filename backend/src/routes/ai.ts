import { Router, Request, Response } from 'express'
import { successResponse, errorResponse } from '../lib/validation/errors'
import { mastra } from '../lib/ai/mastra'

/**
 * AI Analysis Routes
 * Uses Mastra agents to analyze Instagram profiles with Groq Llama 3.3 70B
 */
export function createAIRoutes(): Router {
  const router = Router()

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
        console.log('✅ Mastra instance loaded with Groq configuration')
        console.log('🚀 Executing instagram-analysis-workflow...')

        // Get the workflow
        const workflow = mastra.workflows.instagramAnalysisWorkflow
        if (!workflow) {
          throw new Error('Instagram analysis workflow not found in Mastra instance')
        }

        // Execute the workflow
        const result = await workflow.execute({
          triggerData: {
            username: profileData.username,
            fullName: profileData.fullName,
            biography: profileData.biography,
            website: profileData.website,
            followerCount: profileData.followerCount,
            followingCount: profileData.followingCount,
            postCount: profileData.postCount,
            isBusinessAccount: profileData.isBusinessAccount,
            category: profileData.category,
            contactInfo: profileData.contactInfo,
            posts: profileData.posts,
          },
        })

        console.log(`✅ Analysis complete for @${profileData.username}`)

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
