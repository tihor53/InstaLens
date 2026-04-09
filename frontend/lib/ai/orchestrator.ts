import { mastra } from './mastra-config';
import type {
  InstagramProfile,
  AgentResults,
  ProfileAnalysisResult,
  ContentAnalysisResult,
  AudienceInsightsResult,
  StructuredData,
} from '../types';

export class MastraOrchestrator {
  /**
   * Main analysis entry point
   * Orchestrates the execution of all 4 agents in optimal sequence
   */
  async analyzeProfile(profileData: InstagramProfile): Promise<AgentResults> {
    console.log(`Starting analysis for @${profileData.username}...`);

    // Prepare context for agents
    const profileContext = this.prepareProfileContext(profileData);
    const contentContext = this.prepareContentContext(profileData.posts);

    // Step 1: Run Profile and Content Analysis in parallel
    console.log('Running Profile and Content analysis...');
    const [profileAnalysis, contentAnalysis] = await Promise.all([
      this.runProfileAnalyzer(profileContext),
      this.runContentAnalyzer(contentContext),
    ]);

    // Step 2: Run Audience Analysis (depends on profile + content results)
    console.log('Running Audience analysis...');
    const audienceInsights = await this.runAudienceAnalyzer({
      profile: profileAnalysis,
      content: contentAnalysis,
      rawData: profileData,
    });

    // Step 3: Run Data Structurer (depends on all previous results)
    console.log('Running Data Structuring...');
    const structuredData = await this.runDataStructurer({
      profile: profileAnalysis,
      content: contentAnalysis,
      audience: audienceInsights,
      rawData: profileData,
    });

    console.log(`Analysis complete for @${profileData.username}`);

    return {
      profileAnalysis,
      contentAnalysis,
      audienceInsights,
      structuredData,
    };
  }

  /**
   * Prepare profile context for the Profile Analyzer agent
   */
  private prepareProfileContext(profile: InstagramProfile): string {
    return `
Profile Username: ${profile.username}
Full Name: ${profile.fullName}
Biography: ${profile.biography}
Website: ${profile.website || 'N/A'}
Followers: ${profile.followerCount.toLocaleString()}
Following: ${profile.followingCount.toLocaleString()}
Total Posts: ${profile.postCount}
Is Business Account: ${profile.isBusinessAccount}
Category: ${profile.category || 'N/A'}
Contact Email: ${profile.contactInfo.email || 'N/A'}
Contact Phone: ${profile.contactInfo.phone || 'N/A'}
Contact Address: ${profile.contactInfo.address || 'N/A'}
    `.trim();
  }

  /**
   * Prepare content context for the Content Analyzer agent
   */
  private prepareContentContext(posts: any[]): string {
    if (!posts || posts.length === 0) {
      return 'No posts available for analysis.';
    }

    const postsSummary = posts
      .map((post, idx) => {
        return `
Post ${idx + 1}:
Caption: ${post.caption}
Hashtags: ${post.hashtags.join(', ') || 'None'}
Mentions: ${post.mentions.join(', ') || 'None'}
Likes: ${post.likes}
Comments: ${post.comments}
`;
      })
      .join('\n---\n');

    return `
Recent Posts Analysis:
Total posts analyzed: ${posts.length}

${postsSummary}
    `.trim();
  }

  /**
   * Run the Profile Analyzer agent
   */
  private async runProfileAnalyzer(context: string): Promise<ProfileAnalysisResult> {
    const agent = mastra.agents.profileAnalyzer;

    const prompt = `Analyze this Instagram business profile and extract business identity information:

${context}

Return a JSON object with exactly this structure (no markdown, no extra text):
{
  "businessIdentity": {
    "name": "extracted business name",
    "tagline": "brand tagline or positioning statement",
    "description": "what the business does"
  },
  "classification": {
    "primaryCategory": "main business category",
    "subCategories": ["sub category 1", "sub category 2"],
    "businessModel": "B2C/B2B/D2C/Hybrid",
    "industryTags": ["tag1", "tag2"]
  },
  "branding": {
    "voiceTone": "brand voice description",
    "personality": ["trait1", "trait2"],
    "positioning": "market positioning"
  },
  "location": {
    "city": "city if mentioned or empty",
    "region": "state/region or empty",
    "country": "country or empty",
    "serviceArea": "local/regional/national/international"
  }
}`;

    try {
      const response = await agent.generate(prompt, context);
      return this.parseAgentResponse(response);
    } catch (error) {
      console.error('Profile Analyzer failed:', error);
      throw error;
    }
  }

  /**
   * Run the Content Analyzer agent
   */
  private async runContentAnalyzer(context: string): Promise<ContentAnalysisResult> {
    const agent = mastra.agents.contentAnalyzer;

    const prompt = `Analyze these Instagram posts and identify content patterns:

${context}

Return a JSON object with exactly this structure (no markdown, no extra text):
{
  "contentThemes": [
    {
      "theme": "theme name",
      "frequency": "high/medium/low",
      "examples": ["example 1", "example 2"]
    }
  ],
  "services": [
    {
      "name": "service name",
      "description": "what it offers",
      "mentionCount": 5
    }
  ],
  "productCategories": ["category1", "category2"],
  "callToActions": ["CTA type 1", "CTA type 2"],
  "visualStyle": {
    "aesthetic": "modern/vintage/minimalist/eclectic/professional/casual",
    "colorPalette": ["color theme"],
    "photoStyle": "professional/lifestyle/user-generated/artistic"
  }
}`;

    try {
      const response = await agent.generate(prompt, context);
      return this.parseAgentResponse(response);
    } catch (error) {
      console.error('Content Analyzer failed:', error);
      throw error;
    }
  }

