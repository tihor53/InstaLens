import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { profileAnalyzerAgent } from '../agents/profile-analyzer-agent';
import { contentAnalyzerAgent } from '../agents/content-analyzer-agent';
import { audienceAnalyzerAgent } from '../agents/audience-analyzer-agent';
import { dataStructurerAgent } from '../agents/data-structurer-agent';

// Input schema for the workflow
const instagramProfileSchema = z.object({
  username: z.string(),
  fullName: z.string(),
  biography: z.string(),
  website: z.string().optional(),
  followerCount: z.number(),
  followingCount: z.number(),
  postCount: z.number(),
  isBusinessAccount: z.boolean(),
  category: z.string().optional(),
  contactInfo: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  posts: z.array(z.object({
    caption: z.string(),
    hashtags: z.array(z.string()),
    mentions: z.array(z.string()),
    imageUrl: z.string().optional(),
    likes: z.number(),
    comments: z.number(),
    timestamp: z.string().optional(),
  })).optional(),
});

// Step 1: Profile Analysis
const analyzeProfile = createStep({
  id: 'analyze-profile',
  description: 'Analyzes Instagram profile for business identity and classification',
  inputSchema: instagramProfileSchema,
  outputSchema: z.object({
    businessIdentity: z.any(),
    classification: z.any(),
    branding: z.any(),
    location: z.any(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Profile data not found');
    }

    console.log('🔍 [Step 1] Starting profile analysis for:', inputData.username);

    const profileContext = `
Profile Username: ${inputData.username}
Full Name: ${inputData.fullName}
Biography: ${inputData.biography}
Website: ${inputData.website || 'N/A'}
Followers: ${inputData.followerCount.toLocaleString()}
Following: ${inputData.followingCount.toLocaleString()}
Total Posts: ${inputData.postCount}
Is Business Account: ${inputData.isBusinessAccount}
Category: ${inputData.category || 'N/A'}
Contact Email: ${inputData.contactInfo?.email || 'N/A'}
Contact Phone: ${inputData.contactInfo?.phone || 'N/A'}
    `.trim();

    try {
      console.log('🤖 [Step 1] Calling profileAnalyzerAgent.generate...');
      const agentPromise = profileAnalyzerAgent.generate(
        `Analyze this Instagram business profile and extract business identity information:

${profileContext}

Return a JSON object with businessIdentity, classification, branding, and location fields.`
      );

      // Add 15-second timeout for agent call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile analyzer agent timeout (15s)')), 15000)
      );

      const response = await Promise.race([agentPromise, timeoutPromise]);
      console.log('✅ [Step 1] Agent response received');

      const text = (response as any).text || (response as any).content || String(response);
      const jsonMatch = text.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ [Step 1] Profile analysis parsed successfully');
        return parsed;
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('❌ [Step 1] Failed to parse profile analysis:', e);
      return {
        businessIdentity: { name: inputData.fullName, tagline: '', description: inputData.biography },
        classification: { primaryCategory: inputData.category || '', subCategories: [], businessModel: '', industryTags: [] },
        branding: { voiceTone: '', personality: [], positioning: '' },
        location: { city: '', region: '', country: '', serviceArea: '' },
      };
    }
  },
});

