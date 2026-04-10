import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface InstagramProfile {
  username: string;
  name: string;
  biography: string;
  followers: number;
  following: number;
  postsCount: number;
  profilePictureUrl: string;
  verified: boolean;
}

interface InstagramPost {
  id: string;
  caption: string;
  type: string;
  url: string;
  timestamp: string;
  likes: number;
  comments: number;
}

interface EngagementMetrics {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  avgLikes: number;
  avgComments: number;
  totalEngagement: number;
}

interface InstagramAnalysisResponse {
  profile: InstagramProfile;
  posts: InstagramPost[];
  extracted: {
    hashtags: Array<{ tag: string; count: number }>;
    mentions: Array<{ mention: string; count: number }>;
    engagement: EngagementMetrics;
    contentAnalysis: {
      totalHashtagsUsed: number;
      totalMentionsUsed: number;
      averageHashtagsPerPost: number;
      averageMentionsPerPost: number;
    };
  };
}

export const instagramProfileTool = createTool({
  id: 'analyze-instagram-profile',
  description:
    'Analyze an Instagram profile to extract user details, posts, engagement metrics, hashtags, and mentions',
  inputSchema: z.object({
    username: z
      .string()
      .describe('Instagram username (without @ symbol) e.g., "peppa_foodie"'),
  }),
  outputSchema: z.object({
    profile: z.object({
      username: z.string(),
      name: z.string(),
      biography: z.string(),
      followers: z.number(),
      following: z.number(),
      postsCount: z.number(),
      verified: z.boolean(),
    }),
    totalPosts: z.number(),
    engaging: z.number(),
    averageLikesPerPost: z.number(),
    averageCommentsPerPost: z.number(),
    topHashtags: z.array(z.object({ tag: z.string(), count: z.number() })),
    topMentions: z.array(z.object({ mention: z.string(), count: z.number() })),
    contentThemes: z.string(),
  }),
  execute: async (inputData, context) => {
    return await analyzeInstagramProfile(inputData.username);
  },
});

const analyzeInstagramProfile = async (username: string) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const response = await fetch(`${apiUrl}/api/profile/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to analyze profile: ${
          errorData.error?.message || `HTTP ${response.status}`
        }`
      );
    }

    const data = (await response.json()) as { success: boolean; data: InstagramAnalysisResponse };

    if (!data.success || !data.data) {
      throw new Error('Invalid response from Instagram analysis API');
    }

    const analysisData = data.data;

    // Extract top hashtags
    const topHashtags = analysisData.extracted.hashtags.slice(0, 10);

    // Extract top mentions
    const topMentions = analysisData.extracted.mentions.slice(0, 5);

    // Analyze content themes from hashtags
    const contentThemes = topHashtags
      .slice(0, 5)
      .map((h) => h.tag.replace('#', ''))
      .join(', ');

    return {
      profile: {
        username: analysisData.profile.username,
        name: analysisData.profile.name,
        biography: analysisData.profile.biography,
        followers: analysisData.profile.followers,
        following: analysisData.profile.following,
        postsCount: analysisData.profile.postsCount,
        verified: analysisData.profile.verified,
      },
      totalPosts: analysisData.extracted.engagement.totalPosts,
      engaging: analysisData.extracted.engagement.totalEngagement,
      averageLikesPerPost: analysisData.extracted.engagement.avgLikes,
      averageCommentsPerPost: analysisData.extracted.engagement.avgComments,
      topHashtags,
      topMentions,
      contentThemes,
    };
  } catch (error: any) {
    throw new Error(`Instagram profile analysis failed: ${error.message}`);
  }
};