  /**
   * Run the Audience Analyzer agent
   */
  private async runAudienceAnalyzer(context: any): Promise<AudienceInsightsResult> {
    const agent = mastra.agents.audienceAnalyzer;

    const prompt = `Based on this Instagram profile and content analysis, identify audience insights:

Profile Analysis:
${JSON.stringify(context.profile, null, 2)}

Content Analysis:
${JSON.stringify(context.content, null, 2)}

Raw Metrics:
- Followers: ${context.rawData.followerCount}
- Following: ${context.rawData.followingCount}
- Posts: ${context.rawData.postCount}
- Avg Likes: ${this.calculateAvgLikes(context.rawData.posts)}

Return a JSON object with exactly this structure (no markdown, no extra text):
{
  "targetAudience": {
    "demographics": {
      "ageRange": "age range (e.g., 18-35)",
      "interests": ["interest1", "interest2"],
      "lifestyle": "lifestyle description"
    },
    "painPoints": ["pain point 1", "pain point 2"],
    "needsAddressed": ["need 1", "need 2"]
  },
  "engagementPatterns": {
    "postingFrequency": "daily/2-3 times weekly/weekly/less frequent",
    "bestPerformingContentType": "type that gets most engagement",
    "averageEngagementRate": "percentage or ratio",
    "peakEngagementTimes": ["time1", "time2"]
  },
  "communityCharacteristics": {
    "size": "small (< 5K)/medium (5K-50K)/large (50K-500K)/mega (> 500K)",
    "engagement": "high/medium/low",
    "loyaltyIndicators": ["indicator1", "indicator2"]
  },
  "customerJourney": {
    "awarenessContent": "% or description of awareness-stage content",
    "considerationContent": "% or description of consideration-stage content",
    "conversionContent": "% or description of conversion-stage content"
  }
}`;

    try {
      const response = await agent.generate(prompt);
      return this.parseAgentResponse(response);
    } catch (error) {
      console.error('Audience Analyzer failed:', error);
      throw error;
    }
  }

  /**
   * Run the Data Structurer agent
   */
  private async runDataStructurer(context: any): Promise<StructuredData> {
    const agent = mastra.agents.dataStructurer;

    const prompt = `Structure this Instagram analysis into a CRM-ready format suitable for HubSpot, Salesforce, and Google Sheets:

Profile Analysis:
${JSON.stringify(context.profile, null, 2)}

Content Analysis:
${JSON.stringify(context.content, null, 2)}

Audience Insights:
${JSON.stringify(context.audience, null, 2)}

Raw Profile Data:
- Username: ${context.rawData.username}
- Website: ${context.rawData.website}
- Email: ${context.rawData.contactInfo.email}
- Followers: ${context.rawData.followerCount}

Return a comprehensive JSON object with exactly this structure (no markdown, no extra text):
{
  "lead": {
    "companyName": "extracted company/brand name",
    "industry": "identified industry",
    "website": "website URL",
    "email": "contact email or empty string",
    "phone": "contact phone or empty string",
    "socialProfiles": {
      "instagram": {
        "url": "instagram profile URL",
        "followers": numeric follower count,
        "handle": "username without @"
      }
    }
  },
  "enrichmentData": {
    "businessType": "B2C/B2B/D2C/Hybrid",
    "services": ["service1", "service2"],
    "targetMarket": "description of target market",
    "brandVoice": "brand voice description",
    "contentStrategy": "description of content approach",
    "competitorInsights": "identified competitors or similar brands"
  },
  "segmentation": {
    "tags": ["tag1", "tag2", "tag3"],
    "lifecycle": "prospect/customer/advocate/dormant",
    "leadScore": 0-100 numeric score,
    "priority": "high/medium/low"
  },
  "marketingIntel": {
    "contentThemes": ["theme1", "theme2"],
    "engagementRate": "engagement rate percentage",
    "audienceSize": "estimated audience size",
    "growthTrend": "growing/stable/declining"
  }
}`;

    try {
      const response = await agent.generate(prompt);
      return this.parseAgentResponse(response);
    } catch (error) {
      console.error('Data Structurer failed:', error);
      throw error;
    }
  }

  /**
   * Parse and validate JSON response from agent
   */
  private parseAgentResponse(response: any): any {
    try {
      const text = response.text || response.content || response;

      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Try to parse the entire text as JSON
      try {
        return JSON.parse(text);
      } catch (_e) {
        console.warn('Failed to parse as complete JSON, extracting...');
        throw new Error('Response is not valid JSON');
      }
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      console.error('Raw response:', response);
      throw new Error(`Failed to parse agent response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate average likes from posts
   */
  private calculateAvgLikes(posts: any[]): number {
    if (!posts || posts.length === 0) return 0;
    const total = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    return Math.round(total / posts.length);
  }
}

export default MastraOrchestrator;
