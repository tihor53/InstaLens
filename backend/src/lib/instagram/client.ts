import axios, { AxiosInstance } from 'axios'

interface InstagramProfile {
  id: string
  username: string
  name: string
  biography: string
  website: string
  profile_picture_url: string
  follower_count?: number
  following_count?: number
  posts_count?: number
}

interface InstagramMedia {
  id: string
  media_type: string
  media_url: string
  caption: string
  timestamp: string
  like_count?: number
  comments_count?: number
}

export class InstagramClient {
  private client: AxiosInstance
  private accessToken: string
  private apiVersion: string

  constructor(accessToken: string, apiVersion: string = 'v18.0') {
    this.accessToken = accessToken
    this.apiVersion = apiVersion

    this.client = axios.create({
      baseURL: `https://graph.instagram.com/${apiVersion}`,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Get authenticated user's profile information
   */
  async getMe(): Promise<InstagramProfile> {
    try {
      const response = await this.client.get('/me', {
        params: {
          fields: 'id,username,name,biography,website,profile_picture_url',
          access_token: this.accessToken
        }
      })

      return response.data as InstagramProfile
    } catch (error: any) {
      console.error('Failed to get user profile:', error.response?.data || error.message)
      throw new Error(`Failed to get user profile: ${error.message}`)
    }
  }

  /**
   * Get user's recent media posts (Instagram Basic Display API)
   * Limited to 12 most recent posts
   */
  async getRecentMedia(userId: string, limit: number = 12): Promise<InstagramMedia[]> {
    try {
      const response = await this.client.get(`/${userId}/media`, {
        params: {
          fields: 'id,media_type,media_url,caption,timestamp',
          limit,
          access_token: this.accessToken
        }
      })

      return response.data.data as InstagramMedia[]
    } catch (error: any) {
      console.error('Failed to get media:', error.response?.data || error.message)
      throw new Error(`Failed to get media: ${error.message}`)
    }
  }

  /**
   * Get media insights (engagement metrics)
   * Note: Only available for business/creator accounts
   */
  async getMediaInsights(mediaId: string): Promise<any> {
    try {
      const response = await this.client.get(`/${mediaId}/insights`, {
        params: {
          metric: 'engagement,impressions,reach,save_count',
          access_token: this.accessToken
        }
      })

      return response.data.data
    } catch (error: any) {
      // Gracefully handle if insights not available
      console.warn('Media insights not available:', error.response?.data?.error?.message)
      return null
    }
  }

  /**
   * Get user's detailed profile with media
   * Combines profile info with recent posts
   */
  async getProfileWithMedia(limit: number = 12) {
    try {
      // Get user profile
      const profile = await this.getMe()

      // Get recent media
      const media = await this.getRecentMedia(profile.id, limit)

      // Enrich media with insights if available
      const enrichedMedia = await Promise.all(
        media.map(async (m) => {
          const insights = await this.getMediaInsights(m.id)
          return { ...m, insights }
        })
      )

      return {
        profile,
        media: enrichedMedia
      }
    } catch (error: any) {
      console.error('Failed to get profile with media:', error.message)
      throw error
    }
  }

  /**
   * Get token validity (check if token is still valid)
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.client.get('/me/accounts', {
        params: {
          access_token: this.accessToken
        }
      })

      return !!response.data.data
    } catch (error: any) {
      console.error('Token validation failed:', error.response?.data || error.message)
      return false
    }
  }

  /**
   * Extract hashtags from caption text
   */
  extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g
    const matches = text.match(hashtagRegex) || []
    return matches.map((tag) => tag.toLowerCase())
  }

  /**
   * Extract @mentions from caption text
   */
  extractMentions(text: string): string[] {
    const mentionRegex = /@[\w.]+/g
    const matches = text.match(mentionRegex) || []
    return matches.map((mention) => mention.toLowerCase())
  }

  /**
   * Parse media data to extract business intelligence
   */
  parseMediaData(media: InstagramMedia[]) {
    return media.map((m) => ({
      id: m.id,
      type: m.media_type,
      url: m.media_url,
      caption: m.caption,
      hashtags: this.extractHashtags(m.caption || ''),
      mentions: this.extractMentions(m.caption || ''),
      timestamp: m.timestamp,
      engagement: {
        likes: m.like_count || 0,
        comments: m.comments_count || 0
      }
    }))
  }
}
