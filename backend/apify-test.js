#!/usr/bin/env node

/**
 * Apify Instagram Scraper - Terminal Test Script
 * Fetches real Instagram profile and post data using Apify API
 * Run with: node apify-test.js [username]
 */

const API_TOKEN = process.env.APIFY_API_TOKEN
const ACTOR_ID = process.env.APIFY_ACTOR_ID
const RUN_ID = process.env.APIFY_RUN_ID
const DATASET_ID = process.env.APIFY_DATASET_ID
const DEFAULT_USERNAME = process.env.DEFAULT_INSTAGRAM_USERNAME || 'insta_lens_business'
const username = process.argv[2] || DEFAULT_USERNAME

if (!API_TOKEN || !ACTOR_ID || !RUN_ID || !DATASET_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   APIFY_API_TOKEN, APIFY_ACTOR_ID, APIFY_RUN_ID, APIFY_DATASET_ID');
  process.exit(1);
}

async function scrapeInstagramProfile(username) {
  try {
    console.log(`\n╔════════════════════════════════════════╗`)
    console.log(`║  Apify Instagram Scraper - Test        ║`)
    console.log(`╚════════════════════════════════════════╝\n`)

    console.log(`🚀 Fetching Instagram profile data: @${username}`)
    console.log(`⏳ Reading from cached dataset...\n`)

    // Fetch results from the existing dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${API_TOKEN}`

    const response = await fetch(datasetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`\n❌ API Error: ${response.status} ${response.statusText}`)
      console.error(`\nResponse:`)
      console.error(errorText)
      
      if (response.status === 401) {
        console.error(`\n💡 Hint: Invalid or expired API token. Check your APIFY_API_TOKEN`)
      } else if (response.status === 404) {
        console.error(`\n💡 Hint: Dataset not found. The run ID or dataset ID may be incorrect.`)
      }
      process.exit(1)
    }

    const dataItems = await response.json()
    
    // Filter to only posts from the requested username
    const data = dataItems.filter(item => 
      item.ownerUsername && item.ownerUsername.toLowerCase() === username.toLowerCase()
    )

    if (!data || data.length === 0) {
      console.error(`\n❌ No posts found for @${username} in the dataset.`)
      console.error(`Available profiles in dataset: ${[...new Set(dataItems.map(d => d.ownerUsername))].join(', ')}`)
      process.exit(1)
    }

    console.log(`✅ Found ${data.length} posts from @${username}!\n`)

    // Extract profile information from first post
    const firstPost = data[0]
    const profile = {
      username: firstPost.ownerUsername || username,
      fullName: firstPost.ownerFullName || 'Unknown',
      biography: firstPost.ownerBiography || 'No bio',
      followers: firstPost.ownerFollowers || 0,
      following: firstPost.ownerFollowing || 0,
      postsCount: firstPost.ownerPostsCount || 0,
      profilePicUrl: firstPost.ownerProfilePicUrl || '',
      verified: firstPost.ownerVerified || false
    }

    // Process posts
    const posts = data.map((post) => ({
      id: post.id,
      caption: post.caption || '',
      timestamp: post.timestamp,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      type: post.type || 'image',
      url: post.url
    }))

    // Extract hashtags
    const hashtagMap = new Map()
    for (const post of posts) {
      const matches = (post.caption.match(/#\w+/g) || []).map(tag => tag.toLowerCase())
      matches.forEach(tag => {
        hashtagMap.set(tag, (hashtagMap.get(tag) || 0) + 1)
      })
    }
    const hashtags = Array.from(hashtagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    // Extract mentions
    const mentionMap = new Map()
    for (const post of posts) {
      const matches = (post.caption.match(/@\w+/g) || []).map(mention => mention.toLowerCase())
      matches.forEach(mention => {
        mentionMap.set(mention, (mentionMap.get(mention) || 0) + 1)
      })
    }
    const mentions = Array.from(mentionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Calculate engagement
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0)
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0)
    const engagement = {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      totalEngagement: totalLikes + totalComments,
      avgLikes: Math.round(totalLikes / posts.length),
      avgComments: Math.round(totalComments / posts.length)
    }

    // Display results
    console.log(`╔════════════════════════════════════════════════╗`)
    console.log(`║         📊 INSTAGRAM PROFILE EXTRACTED         ║`)
    console.log(`╚════════════════════════════════════════════════╝\n`)

    console.log(`👤 PROFILE INFORMATION:`)
    console.log(`   Username: @${profile.username}`)
    console.log(`   Name: ${profile.fullName}`)
    console.log(`   Bio: ${profile.biography}`)
    console.log(`   Followers: ${profile.followers.toLocaleString()}`)
    console.log(`   Following: ${profile.following.toLocaleString()}`)
    console.log(`   Total Posts: ${profile.postsCount}`)
    console.log(`   Verified: ${profile.verified ? '✓ Yes' : '✗ No'}`)

    console.log(`\n📈 ENGAGEMENT METRICS:`)
    console.log(`   Posts Analyzed: ${engagement.totalPosts}`)
    console.log(`   Total Likes: ${engagement.totalLikes.toLocaleString()}`)
    console.log(`   Total Comments: ${engagement.totalComments.toLocaleString()}`)
    console.log(`   Total Engagement: ${engagement.totalEngagement.toLocaleString()}`)
    console.log(`   Average Likes/Post: ${engagement.avgLikes.toLocaleString()}`)
    console.log(`   Average Comments/Post: ${engagement.avgComments.toLocaleString()}`)
    console.log(`   Engagement Rate: ${((engagement.totalEngagement / (engagement.totalPosts * profile.followers)) * 100).toFixed(2)}%`)

    console.log(`\n#️⃣  TOP HASHTAGS (${hashtags.length} unique):`)
    hashtags.forEach(([tag, count], i) => {
      const bar = '█'.repeat(Math.min(count, 20))
      console.log(`   ${(i + 1).toString().padStart(2)}. ${tag.padEnd(20)} ${bar} ${count}`)
    })

    if (mentions.length > 0) {
      console.log(`\n👥 TOP MENTIONS (${mentions.length} unique):`)
      mentions.forEach(([mention, count], i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${mention} (${count} times)`)
      })
    }

    console.log(`\n📱 RECENT POSTS (first 5):`)
    for (let i = 0; i < Math.min(5, posts.length); i++) {
      const post = posts[i]
      const caption = post.caption.substring(0, 80).replace(/\n/g, ' ')
      const date = new Date(post.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      console.log(`\n   [Post ${i + 1}] ${date}`)
      console.log(`   Caption: "${caption}${post.caption.length > 80 ? '...' : ''}"`)
      console.log(`   Engagement: ${post.likes} ❤️  | ${post.comments} 💬`)
    }

    // Export JSON
    console.log(`\n\n📋 FULL EXTRACTED DATA (JSON):`)
    console.log(JSON.stringify(
      {
        profile,
        engagement,
        hashtags: hashtags.map(([tag, count]) => ({ tag, count })),
        mentions: mentions.map(([mention, count]) => ({ mention, count })),
        postsCount: posts.length,
        scrapedAt: new Date().toISOString()
      },
      null,
      2
    ))

    console.log(`\n✨ Extraction complete!`)
    console.log(`💾 This data is ready to be integrated into your InstaLens app.\n`)
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    if (error.message.includes('fetch failed')) {
      console.error(`\n💡 Possible causes:`)
      console.error(`   - Network connection issue`)
      console.error(`   - Invalid API token`)
      console.error(`   - Apify service is down`)
    }
    process.exit(1)
  }
}

// Run the script
scrapeInstagramProfile(username)
