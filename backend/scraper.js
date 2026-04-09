/**
 * Instagram Scraper Module
 * Fetches Instagram profile data from Apify dataset
 * Exports functions for integration with Mastra agents
 */

const API_TOKEN = process.env.APIFY_API_TOKEN
const DATASET_ID = process.env.APIFY_DATASET_ID

if (!API_TOKEN || !DATASET_ID) {
  throw new Error('APIFY_API_TOKEN and APIFY_DATASET_ID must be set in environment variables')
}

/**
 * Extract Instagram profile data for a specific user
 * @param {string} username - Instagram username to fetch
 * @returns {Promise<Object>} Profile data with posts, engagement metrics, hashtags
 */
async function scrapeInstagramProfile(username) {
  try {
    // Fetch results from the Apify dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${API_TOKEN}`

    const response = await fetch(datasetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch dataset: ${response.status} ${response.statusText}`
      )
    }

    const dataItems = await response.json()

    // Filter to only posts from the requested username
    const posts = dataItems.filter(item =>
      item.ownerUsername &&
      item.ownerUsername.toLowerCase() === username.toLowerCase()
    )

    if (!posts || posts.length === 0) {
      throw new Error(
        `No posts found for @${username}. Available profiles: ${[
          ...new Set(dataItems.map(d => d.ownerUsername))
        ].join(', ')}`
      )
    }

    // Extract profile information from first post
    const firstPost = posts[0]
    const profile = {
      username: firstPost.ownerUsername || username,
      fullName: firstPost.ownerFullName || 'Unknown',
      biography: firstPost.ownerBiography || '',
      followers: firstPost.ownerFollowers || 0,
      following: firstPost.ownerFollowing || 0,
      postsCount: firstPost.ownerPostsCount || 0,
      profilePicUrl: firstPost.ownerProfilePicUrl || '',
      verified: firstPost.ownerVerified || false,
      externalUrl: firstPost.ownerExternalUrl || ''
    }

    // Process posts
    const processedPosts = posts.map((post) => ({
      id: post.id,
      caption: post.caption || '',
      timestamp: post.timestamp,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      type: post.type || 'image',
      url: post.url,
      hashtags: (post.caption.match(/#\w+/g) || []).map(tag => tag.toLowerCase()),
      mentions: (post.caption.match(/@\w+/g) || []).map(mention => mention.toLowerCase())
    }))

    // Extract hashtags across all posts
    const hashtagMap = new Map()
    for (const post of processedPosts) {
      post.hashtags.forEach(tag => {
        hashtagMap.set(tag, (hashtagMap.get(tag) || 0) + 1)
      })
    }
    const hashtags = Array.from(hashtagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))

    // Extract mentions
    const mentionMap = new Map()
    for (const post of processedPosts) {
      post.mentions.forEach(mention => {
        mentionMap.set(mention, (mentionMap.get(mention) || 0) + 1)
      })
    }
    const mentions = Array.from(mentionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([mention, count]) => ({ mention, count }))

    // Calculate engagement metrics
    const totalLikes = processedPosts.reduce((sum, p) => sum + p.likes, 0)
    const totalComments = processedPosts.reduce((sum, p) => sum + p.comments, 0)
    const engagement = {
      totalPosts: processedPosts.length,
      totalLikes,
      totalComments,
      totalEngagement: totalLikes + totalComments,
      avgLikes: Math.round(totalLikes / processedPosts.length),
      avgComments: Math.round(totalComments / processedPosts.length),
      engagementRate:
        profile.followers > 0
          ? (
              ((totalLikes + totalComments) /
                (processedPosts.length * profile.followers)) *
              100
            ).toFixed(2) + '%'
          : 'N/A'
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      profile,
      engagement,
      posts: processedPosts.slice(0, 12), // Return first 12 posts for analysis
      recentPosts: processedPosts.slice(0, 5), // Top 5 recent posts
      hashtags: hashtags.slice(0, 20), // Top 20 hashtags
      mentions: mentions.slice(0, 10) // Top 10 mentions
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

module.exports = {
  scrapeInstagramProfile
}
