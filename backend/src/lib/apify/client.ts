/**
 * Apify Instagram Scraper Integration
 * Uses Apify's Instagram Scraper actor to fetch real Instagram data
 */

interface ApifyActorRun {
  id: string
  actId: string
  userId: string
  status: string
  startedAt: string
  finishedAt?: string
  defaultDatasetId?: string
}

interface InstagramPostData {
  id: string
  shortCode: string
  caption: string
  timestamp: string
  likesCount: number
  commentsCount: number
  type: string
  url: string
  ownerUsername?: string
  ownerFullName?: string
  ownerBiography?: string
  ownerFollowers?: number
  ownerFollowing?: number
  ownerPostsCount?: number
  ownerProfilePicUrl?: string
  ownerVerified?: boolean
}

interface ApifyConfig {
  apiToken: string
  actorId: string
  datasetId?: string
}

export class ApifyInstagramClient {
  private apiToken: string
  private actorId: string
  private datasetId?: string
  private apiBaseUrl = 'https://api.apify.com/v2'

  constructor(config: ApifyConfig) {
    this.apiToken = config.apiToken
    this.actorId = config.actorId
    this.datasetId = config.datasetId
  }

  /**
   * Fetch Instagram profile data from cached dataset
   * Uses the apify-test.js approach
   */
  async scrapeAndWait(username: string, limit: number = 12): Promise<InstagramPostData[]> {
    try {
      console.log(`🚀 Starting Apify scrape for @${username}...`)

      if (!this.datasetId) {
        throw new Error('Dataset ID not configured. Cannot fetch cached data.')
      }

      // Fetch all items from the dataset
      const datasetUrl = `${this.apiBaseUrl}/datasets/${this.datasetId}/items?token=${this.apiToken}`

      console.log(`📡 Fetching from dataset: ${this.datasetId}`)

      const response = await fetch(datasetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Apify API error (${response.status}): ${errorData}`)
      }

      const allItems = await response.json() as InstagramPostData[]

      if (!allItems || allItems.length === 0) {
        throw new Error('No data returned from Apify dataset')
      }

      // Filter to only posts from the requested username
      const posts = allItems.filter(
        (item: any) => item.ownerUsername && item.ownerUsername.toLowerCase() === username.toLowerCase()
      )

      if (posts.length === 0) {
        throw new Error(`No posts found for @${username} in the dataset`)
      }

      console.log(`✅ Got ${posts.length} posts from Apify!`)
      return posts as InstagramPostData[]
    } catch (error: any) {
      console.error('❌ Scrape failed:', error.message)
      throw error
    }
  }

  /**
   * Extract hashtags from posts
   */
  static extractHashtags(posts: InstagramPostData[]): Map<string, number> {
    const hashtags = new Map<string, number>()

    for (const post of posts) {
      const matches = (post.caption.match(/#\w+/g) || []).map(tag => tag.toLowerCase())
      matches.forEach(tag => {
        hashtags.set(tag, (hashtags.get(tag) || 0) + 1)
      })
    }

    return hashtags
  }

  /**
   * Extract mentions from posts
   */
  static extractMentions(posts: InstagramPostData[]): Map<string, number> {
    const mentions = new Map<string, number>()

    for (const post of posts) {
      const matches = (post.caption.match(/@\w+/g) || []).map(mention => mention.toLowerCase())
      matches.forEach(mention => {
        mentions.set(mention, (mentions.get(mention) || 0) + 1)
      })
    }

    return mentions
  }

  /**
   * Calculate engagement metrics
   */
  static calculateEngagement(posts: InstagramPostData[]): {
    totalPosts: number
    totalLikes: number
    totalComments: number
    avgLikes: number
    avgComments: number
    totalEngagement: number
  } {
    if (posts.length === 0) {
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        avgLikes: 0,
        avgComments: 0,
        totalEngagement: 0
      }
    }

    let totalLikes = 0
    let totalComments = 0

    for (const post of posts) {
      totalLikes += post.likesCount || 0
      totalComments += post.commentsCount || 0
    }

    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      avgLikes: Math.round(totalLikes / posts.length),
      avgComments: Math.round(totalComments / posts.length),
      totalEngagement: totalLikes + totalComments
    }
  }
}

// Export utility functions
export function extractHashtags(posts: InstagramPostData[]): Map<string, number> {
  return ApifyInstagramClient.extractHashtags(posts)
}

export function extractMentions(posts: InstagramPostData[]): Map<string, number> {
  return ApifyInstagramClient.extractMentions(posts)
}

export function calculateEngagement(
  posts: InstagramPostData[]
): ReturnType<typeof ApifyInstagramClient.calculateEngagement> {
  return ApifyInstagramClient.calculateEngagement(posts)
}
