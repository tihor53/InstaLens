'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PixelDivider from '@/components/PixelDivider';

interface ProfileData {
  profile: {
    username: string;
    name: string;
    biography: string;
    followers: number;
    following: number;
    postsCount: number;
    profilePictureUrl: string;
    verified: boolean;
  };
  posts: Array<{
    id: string;
    caption: string;
    type: string;
    url: string;
    timestamp: string;
    likes: number;
    comments: number;
  }>;
  extracted: {
    hashtags: Array<{ tag: string; count: number }>;
    mentions: Array<{ mention: string; count: number }>;
    engagement: {
      totalLikes: number;
      totalComments: number;
      avgLikesPerPost: number;
      avgCommentsPerPost: number;
      totalEngagement: number;
    };
    contentAnalysis: {
      totalHashtagsUsed: number;
      totalMentionsUsed: number;
      averageHashtagsPerPost: number;
      averageMentionsPerPost: number;
    };
  };
}

interface AnalysisResult {
  profileAnalysis?: any;
  contentAnalysis?: any;
  audienceInsights?: any;
  structuredData?: any;
}

interface IntegrationResult {
  target: string;
  status: 'fulfilled' | 'rejected';
  data?: any;
  error?: string;
}

export default function ExtractionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramHandle = searchParams.get('username') || searchParams.get('handle');
  const integrationsParam = searchParams.get('integrations');
  const googleSheetsId = searchParams.get('googleSheetsId');
  const hubspotListId = searchParams.get('hubspotListId');

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ProfileData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [integrationResults, setIntegrationResults] = useState<IntegrationResult[]>([]);

  useEffect(() => {
    if (instagramHandle) {
      fetchProfileData(instagramHandle);
    } else {
      setError('No Instagram username provided. Please go back and submit a profile.');
    }
  }, [instagramHandle]);

  const fetchProfileData = async (username: string) => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Fetch raw profile data from backend
      const profileResponse = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error?.message || 'Failed to analyze profile');
      }

      const profileResult = await profileResponse.json();
      if (profileResult.success && profileResult.data) {
        setData(profileResult.data);

        // Step 2: Run AI analysis on the profile data
        await runAIAnalysis(profileResult.data, username);
      } else {
        setError(profileResult.error?.message || 'Failed to fetch profile data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze profile. Please try again.');
      console.error('Profile analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async (profileData: any, username: string) => {
    try {
      setAnalyzing(true);
      console.log('🤖 Starting AI analysis for:', username);

      // Run AI agents on the profile data
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileData: {
            username: profileData.profile.username,
            fullName: profileData.profile.name,
            biography: profileData.profile.biography,
            followerCount: profileData.profile.followers,
            followingCount: profileData.profile.following,
            postCount: profileData.profile.postsCount,
            isBusinessAccount: !!profileData.profile.verified,
            category: profileData.profile.category || '',
            posts: profileData.posts,
          },
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        console.error('❌ AI analysis failed:', errorData);
        // Don't fail the whole page if AI fails - just skip integration push
        setAnalysis(null);
        console.warn('⚠️ Skipping AI-powered insights. Proceeding with basic profile data.');
        return;
      }

      const analysisResult = await analysisResponse.json();
      console.log('✅ AI analysis complete:', analysisResult);
      console.log('⚠️ Analysis warnings:', analysisResult.warning);
      
      if (analysisResult.success && analysisResult.data) {
        setAnalysis(analysisResult.data);
        
        // Log whether we have AI-generated data or fallback data
        if (analysisResult.warning) {
          console.warn('⚠️ Warning from API:', analysisResult.warning);
          if (!analysisResult.data.structuredData) {
            console.log('✅ Using fallback structured data (no AI fields available)');
          } else {
            console.log('📊 Structured data prepared:', analysisResult.data.structuredData);
          }
        } else {
          console.log('📊 Structured data prepared:', analysisResult.data.structuredData);
        }

        // Step 3: Push to integrations if selected
        if (integrationsParam) {
          console.log('🔗 Pushing to integrations:', integrationsParam);
          await pushToIntegrations(
            analysisResult.data.structuredData,
            integrationsParam
          );
        } else {
          console.log('ℹ️ No integrations selected');
        }
      }
    } catch (err: any) {
      console.error('❌ AI analysis error:', err);
      // Don't block the page if AI analysis fails
    } finally {
      setAnalyzing(false);
    }
  };

  const pushToIntegrations = async (
    structuredData: any,
    integrationsStr: string
  ) => {
    try {
      setPushing(true);
      console.log('🔗 Starting integration push for:', integrationsStr);

      const targets = integrationsStr.split(',').filter(Boolean);
      const credentials: Record<string, any> = {};

      console.log('📋 Selected targets:', targets);

      // Build credentials object based on selected integrations
      if (targets.includes('google_sheets')) {
        if (!googleSheetsId) {
          console.warn('⚠️ Google Sheets selected but no ID provided');
        } else {
          credentials.google_sheets = {
            spreadsheetId: googleSheetsId,
            sheetName: 'Instagram Leads'
          };
          console.log('✅ Google Sheets credentials set:', { spreadsheetId: googleSheetsId });
        }
      }

      if (targets.includes('hubspot')) {
        if (!hubspotListId) {
          console.warn('⚠️ HubSpot selected but no List ID provided');
        } else {
          credentials.hubspot = {
            listId: hubspotListId,
          };
          console.log('✅ HubSpot credentials set:', { listId: hubspotListId });
        }
      }

      // For other integrations, use environment variable defaults
      if (targets.includes('bigquery')) {
        credentials.bigquery = {
          projectId: process.env.NEXT_PUBLIC_BIGQUERY_PROJECT_ID,
          datasetId: process.env.NEXT_PUBLIC_BIGQUERY_DATASET_ID,
        };
        console.log('ℹ️ BigQuery config set from env vars');
      }

      if (targets.includes('mailchimp')) {
        credentials.mailchimp = {
          listId: process.env.NEXT_PUBLIC_MAILCHIMP_LIST_ID,
        };
        console.log('ℹ️ Mailchimp config set from env vars');
      }

      if (targets.includes('salesforce')) {
        credentials.salesforce = {
          instanceUrl: process.env.NEXT_PUBLIC_SALESFORCE_INSTANCE_URL,
        };
        console.log('ℹ️ Salesforce config set from env vars');
      }

      console.log('📤 Calling /api/integrations/push with credentials keys:', Object.keys(credentials));

      const pushResponse = await fetch('/api/integrations/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structuredData,
          integrationTargets: targets,
          credentials,
        }),
      });

      const responseData = await pushResponse.json();
      console.log('📥 Push response status:', pushResponse.status);
      console.log('📥 Push response data:', responseData);

      if (!pushResponse.ok) {
        console.error('❌ Integration push failed (HTTP ' + pushResponse.status + '):', responseData);
        setIntegrationResults([
          {
            target: 'error',
            status: 'rejected',
            error: responseData.error?.message || `HTTP ${pushResponse.status}: ${responseData.error?.invalidTargets?.join(', ') || 'Unknown error'}`,
          },
        ]);
        return;
      }

      if (responseData.success && responseData.data.results) {
        console.log('✅ Integration push succeeded:', responseData.data.results);
        setIntegrationResults(responseData.data.results);
      }
    } catch (err: any) {
      console.error('❌ Integration push error:', err);
      setIntegrationResults([
        {
          target: 'error',
          status: 'rejected',
          error: err.message || 'Failed to push to integrations',
        },
      ]);
    } finally {
      setPushing(false);
    }
  };

  if (loading || analyzing || pushing) {
    return (
      <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-[#FFD600] mx-auto" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="font-grotesk text-[18px] font-bold text-[#F5F5F0] mt-6">
              {loading
                ? 'EXTRACTING PROFILE...'
                : analyzing
                ? 'RUNNING AI ANALYSIS...'
                : 'PUSHING TO INTEGRATIONS...'}
            </p>
            <p className="font-ibm-mono text-[12px] text-[#888888] mt-2 tracking-[1px]">
              THIS MAY TAKE A FEW MOMENTS
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-md">
            <p className="font-ibm-mono text-[13px] text-[#FF6B6B] tracking-[1px] mb-6">
              ⚠ {error}
            </p>
            <button
              onClick={() => router.push('/submit')}
              className="font-grotesk text-[12px] font-bold text-[#FFD600] hover:text-[#e6c200] tracking-[2px]"
            >
              ← TRY ANOTHER PROFILE
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-md">
            <p className="font-ibm-mono text-[13px] text-[#FF6B6B] tracking-[1px] mb-6">
              NO PROFILE DATA FOUND
            </p>
            <button
              onClick={() => router.push('/submit')}
              className="font-grotesk text-[12px] font-bold text-[#FFD600] hover:text-[#e6c200] tracking-[2px]"
            >
              ← TRY ANOTHER PROFILE
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
      <Navbar />

      <section className="relative flex flex-col items-center w-full bg-[#0A0A0A] py-16 px-6 md:py-[80px] md:px-[120px]">
        <div className="w-full max-w-[1000px]">
          {/* Back Button */}
          <button
            onClick={() => router.push('/submit')}
            className="font-ibm-mono text-[11px] text-[#FFD600] hover:text-[#e6c200] tracking-[2px] mb-8"
          >
            ← BACK TO SUBMIT
          </button>

          {/* Profile Header */}
          <div className="mb-12">
            <h1 className="font-grotesk text-[clamp(32px,8vw,56px)] font-bold text-[#F5F5F0] tracking-[-1px] mb-4">
              {data.profile.username.toUpperCase()}
            </h1>
            <p className="font-ibm-mono text-[13px] text-[#888888] tracking-[1px]">
              {data.profile.name}
            </p>
            {data.profile.biography && (
              <p className="font-ibm-mono text-[12px] text-[#666666] tracking-[0.5px] mt-3 leading-relaxed">
                {data.profile.biography}
              </p>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                TOTAL POSTS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.profile.postsCount}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                FOLLOWERS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.profile.followers.toLocaleString()}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                AVG ENGAGEMENT
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {Math.round(data.extracted.engagement.avgLikesPerPost + data.extracted.engagement.avgCommentsPerPost)}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                AVG HASHTAGS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.extracted.contentAnalysis.averageHashtagsPerPost}
              </p>
            </div>
          </div>

          {/* Hashtags */}
          {data.extracted.hashtags.length > 0 && (
            <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
              <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                TOP HASHTAGS
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.extracted.hashtags.slice(0, 20).map((item, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-[#1A1A1A] border border-[#FFD600]/30 rounded-sm text-[#F5F5F0] font-ibm-mono text-[11px] tracking-[1px]"
                  >
                    <span className="text-[#FFD600]">#{item.tag}</span>
                    <span className="text-[#888888] ml-2">({item.count}x)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mentions */}
          {data.extracted.mentions.length > 0 && (
            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                TOP COLLABORATIONS & MENTIONS
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.extracted.mentions.slice(0, 15).map((item, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-[#1A1A1A] border border-[#FFD600]/20 text-[#F5F5F0] font-ibm-mono text-[11px] tracking-[1px]"
                  >
                    <span className="text-[#FFD600]">@{item.mention}</span>
                    <span className="text-[#888888] ml-2">({item.count}x)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {analysis && (
            <>
              <div className="h-12" />

              {/* Business Identity Section */}
              {analysis.profileAnalysis && (
                <div className="mb-8">
                  <h2 className="font-grotesk text-[24px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                    🏢 BUSINESS INTELLIGENCE
                  </h2>

                  {/* Business Classification */}
                  {analysis.profileAnalysis.classification && (
                    <div className="bg-[#0F0F0F] p-6 md:p-8 mb-6" style={{ border: '2px solid #2D2D2D' }}>
                      <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-4">
                        CLASSIFICATION
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysis.profileAnalysis.classification.primaryCategory && (
                          <div>
                            <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                              PRIMARY CATEGORY
                            </p>
                            <p className="font-grotesk text-[14px] font-bold text-[#F5F5F0]">
                              {analysis.profileAnalysis.classification.primaryCategory}
                            </p>
                          </div>
                        )}
                        {analysis.profileAnalysis.classification.businessModel && (
                          <div>
                            <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                              BUSINESS MODEL
                            </p>
                            <p className="font-grotesk text-[14px] font-bold text-[#F5F5F0]">
                              {analysis.profileAnalysis.classification.businessModel}
                            </p>
                          </div>
                        )}
                      </div>
                      {analysis.profileAnalysis.classification.subCategories &&
                        analysis.profileAnalysis.classification.subCategories.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[#2D2D2D]">
                            <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-3">
                              SUB-CATEGORIES
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.profileAnalysis.classification.subCategories.map(
                                (cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-[#1A1A1A] border border-[#FFD600]/30 text-[#F5F5F0] font-ibm-mono text-[11px] rounded"
                                  >
                                    {cat}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Business Identity */}
                  {analysis.profileAnalysis.businessIdentity && (
                    <div className="bg-[#0F0F0F] p-6 md:p-8 mb-6" style={{ border: '2px solid #2D2D2D' }}>
                      <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-4">
                        BUSINESS IDENTITY
                      </h3>
                      {analysis.profileAnalysis.businessIdentity.description && (
                        <p className="font-ibm-mono text-[12px] text-[#888888] leading-relaxed mb-4">
                          {analysis.profileAnalysis.businessIdentity.description}
                        </p>
                      )}
                      {analysis.profileAnalysis.businessIdentity.tagline && (
                        <div className="p-3 bg-[#1A1A1A] border-l-4 border-[#FFD600]">
                          <p className="font-grotesk text-[13px] font-bold text-[#F5F5F0] italic">
                            "{analysis.profileAnalysis.businessIdentity.tagline}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Content & Services Section */}
              {analysis.contentAnalysis && (
                <div className="mb-8">
                  <h2 className="font-grotesk text-[24px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                    📱 CONTENT ANALYSIS
                  </h2>

                  {/* Services */}
                  {analysis.contentAnalysis.services &&
                    analysis.contentAnalysis.services.length > 0 && (
                      <div className="bg-[#0F0F0F] p-6 md:p-8 mb-6" style={{ border: '2px solid #2D2D2D' }}>
                        <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-4">
                          SERVICES OFFERED
                        </h3>
                        <div className="space-y-4">
                          {analysis.contentAnalysis.services.map((service: any, idx: number) => (
                            <div key={idx} className="p-3 bg-[#1A1A1A] border border-[#2D2D2D]">
                              <p className="font-grotesk text-[12px] font-bold text-[#FFD600] mb-1">
                                {service.name}
                              </p>
                              <p className="font-ibm-mono text-[11px] text-[#888888]">
                                {service.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Content Themes */}
                  {analysis.contentAnalysis.contentThemes &&
                    analysis.contentAnalysis.contentThemes.length > 0 && (
                      <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
                        <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-4">
                          CONTENT THEMES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {analysis.contentAnalysis.contentThemes.map((theme: any, idx: number) => (
                            <div key={idx} className="p-3 bg-[#1A1A1A]">
                              <p className="font-grotesk text-[12px] font-bold text-[#FFD600]">
                                {theme.theme}
                              </p>
                              <p className="font-ibm-mono text-[10px] text-[#888888] mt-1 capitalize">
                                Frequency: {theme.frequency}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Audience Insights Section */}
              {analysis.audienceInsights && (
                <div className="mb-8">
                  <h2 className="font-grotesk text-[24px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                    👥 AUDIENCE INSIGHTS
                  </h2>

                  {/* Target Audience */}
                  {analysis.audienceInsights.targetAudience && (
                    <div className="bg-[#0F0F0F] p-6 md:p-8 mb-6" style={{ border: '2px solid #2D2D2D' }}>
                      <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-4">
                        TARGET AUDIENCE
                      </h3>
                      {analysis.audienceInsights.targetAudience.demographics && (
                        <div className="mb-4">
                          <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                            DEMOGRAPHICS
                          </p>
                          <p className="font-grotesk text-[13px] text-[#F5F5F0] mb-2">
                            {analysis.audienceInsights.targetAudience.demographics.ageRange}
                          </p>
                          {analysis.audienceInsights.targetAudience.demographics.interests && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {analysis.audienceInsights.targetAudience.demographics.interests.map(
                                (interest: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-[#1A1A1A] border border-[#FFD600]/20 text-[#F5F5F0] font-ibm-mono text-[10px]"
                                  >
                                    {interest}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engagement Patterns */}
                  {analysis.audienceInsights.engagementPatterns && (
                    <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
                      <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-4">
                        ENGAGEMENT PATTERNS
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysis.audienceInsights.engagementPatterns.postingFrequency && (
                          <div>
                            <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                              POSTING FREQUENCY
                            </p>
                            <p className="font-grotesk text-[14px] font-bold text-[#FFD600]">
                              {analysis.audienceInsights.engagementPatterns.postingFrequency}
                            </p>
                          </div>
                        )}
                        {analysis.audienceInsights.engagementPatterns.averageEngagementRate && (
                          <div>
                            <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                              AVG ENGAGEMENT RATE
                            </p>
                            <p className="font-grotesk text-[14px] font-bold text-[#FFD600]">
                              {analysis.audienceInsights.engagementPatterns.averageEngagementRate}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Integration Status Section */}
              {integrationResults.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-grotesk text-[24px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                    🔗 INTEGRATION STATUS
                  </h2>

                  <div className="space-y-4">
                    {integrationResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-4 border-l-4 ${
                          result.status === 'fulfilled'
                            ? 'bg-[#1A3D1A] border-[#4ade80]'
                            : 'bg-[#3D1A1A] border-[#FF6B6B]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={result.status === 'fulfilled' ? 'text-[#4ade80]' : 'text-[#FF6B6B]'}>
                              {result.status === 'fulfilled' ? '✓' : '✕'}
                            </span>
                            <div>
                              <p className="font-grotesk text-[13px] font-bold text-[#F5F5F0] capitalize">
                                {result.target}
                              </p>
                              {result.status === 'fulfilled' ? (
                                <p className="font-ibm-mono text-[11px] text-[#4ade80]">
                                  Successfully synced
                                </p>
                              ) : (
                                <p className="font-ibm-mono text-[11px] text-[#FF6B6B]">
                                  {result.error || 'Failed'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="h-12" />
        </div>
      </section>

      <PixelDivider />
    </main>
  );
}
