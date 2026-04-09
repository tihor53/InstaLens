import axios from 'axios'
import crypto from 'crypto'

interface OAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
  apiVersion: string
}

interface AccessTokenResponse {
  access_token: string
  user_id: string
}

interface LongLivedTokenResponse {
  access_token: string
  token_type: string
}

export class InstagramOAuth {
  private config: OAuthConfig

  constructor(config: OAuthConfig) {
    this.config = config
  }

  /**
   * Generate the OAuth authorization URL
   * User should be redirected to this URL to authorize your app
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: 'instagram_basic',
      response_type: 'code',
      ...(state && { state })
    })

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for short-lived access token
   * Called from OAuth callback endpoint
   */
  async exchangeCodeForToken(code: string): Promise<AccessTokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code
      })

      const response = await axios.post(
        'https://graph.instagram.com/v18.0/oauth/access_token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      return {
        access_token: response.data.access_token,
        user_id: response.data.user_id
      }
    } catch (error: any) {
      console.error('OAuth token exchange failed:', error.response?.data || error.message)
      throw new Error(`Failed to exchange code for token: ${error.message}`)
    }
  }

  /**
   * Exchange short-lived access token for long-lived token (60 days)
   * Short-lived tokens are valid for 1 hour, long-lived for 60 days
   */
  async exchangeForLongLivedToken(
    shortLivedToken: string
  ): Promise<LongLivedTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: shortLivedToken
      })

      const response = await axios.get(
        `https://graph.instagram.com/v18.0/refresh_access_token`,
        { params: Object.fromEntries(params) }
      )

      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'bearer'
      }
    } catch (error: any) {
      console.error('Failed to get long-lived token:', error.response?.data || error.message)
      throw new Error(`Failed to get long-lived token: ${error.message}`)
    }
  }

  /**
   * Verify OAuth state parameter to prevent CSRF attacks
   */
  generateState(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  /**
   * Verify the state matches what was sent
   */
  verifyState(sentState: string, receivedState: string): boolean {
    return sentState === receivedState
  }
}
