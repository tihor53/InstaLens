import type {
  InstagramProfile,
  AgentResults,
  ProfileAnalysisResult,
  ContentAnalysisResult,
  AudienceInsightsResult,
  StructuredData,
} from '../types';

/**
 * Frontend AI Orchestrator
 * Calls the backend /api/ai/analyze endpoint where Mastra runs with DuckDB support
 * 
 * The actual Mastra agents run on the backend (Node.js) to avoid webpack issues
 * with DuckDB native bindings (.node files) that can't be bundled for the browser.
 */
export class MastraOrchestrator {
  private backendUrl: string;

  constructor(backendUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window === 'undefined' ? 'http://localhost:5000' : 'http://localhost:5000')) {
    this.backendUrl = backendUrl;
  }

  /**
   * Main analysis entry point
   * Calls the backend endpoint where Mastra workflow runs
   */
  async analyzeProfile(profileData: InstagramProfile): Promise<AgentResults> {
    console.log(`🤖 [MastraOrchestrator] Starting analysis for @${profileData.username}...`);

    try {
      // Validate input data
      if (!profileData.username) {
        throw new Error('Username is required');
      }

      console.log(`📊 [MastraOrchestrator] Profile data received:`, {
        username: profileData.username,
        followers: profileData.followerCount,
        posts: profileData.posts?.length,
      });

      console.log(`🌐 [MastraOrchestrator] Calling backend at ${this.backendUrl}/api/ai/analyze...`);

      // Call the backend AI endpoint
      const response = await fetch(`${this.backendUrl}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: {
            username: profileData.username,
            fullName: profileData.fullName,
            biography: profileData.biography,
            website: profileData.website,
            followerCount: profileData.followerCount,
            followingCount: profileData.followingCount,
            postCount: profileData.postCount,
            isBusinessAccount: profileData.isBusinessAccount,
            category: profileData.category,
            contactInfo: profileData.contactInfo,
            posts: profileData.posts,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ [MastraOrchestrator] Analysis complete for @${profileData.username}`);
      console.log(`📋 [MastraOrchestrator] Analysis structure:`, {
        hasProfileAnalysis: !!result.data?.profileAnalysis,
        hasContentAnalysis: !!result.data?.contentAnalysis,
        hasAudienceInsights: !!result.data?.audienceInsights,
        hasStructuredData: !!result.data?.structuredData,
      });

      if (result.data) {
        return {
          profileAnalysis: result.data.profileAnalysis || this.getFallbackProfileAnalysis(profileData),
          contentAnalysis: result.data.contentAnalysis || this.getFallbackContentAnalysis(profileData.posts),
          audienceInsights: result.data.audienceInsights || this.getFallbackAudienceInsights(profileData),
          structuredData: result.data.structuredData || this.getFallbackStructuredData(profileData, result.data.profileAnalysis, result.data.contentAnalysis),
        };
      }

      throw new Error('Invalid response format from backend');
    } catch (error) {
      console.error('❌ [MastraOrchestrator] Critical error:', error);
      
      // Return complete fallback data so pipeline doesn't break
      return {
        profileAnalysis: this.getFallbackProfileAnalysis(profileData),
        contentAnalysis: this.getFallbackContentAnalysis(profileData.posts),
        audienceInsights: this.getFallbackAudienceInsights(profileData),
        structuredData: this.getFallbackStructuredData(profileData, null, null),
      };
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

  /**
   * Fallback Profile Analysis when agent fails
   */
  private getFallbackProfileAnalysis(profile: InstagramProfile): ProfileAnalysisResult {
    const businessType = profile.isBusinessAccount ? 'business' : 'creator';
    const category = profile.category || 'General';
    
    return {
      businessIdentity: {
        name: profile.username,
        tagline: profile.biography?.substring(0, 50) || `${businessType} profile`,
        description: profile.biography || `Instagram ${businessType} account`
      },
      classification: {
        primaryCategory: category,
        subCategories: [],
        businessModel: 'D2C',
        industryTags: [profile.category || 'uncategorized'].filter(Boolean),
      },
      branding: {
        voiceTone: 'Professional',
        personality: ['engaged', 'active'],
        positioning: 'Social media presence'
      },
      location: {
        city: '',
        region: '',
        country: '',
        serviceArea: 'national'
      }
    };
  }

  /**
   * Fallback Content Analysis when agent fails
   */
  private getFallbackContentAnalysis(posts: any[]): ContentAnalysisResult {
    const postCount = posts?.length || 0;
    const totalLikes = posts?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0;
    const totalComments = posts?.reduce((sum, p) => sum + (p.comments || 0), 0) || 0;
    
    return {
      contentThemes: [
        {
          theme: 'main content',
          frequency: 'high',
          examples: posts?.slice(0, 3).map(p => p.caption?.substring(0, 30)) || []
        }
      ],
      services: [],
      productCategories: [],
      callToActions: [],
      visualStyle: {
        aesthetic: 'professional',
        colorPalette: [],
        photoStyle: 'lifestyle'
      }
    };
  }

  /**
   * Fallback Audience Insights when agent fails
   */
  private getFallbackAudienceInsights(profile: InstagramProfile): AudienceInsightsResult {
    const followerCount = profile.followerCount || 0;
    let audienceSize = 'small';
    if (followerCount > 500000) audienceSize = 'mega';
    else if (followerCount > 50000) audienceSize = 'large';
    else if (followerCount > 5000) audienceSize = 'medium';
    
    return {
      targetAudience: {
        demographics: {
          ageRange: '18-45',
          interests: [],
          lifestyle: 'Digital-first'
        },
        painPoints: [],
        needsAddressed: []
      },
      engagementPatterns: {
        postingFrequency: 'regular',
        bestPerformingContentType: 'mixed',
        averageEngagementRate: '2-5%',
        peakEngagementTimes: []
      },
      communityCharacteristics: {
        size: audienceSize,
        engagement: 'moderate',
        loyaltyIndicators: []
      },
      customerJourney: {
        awarenessContent: '40%',
        considerationContent: '35%',
        conversionContent: '25%'
      }
    };
  }

  /**
   * Fallback Structured Data when agent fails
   */
  private getFallbackStructuredData(
    profile: InstagramProfile,
    profileAnalysis?: ProfileAnalysisResult | null,
    contentAnalysis?: ContentAnalysisResult | null
  ): StructuredData {
    const businessName = profileAnalysis?.businessIdentity?.name || profile.username;
    const category = profile.category || 'uncategorized';
    
    return {
      lead: {
        companyName: businessName,
        industry: category,
        website: profile.website || '',
        email: profile.contactInfo?.email || '',
        phone: profile.contactInfo?.phone || '',
        socialProfiles: {
          instagram: {
            url: `https://instagram.com/${profile.username}`,
            followers: profile.followerCount,
            handle: profile.username
          }
        }
      },
      enrichmentData: {
        businessType: profile.isBusinessAccount ? 'B2C' : 'Creator',
        services: contentAnalysis?.services?.map(s => s.name) || [],
        targetMarket: 'General audience',
        brandVoice: 'Professional',
        contentStrategy: 'Regular posting',
        competitorInsights: 'Monitor Instagram landscape'
      },
      segmentation: {
        tags: [category, profile.isBusinessAccount ? 'business' : 'creator'],
        lifecycle: 'prospect',
        leadScore: Math.min(100, Math.round((profile.followerCount / 10000) * 10)),
        priority: profile.followerCount > 10000 ? 'high' : profile.followerCount > 1000 ? 'medium' : 'low'
      },
      marketingIntel: {
        contentThemes: [],
        engagementRate: this.calculateAvgEngagementRate(profile.posts),
        audienceSize: profile.followerCount.toLocaleString(),
        growthTrend: 'stable'
      }
    };
  }

  /**
   * Calculate average engagement rate
   */
  private calculateAvgEngagementRate(posts: any[]): string {
    if (!posts || posts.length === 0) return '0%';
    
    const avgLikes = this.calculateAvgLikes(posts);
    const avgComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length;
    
    // Simplified engagement calculation (likes + comments / 1000 followers as baseline)
    const avgEngagement = avgLikes + avgComments;
    const rate = Math.min(100, Math.round(avgEngagement / 100));
    
    return `${rate}%`;
  }
}

export default MastraOrchestrator;