// Step 2: Content Analysis
const analyzeContent = createStep({
  id: 'analyze-content',
  description: 'Analyzes Instagram post content for themes, services, and CTAs',
  inputSchema: instagramProfileSchema,
  outputSchema: z.object({
    contentThemes: z.any(),
    services: z.any(),
    productCategories: z.any(),
    callToActions: z.any(),
    visualStyle: z.any(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData || !inputData.posts || inputData.posts.length === 0) {
      return {
        contentThemes: [],
        services: [],
        productCategories: [],
        callToActions: [],
        visualStyle: { aesthetic: '', colorPalette: [], photoStyle: '' },
      };
    }

    const contentContext = inputData.posts
      .map((post, idx) => {
        return `
Post ${idx + 1}:
Caption: ${post.caption}
Hashtags: ${post.hashtags.join(', ') || 'None'}
Likes: ${post.likes}
Comments: ${post.comments}
`;
      })
      .join('\n---\n');

    const response = await contentAnalyzerAgent.generate(
      `Analyze these Instagram posts and identify content patterns:

${contentContext}

Return a JSON object with contentThemes, services, productCategories, callToActions, and visualStyle fields.`
    );

    try {
      const text = (response as any).text || (response as any).content || String(response);
      const jsonMatch = text.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse content analysis:', e);
      return {
        contentThemes: [],
        services: [],
        productCategories: [],
        callToActions: [],
        visualStyle: { aesthetic: '', colorPalette: [], photoStyle: '' },
      };
    }
  },
});

// Step 3: Audience Analysis
const analyzeAudience = createStep({
  id: 'analyze-audience',
  description: 'Analyzes audience insights based on profile and content data',
  inputSchema: z.object({
    profileData: instagramProfileSchema,
    profileAnalysis: z.any(),
    contentAnalysis: z.any(),
  }),
  outputSchema: z.object({
    targetAudience: z.any(),
    engagementPatterns: z.any(),
    communityCharacteristics: z.any(),
    customerJourney: z.any(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { profileData, profileAnalysis, contentAnalysis } = inputData;

    const prompt = `Based on this Instagram profile and content analysis, identify audience insights:

Profile Analysis:
${JSON.stringify(profileAnalysis, null, 2)}

Content Analysis:
${JSON.stringify(contentAnalysis, null, 2)}

Raw Metrics:
- Followers: ${profileData.followerCount}
- Following: ${profileData.followingCount}
- Posts: ${profileData.postCount}

Return a JSON object with targetAudience, engagementPatterns, communityCharacteristics, and customerJourney fields.`;

    const response = await audienceAnalyzerAgent.generate(prompt);

    try {
      const text = (response as any).text || (response as any).content || String(response);
      const jsonMatch = text.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse audience analysis:', e);
      return {
        targetAudience: { demographics: { ageRange: '', interests: [], lifestyle: '' }, painPoints: [], needsAddressed: [] },
        engagementPatterns: { postingFrequency: '', bestPerformingContentType: '', averageEngagementRate: '', peakEngagementTimes: [] },
        communityCharacteristics: { size: '', engagement: '', loyaltyIndicators: [] },
        customerJourney: { awarenessContent: '', considerationContent: '', conversionContent: '' },
      };
    }
  },
});

// Step 4: Data Structuring
const structureData = createStep({
  id: 'structure-data',
  description: 'Structures all analysis data into CRM-ready format',
  inputSchema: z.object({
    profileData: instagramProfileSchema,
    profileAnalysis: z.any(),
    contentAnalysis: z.any(),
    audienceAnalysis: z.any(),
  }),
  outputSchema: z.object({
    lead: z.any(),
    enrichmentData: z.any(),
    segmentation: z.any(),
    marketingIntel: z.any(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { profileData, profileAnalysis, contentAnalysis, audienceAnalysis } = inputData;

    const prompt = `Structure this Instagram analysis into a CRM-ready format:

Profile Data:
- Username: ${profileData.username}
- Website: ${profileData.website}
- Followers: ${profileData.followerCount}

Profile Analysis:
${JSON.stringify(profileAnalysis, null, 2)}

Content Analysis:
${JSON.stringify(contentAnalysis, null, 2)}

Audience Analysis:
${JSON.stringify(audienceAnalysis, null, 2)}

Return a JSON object with lead, enrichmentData, segmentation, and marketingIntel fields suitable for CRM systems.`;

    const response = await dataStructurerAgent.generate(prompt);

    try {
      const text = (response as any).text || (response as any).content || String(response);
      const jsonMatch = text.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse data structuring:', e);
      return {
        lead: { companyName: profileData.fullName, industry: '', website: profileData.website, email: profileData.contactInfo?.email, phone: profileData.contactInfo?.phone, socialProfiles: { instagram: { url: `https://instagram.com/${profileData.username}`, followers: profileData.followerCount, handle: profileData.username } } },
        enrichmentData: { businessType: '', services: [], targetMarket: '', brandVoice: '', contentStrategy: '', competitorInsights: '' },
        segmentation: { tags: [], lifecycle: 'prospect', leadScore: 0, priority: 'medium' },
        marketingIntel: { contentThemes: [], engagementRate: '', audienceSize: '', growthTrend: '' },
      };
    }
  },
});

// Simplified workflow orchestration - agents are called directly from API routes
// The complex dependencies don't work well with Mastra's workflow builder pattern
// Instead, use the individual agents (profileAnalyzerAgent, contentAnalyzerAgent, etc.) 
// directly in your API routes for more control over data flow

// Placeholder export for backwards compatibility - use the agents directly instead
export const instagramAnalysisWorkflow = null;
