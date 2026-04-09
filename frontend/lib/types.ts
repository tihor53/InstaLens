// Instagram Profile Data Types

export interface PostData {
  caption: string;
  hashtags: string[];
  mentions: string[];
  imageUrl: string;
  likes: number;
  comments: number;
  timestamp: Date;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  website: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isBusinessAccount: boolean;
  category: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  posts: PostData[];
}

// Agent Analysis Results

export interface BusinessIdentity {
  name: string;
  tagline: string;
  description: string;
}

export interface Classification {
  primaryCategory: string;
  subCategories: string[];
  businessModel: string;
  industryTags: string[];
}

export interface Branding {
  voiceTone: string;
  personality: string[];
  positioning: string;
}

export interface Location {
  city?: string;
  region?: string;
  country?: string;
  serviceArea: string;
}

export interface ProfileAnalysisResult {
  businessIdentity: BusinessIdentity;
  classification: Classification;
  branding: Branding;
  location: Location;
}

export interface Service {
  name: string;
  description: string;
  mentionCount: number;
}

export interface ContentTheme {
  theme: string;
  frequency: 'high' | 'medium' | 'low';
  examples: string[];
}

export interface VisualStyle {
  aesthetic: string;
  colorPalette: string[];
  photoStyle: string;
}

export interface ContentAnalysisResult {
  contentThemes: ContentTheme[];
  services: Service[];
  productCategories: string[];
  callToActions: string[];
  visualStyle: VisualStyle;
}

export interface Demographics {
  ageRange: string;
  interests: string[];
  lifestyle: string;
}

export interface EngagementPatterns {
  postingFrequency: string;
  bestPerformingContentType: string;
  averageEngagementRate: string;
  peakEngagementTimes: string[];
}

export interface CommunityCharacteristics {
  size: string;
  engagement: string;
  loyaltyIndicators: string[];
}

export interface CustomerJourney {
  awarenessContent: string;
  considerationContent: string;
  conversionContent: string;
}

export interface AudienceInsightsResult {
  targetAudience: {
    demographics: Demographics;
    painPoints: string[];
    needsAddressed: string[];
  };
  engagementPatterns: EngagementPatterns;
  communityCharacteristics: CommunityCharacteristics;
  customerJourney: CustomerJourney;
}

// Lead Data for CRM

export interface Lead {
  companyName: string;
  industry: string;
  website: string;
  email?: string;
  phone?: string;
  socialProfiles: {
    instagram: {
      url: string;
      followers: number;
      handle: string;
    };
  };
}

export interface EnrichmentData {
  businessType: string;
  services: string[];
  targetMarket: string;
  brandVoice: string;
  contentStrategy: string;
  competitorInsights: string;
}

export interface Segmentation {
  tags: string[];
  lifecycle: string;
  leadScore: number;
  priority: 'high' | 'medium' | 'low';
}

export interface MarketingIntel {
  contentThemes: string[];
  engagementRate: string;
  audienceSize: string;
  growthTrend: string;
}

export interface StructuredData {
  lead: Lead;
  enrichmentData: EnrichmentData;
  segmentation: Segmentation;
  marketingIntel: MarketingIntel;
}

// Full Agent Results

export interface AgentResults {
  profileAnalysis: ProfileAnalysisResult;
  contentAnalysis: ContentAnalysisResult;
  audienceInsights: AudienceInsightsResult;
  structuredData: StructuredData;
}

// API Response

export interface AnalysisResponse {
  success: boolean;
  data?: {
    profile: {
      username: string;
      followers: number;
      posts: number;
    };
    analysis: {
      businessIdentity: BusinessIdentity;
      classification: Classification;
      services: Service[];
      contentThemes: ContentTheme[];
      targetAudience: any;
      engagement: EngagementPatterns;
    };
    structuredData: StructuredData;
    integrations?: Array<{
      target: string;
      status: 'fulfilled' | 'rejected';
      data: any;
      error: string | null;
    }>;
  };
  error?: string;
  timestamp: string;
}

// Extended Response Format for Frontend

export interface ExtractedData {
  business_type: string;
  category: string;
  description: string;
  services: string[];
  content_themes: string[];
  target_audience: string[];
  tone: string;
  engagement_score: number;
  lead_quality: string;
  growth_potential: string;
  crm_tags: string[];
  competitor_signals: string[];
  recommended_action: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
}
