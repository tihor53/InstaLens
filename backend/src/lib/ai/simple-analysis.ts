/**
 * Simple Instagram Analysis without Mastra Workflow
 * Direct agent calls with timeout handling
 * Provides fallback data if agents timeout or fail
 */

import { profileAnalyzerAgent } from '../../../../frontend/instalensagent/src/mastra/agents/profile-analyzer-agent'
import { contentAnalyzerAgent } from '../../../../frontend/instalensagent/src/mastra/agents/content-analyzer-agent'
import { audienceAnalyzerAgent } from '../../../../frontend/instalensagent/src/mastra/agents/audience-analyzer-agent'
import { dataStructurerAgent } from '../../../../frontend/instalensagent/src/mastra/agents/data-structurer-agent'

const AGENT_TIMEOUT = 12000 // 12 seconds per agent

async function callAgentWithTimeout(
  agent: any,
  prompt: string,
  agentName: string
): Promise<any> {
  try {
    console.log(`🤖 [${agentName}] Starting agent call...`)

    const agentPromise = agent.generate(prompt)

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${agentName} timeout (${AGENT_TIMEOUT}ms)`)), AGENT_TIMEOUT)
    )

    const response = await Promise.race([agentPromise, timeoutPromise])
    console.log(`✅ [${agentName}] Response received`)

    // Extract text from response
    const text = typeof response === 'string' ? response : response.text || response.content || JSON.stringify(response)

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}$/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // If no JSON found, try direct parsing
    try {
      return JSON.parse(text)
    } catch {
      console.warn(`⚠️ [${agentName}] Could not parse JSON from response`)
      return null
    }
  } catch (error: any) {
    console.error(`❌ [${agentName}] Error:`, error.message)
    return null
  }
}

export async function analyzeInstagramProfile(profileData: any): Promise<{
  profileAnalysis: any
  contentAnalysis: any
  audienceInsights: any
  structuredData: any
}> {
  console.log(`📊 Starting simple analysis for @${profileData.username}`)

  // Step 1: Profile Analysis
  const profileAnalysisPrompt = `You are an expert business analyst. Analyze this Instagram profile and extract business identity:

Profile:
- Username: ${profileData.username}
- Full Name: ${profileData.fullName || 'N/A'}
- Biography: ${profileData.biography || 'N/A'}
- Website: ${profileData.website || 'N/A'}
- Followers: ${profileData.followerCount || 0}
- Following: ${profileData.followingCount || 0}
- Posts: ${profileData.postCount || 0}
- Business Account: ${profileData.isBusinessAccount}
- Category: ${profileData.category || 'N/A'}

Return ONLY a JSON object (no other text):
{
  "businessIdentity": {
    "name": "business name",
    "tagline": "tagline",
    "description": "description"
  },
  "classification": {
    "primaryCategory": "category",
    "subCategories": [],
    "businessModel": "D2C",
    "industryTags": []
  },
  "branding": {
    "voiceTone": "professional",
    "personality": [],
    "positioning": "positioning"
  },
  "location": {
    "city": "",
    "region": "",
    "country": "",
    "serviceArea": "global"
  }
}`

  const profileAnalysis = await callAgentWithTimeout(
    profileAnalyzerAgent,
    profileAnalysisPrompt,
    'Profile Analyzer'
  )

  // Step 2: Content Analysis
  let contentAnalysis = null
  if (profileData.posts && profileData.posts.length > 0) {
    const postsContext = profileData.posts
      .slice(0, 10)
      .map((post: any, idx: number) => `Post ${idx + 1}: "${post.caption || ''}" (${post.likes || 0} likes, ${post.comments || 0} comments)`)
      .join('\n')

    const contentPrompt = `Analyze these Instagram posts and identify content patterns:

${postsContext}

Return ONLY a JSON object (no other text):
{
  "contentThemes": [{"theme": "theme name", "frequency": 5}],
  "services": [{"name": "service", "mentions": 2}],
  "productCategories": [],
  "callToActions": [],
  "visualStyle": {
    "aesthetic": "minimalist",
    "colorPalette": [],
    "photoStyle": "candid"
  }
}`

    contentAnalysis = await callAgentWithTimeout(contentAnalyzerAgent, contentPrompt, 'Content Analyzer')
  }

  // Step 3: Audience Analysis
  const audiencePrompt = `Analyze the Instagram audience based on profile metrics and content:

Followers: ${profileData.followerCount}
Post Count: ${profileData.postCount}
Avg Engagement: ${contentAnalysis?.services?.length ? '3-5%' : '2-4%'}

Return ONLY a JSON object (no other text):
{
  "targetAudience": {
    "demographics": {
      "ageRange": "18-45",
      "interests": [],
      "lifestyle": ""
    },
    "painPoints": [],
    "needsAddressed": []
  },
  "engagementPatterns": {
    "postingFrequency": "regular",
    "bestPerformingContentType": "reels",
    "averageEngagementRate": "3%",
    "peakEngagementTimes": []
  },
  "communityCharacteristics": {
    "size": "medium",
    "engagement": "high",
    "loyaltyIndicators": []
  },
  "customerJourney": {
    "awarenessContent": "educational",
    "considerationContent": "product focus",
    "conversionContent": "CTA-driven"
  }
}`

  const audienceInsights = await callAgentWithTimeout(
    audienceAnalyzerAgent,
    audiencePrompt,
    'Audience Analyzer'
  )

  // Step 4: Data Structuring
  const structuringPrompt = `Create a CRM-ready structure from this analysis:

Profile: @${profileData.username}
Followers: ${profileData.followerCount}
Category: ${profileData.category}

Return ONLY a JSON object (no other text):
{
  "lead": {
    "companyName": "${profileData.fullName || profileData.username}",
    "industry": "${profileData.category || 'general'}",
    "website": "${profileData.website || ''}",
    "email": "",
    "phone": "",
    "socialProfiles": {
      "instagram": {
        "handle": "${profileData.username}",
        "url": "https://instagram.com/${profileData.username}",
        "followers": ${profileData.followerCount}
      }
    }
  },
  "enrichmentData": {
    "businessType": "creator",
    "services": [],
    "targetMarket": "general",
    "brandVoice": "professional"
  },
  "segmentation": {
    "tags": ["${profileData.category || 'uncategorized'}"],
    "lifecycle": "prospect",
    "leadScore": 50,
    "priority": "medium"
  },
  "marketingIntel": {
    "contentThemes": [],
    "engagementRate": "3%",
    "audienceSize": "medium",
    "growthTrend": "stable"
  }
}`

  const structuredData = await callAgentWithTimeout(dataStructurerAgent, structuringPrompt, 'Data Structurer')

  console.log(`📊 Analysis complete for @${profileData.username}`)

  return {
    profileAnalysis: profileAnalysis || {
      businessIdentity: { name: profileData.fullName, tagline: '', description: profileData.biography },
      classification: { primaryCategory: profileData.category, subCategories: [], businessModel: 'D2C', industryTags: [] },
      branding: { voiceTone: 'professional', personality: [], positioning: '' },
      location: { city: '', region: '', country: '', serviceArea: 'global' },
    },
    contentAnalysis: contentAnalysis || {
      contentThemes: [],
      services: [],
      productCategories: [],
      callToActions: [],
      visualStyle: { aesthetic: '', colorPalette: [], photoStyle: '' },
    },
    audienceInsights: audienceInsights || {
      targetAudience: { demographics: { ageRange: '18-45', interests: [], lifestyle: '' }, painPoints: [], needsAddressed: [] },
      engagementPatterns: { postingFrequency: 'regular', bestPerformingContentType: '', averageEngagementRate: '3%', peakEngagementTimes: [] },
      communityCharacteristics: { size: 'medium', engagement: 'medium', loyaltyIndicators: [] },
      customerJourney: { awarenessContent: '', considerationContent: '', conversionContent: '' },
    },
    structuredData: structuredData || {
      lead: {
        companyName: profileData.fullName || profileData.username,
        industry: profileData.category || 'general',
        website: profileData.website || '',
        socialProfiles: {
          instagram: {
            handle: profileData.username,
            url: `https://instagram.com/${profileData.username}`,
            followers: profileData.followerCount || 0,
          },
        },
      },
      enrichmentData: {
        businessType: 'creator',
        services: [],
        targetMarket: 'general',
        brandVoice: 'professional',
      },
      segmentation: {
        tags: [profileData.category || 'uncategorized'],
        lifecycle: 'prospect',
        leadScore: 50,
        priority: 'medium',
      },
      marketingIntel: {
        contentThemes: [],
        engagementRate: '3%',
        audienceSize: 'medium',
        growthTrend: 'stable',
      },
    },
  }
}
