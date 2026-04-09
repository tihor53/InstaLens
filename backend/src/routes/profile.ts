import { Router, Request, Response } from 'express'
import { InstagramClient } from '../lib/instagram/client'
import { TokenStore } from '../lib/cache/token-store'
import { successResponse, errorResponse } from '../lib/validation/errors'

export function createProfileRoutes(
  tokenStore: TokenStore
): Router {
  const router = Router()

  /**
   * POST /api/profile/analyze
   * Analyze an Instagram profile using stored access token
   */
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json(
          errorResponse(400, 'User ID is required', 'MISSING_USER_ID')
        )
      }

      // Get stored access token
      const accessToken = tokenStore.getToken(userId)

      if (!accessToken) {
        return res.status(401).json(
          errorResponse(401, 'Access token not found. User must authenticate first.', 'TOKEN_NOT_FOUND')
        )
      }

      // Initialize Instagram client with stored token
      const client = new InstagramClient(accessToken)

      // Validate token is still active
      const isValid = await client.validateToken()
      if (!isValid) {
        tokenStore.deleteToken(userId)
        return res.status(401).json(
          errorResponse(401, 'Access token is invalid or expired', 'TOKEN_INVALID')
        )
      }

      // Get user profile with recent media
      const profileData = await client.getProfileWithMedia(12)

      // Parse media for intelligence extraction
      const parsedMedia = client.parseMediaData(profileData.media)

      const responseData = {
        profile: {
          id: profileData.profile.id,
          username: profileData.profile.username,
          name: profileData.profile.name,
          biography: profileData.profile.biography,
          website: profileData.profile.website,
          profilePictureUrl: profileData.profile.profile_picture_url
        },
        media: parsedMedia,
        extracted: {
          totalPosts: parsedMedia.length,
          allHashtags: Array.from(
            new Set(parsedMedia.flatMap((m) => m.hashtags))
          ),
          allMentions: Array.from(
            new Set(parsedMedia.flatMap((m) => m.mentions))
          ),
          avgEngagement: Math.round(
            parsedMedia.reduce(
              (sum, m) => sum + (m.engagement.likes + m.engagement.comments),
              0
            ) / parsedMedia.length || 0
          )
        }
      }

      res.json(successResponse(responseData))
    } catch (error: any) {
      console.error('Profile analysis failed:', error)
      res.status(500).json(
        errorResponse(500, `Failed to analyze profile: ${error.message}`, 'ANALYSIS_FAILED')
      )
    }
  })

  /**
   * GET /api/profile/me
   * Get authenticated user's own profile
   */
  router.get('/me', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string

      if (!userId) {
        return res.status(401).json(
          errorResponse(401, 'User ID is required in X-User-ID header', 'MISSING_USER_ID')
        )
      }

      // Get stored access token
      const accessToken = tokenStore.getToken(userId)

      if (!accessToken) {
        return res.status(401).json(
          errorResponse(401, 'Access token not found', 'TOKEN_NOT_FOUND')
        )
      }

      // Initialize Instagram client
      const client = new InstagramClient(accessToken)

      // Get user's own profile
      const profile = await client.getMe()

      res.json(successResponse(profile))
    } catch (error: any) {
      console.error('Failed to get user profile:', error)
      res.status(500).json(
        errorResponse(500, `Failed to get profile: ${error.message}`, 'GET_PROFILE_FAILED')
      )
    }
  })

  return router
}
