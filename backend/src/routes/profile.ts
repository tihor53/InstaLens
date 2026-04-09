import { Router, Request, Response } from 'express'
import { ApifyInstagramClient, extractHashtags, extractMentions, calculateEngagement } from '../lib/apify/client'
import { successResponse, errorResponse } from '../lib/validation/errors'

export function createProfileRoutes(): Router {
  const router = Router()

  // Initialize Apify client
  const apifyApiToken = process.env.APIFY_API_TOKEN
  const apifyActorId = process.env.APIFY_ACTOR_ID
  const apifyDatasetId = process.env.APIFY_DATASET_ID

  if (!apifyApiToken || !apifyActorId || !apifyDatasetId) {
    console.error('❌ Apify credentials not configured in .env')
    console.error('   Required: APIFY_API_TOKEN, APIFY_ACTOR_ID, APIFY_DATASET_ID')
  }

  /**
   * POST /api/profile/analyze
   * Scrape and analyze an Instagram profile using Apify
   */
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { username } = req.body

      if (!username) {
        return res.status(400).json(
          errorResponse(400, 'Username is required in request body', 'INVALID_INPUT')
        )
      }

      if (!apifyApiToken || !apifyActorId || !apifyDatasetId) {
        return res.status(500).json(
          errorResponse(500, 'Apify credentials not configured', 'APIFY_NOT_CONFIGURED')
        )
      }

      console.log(`📸 Analyzing Instagram profile: @${username}`)

      // Initialize Apify client with proper API token and dataset ID
      const apifyClient = new ApifyInstagramClient({
        apiToken: apifyApiToken,
        actorId: apifyActorId,
        datasetId: apifyDatasetId
      })

      // Scrape the Instagram profile
      const posts = await apifyClient.scrapeAndWait(username, 12)

      if (!posts || posts.length === 0) {
        return res.status(404).json(
          errorResponse(404, 'No posts found for this Instagram profile', 'PROFILE_NOT_FOUND')
        )
      }

      // Extract insights
      const hashtags = extractHashtags(posts)
      const mentions = extractMentions(posts)
      const engagement = calculateEngagement(posts)

      // Get profile info from first post
      const profileInfo = posts[0]

      // Top hashtags
      const topHashtags = Array.from(hashtags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }))

      // Top mentions
      const topMentions = Array.from(mentions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([mention, count]) => ({ mention, count }))

      // Build response
      const responseData = {
        profile: {
          username: profileInfo.ownerUsername || username,
          name: profileInfo.ownerFullName || username,
          biography: profileInfo.ownerBiography || '',
          followers: profileInfo.ownerFollowers || 0,
          following: profileInfo.ownerFollowing || 0,
          postsCount: profileInfo.ownerPostsCount || 0,
          profilePictureUrl: profileInfo.ownerProfilePicUrl || '',
          verified: profileInfo.ownerVerified || false
        },
        posts: posts.map(post => ({
          id: post.id,
          caption: post.caption,
          type: post.type,
          url: post.url,
          timestamp: post.timestamp,
          likes: post.likesCount,
          comments: post.commentsCount
        })),
        extracted: {
          hashtags: topHashtags,
          mentions: topMentions,
          engagement,
          contentAnalysis: {
            totalHashtagsUsed: hashtags.size,
            totalMentionsUsed: mentions.size,
            averageHashtagsPerPost: Math.round(
              topHashtags.reduce((sum, h) => sum + h.count, 0) / posts.length
            ),
            averageMentionsPerPost: Math.round(
              topMentions.reduce((sum, m) => sum + m.count, 0) / posts.length
            )
          }
        }
      }

      console.log(`✅ Profile analysis complete for @${username}`)
      res.json(successResponse(responseData))
    } catch (error: any) {
      console.error('❌ Profile analysis failed:', error.message)
      res.status(500).json(
        errorResponse(500, `Failed to analyze profile: ${error.message}`, 'ANALYSIS_FAILED')
      )
    }
  })

  return router
}
