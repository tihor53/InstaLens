import { Router, Request, Response } from 'express'
import { InstagramOAuth } from '../lib/instagram/oauth'
import { TokenStore } from '../lib/cache/token-store'
import { oauthCallbackSchema } from '../lib/validation/schemas'
import { successResponse, errorResponse } from '../lib/validation/errors'

export function createAuthRoutes(
  oauth: InstagramOAuth,
  tokenStore: TokenStore
): Router {
  const router = Router()

  /**
   * GET /api/auth/instagram
   * Redirect user to Instagram OAuth authorization window
   */
  router.get('/instagram', (req: Request, res: Response) => {
    try {
      // Generate state to prevent CSRF attacks
      const state = oauth.generateState()

      // Store state in session/cookie for verification
      res.cookie('oauth_state', state, {
        httpOnly: true,
        maxAge: 10 * 60 * 1000 // 10 minutes
      })

      // Get authorization URL
      const authUrl = oauth.getAuthorizationUrl(state)

      // Redirect user to Instagram
      res.redirect(authUrl)
    } catch (error: any) {
      console.error('OAuth initialization failed:', error)
      res.status(500).json(
        errorResponse(500, 'Failed to initialize OAuth flow', 'AUTH_INIT_FAILED')
      )
    }
  })

  /**
   * GET /api/auth/instagram/callback
   * Handle Instagram OAuth callback with authorization code
   */
  router.get('/instagram/callback', async (req: Request, res: Response) => {
    try {
      // Validate callback parameters
      const validation = oauthCallbackSchema.safeParse(req.query)

      if (!validation.success) {
        return res.status(400).json(
          errorResponse(400, 'Invalid OAuth callback parameters', 'INVALID_CALLBACK')
        )
      }

      const { code, state } = validation.data

      // Verify state (CSRF protection)
      const savedState = req.cookies?.oauth_state
      if (state && savedState && !oauth.verifyState(savedState, state)) {
        return res.status(400).json(
          errorResponse(400, 'Invalid state parameter', 'CSRF_VALIDATION_FAILED')
        )
      }

      // Exchange code for short-lived access token
      const { access_token, user_id } = await oauth.exchangeCodeForToken(code)

      // Exchange for long-lived access token (60 days)
      const { access_token: longLivedToken } = await oauth.exchangeForLongLivedToken(
        access_token
      )

      // Store the long-lived token in memory
      tokenStore.saveToken(user_id, longLivedToken)

      console.log(`✅ OAuth success for user ${user_id}`)

      // Clear OAuth state cookie
      res.clearCookie('oauth_state')

      // Redirect to frontend extraction page with userId and success status
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const redirectUrl = new URL(`${frontendUrl}/extraction`)
      redirectUrl.searchParams.append('success', 'true')
      redirectUrl.searchParams.append('userId', user_id)

      res.redirect(redirectUrl.toString())
    } catch (error: any) {
      console.error('OAuth callback failed:', error)

      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const redirectUrl = new URL(`${frontendUrl}/extraction`)
      redirectUrl.searchParams.append('success', 'false')
      redirectUrl.searchParams.append('error', error.message)

      res.redirect(redirectUrl.toString())
    }
  })

  /**
   * POST /api/auth/revoke
   * Revoke user's access token
   */
  router.post('/revoke', (req: Request, res: Response) => {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json(
          errorResponse(400, 'User ID is required', 'MISSING_USER_ID')
        )
      }

      // Delete token from store
      tokenStore.deleteToken(userId)

      res.json(successResponse({ revoked: true }))
    } catch (error: any) {
      console.error('Token revocation failed:', error)
      res.status(500).json(
        errorResponse(500, 'Failed to revoke token', 'REVOKE_FAILED')
      )
    }
  })

  return router
}
