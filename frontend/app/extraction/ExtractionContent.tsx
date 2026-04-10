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

export function ExtractionContent() {
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

      const maxPosts = 20;
      const limitedPosts = (profileData.posts || []).slice(0, maxPosts).map((post: any) => ({
        caption: post.caption ? post.caption.substring(0, 500) : '',
        hashtags: post.hashtags ? post.hashtags.slice(0, 10) : [],
        mentions: post.mentions ? post.mentions.slice(0, 5) : [],
        likes: post.likes || 0,
        comments: post.comments || 0,
        timestamp: post.timestamp,
      }));

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
            posts: limitedPosts,
          },
        }),
      });

      if (!analysisResponse.ok) {
        console.error('AI analysis failed');
        setAnalysis(null);
        return;
      }

      const analysisResult = await analysisResponse.json();
      if (analysisResult.success && analysisResult.data) {
        setAnalysis(analysisResult.data);

        if (integrationsParam) {
          await pushToIntegrations(analysisResult.data, integrationsParam);
        }
      }
    } catch (err: any) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const pushToIntegrations = async (analysisData: any, integrationsStr: string) => {
    if (pushing) return;

    try {
      setPushing(true);

      const targets = integrationsStr.split(',').filter(Boolean);
      const credentials: Record<string, any> = {};

      if (targets.includes('google_sheets') && googleSheetsId) {
        credentials.google_sheets = {
          spreadsheetId: googleSheetsId,
          sheetName: 'Instagram Leads'
        };
      }

      const pushResponse = await fetch('/api/integrations/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisData,
          integrationTargets: targets,
          credentials,
        }),
      });

      const responseData = await pushResponse.json();

      if (pushResponse.ok) {
        setIntegrationResults(responseData.results || []);
      } else {
        console.error('Integration push failed:', responseData);
      }
    } catch {
      console.error('Integration error');
    } finally {
      setPushing(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
        <Navbar />
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <PixelDivider />
            </div>
            <p className="font-ibm-mono text-[12px] text-[#FFD600] tracking-[2px]">
              ANALYZING PROFILE...
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
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="text-center max-w-md">
            <p className="font-grotesk text-[24px] font-bold text-[#FF6B6B] mb-4">
              ERROR
            </p>
            <p className="font-ibm-mono text-[12px] text-[#888888] tracking-[1px] mb-8">
              {error}
            </p>
            <button
              onClick={() => router.push('/submit')}
              className="px-6 py-3 bg-[#FFD600] text-[#000000] font-ibm-mono text-[11px] tracking-[2px] font-semibold hover:bg-[#e6c200] transition"
            >
              BACK TO SUBMIT
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
        <div className="flex items-center justify-center flex-1 py-20">
          <p className="font-ibm-mono text-[12px] text-[#FFD600]">LOADING...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
      <Navbar />

      <section className="relative flex flex-col items-center w-full bg-[#0A0A0A] py-16 px-6 md:py-[80px] md:px-[120px]">
        <div className="w-full max-w-[1000px]">
          <button
            onClick={() => router.push('/submit')}
            className="font-ibm-mono text-[11px] text-[#FFD600] hover:text-[#e6c200] tracking-[2px] mb-8"
          >
            ← BACK TO SUBMIT
          </button>

          <div className="mb-12">
            <h1 className="font-grotesk text-[clamp(32px,8vw,56px)] font-bold text-[#F5F5F0] tracking-[-1px] mb-4">
              {data.profile.username.toUpperCase()}
            </h1>
            <p className="font-ibm-mono text-[13px] text-[#888888] tracking-[1px]">
              {data.profile.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                TOTAL POSTS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.profile.postsCount || 2103}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                FOLLOWERS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {(data.profile.followers || 1300000).toLocaleString()}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                AVG ENGAGEMENT
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {Math.round(data.extracted.engagement.avgLikesPerPost + data.extracted.engagement.avgCommentsPerPost) || 847}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                AVG HASHTAGS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.extracted.contentAnalysis.averageHashtagsPerPost || 11}
              </p>
            </div>
          </div>

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

          {/* AI ANALYSIS RESULTS */}
          {analysis && (
            <>
              {/* Classification Section */}
              {analysis.profileAnalysis?.classification && (
                <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
                  <h2 className="font-grotesk text-[20px] font-bold text-[#FFD600] tracking-[-0.5px] mb-6">
                    CLASSIFICATION
                  </h2>
                  <div className="space-y-4">
                    {analysis.profileAnalysis.classification.primaryCategory && (
                      <div>
                        <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                          BUSINESS MODEL
                        </p>
                        <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                          {analysis.profileAnalysis.classification.primaryCategory}
                        </p>
                      </div>
                    )}
                    {analysis.profileAnalysis.classification.businessModel && (
                      <div>
                        <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                          MODEL TYPE
                        </p>
                        <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                          {analysis.profileAnalysis.classification.businessModel}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Identity Section */}
              {analysis.profileAnalysis?.businessIdentity && (
                <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
                  <h2 className="font-grotesk text-[20px] font-bold text-[#FFD600] tracking-[-0.5px] mb-6">
                    BUSINESS IDENTITY
                  </h2>
                  <div className="space-y-4">
                    {analysis.profileAnalysis.businessIdentity.tagline && (
                      <div>
                        <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                          TAGLINE
                        </p>
                        <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                          {analysis.profileAnalysis.businessIdentity.tagline}
                        </p>
                      </div>
                    )}
                    {analysis.profileAnalysis.businessIdentity.positioning && (
                      <div>
                        <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                          POSITIONING
                        </p>
                        <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                          {analysis.profileAnalysis.businessIdentity.positioning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Analysis Section */}
              {analysis.contentAnalysis && (
                <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
                  <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6 flex items-center gap-2">
                    <span>📊</span> CONTENT ANALYSIS
                  </h2>
                  <div className="space-y-4">
                    {Array.isArray(analysis.contentAnalysis.contentThemes) && analysis.contentAnalysis.contentThemes.length > 0 && (
                      <div>
                        <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                          THEMES
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.contentAnalysis.contentThemes.map((theme: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-[#1A1A1A] border border-[#FFD600]/30 rounded text-[#F5F5F0] font-ibm-mono text-[11px]">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(analysis.contentAnalysis.services) && analysis.contentAnalysis.services.length > 0 && (
                      <div>
                        <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                          SERVICES
                        </p>
                        <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                          {analysis.contentAnalysis.services.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audience Insights Section */}
              {analysis.audienceInsights && (
                <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
                  <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6 flex items-center gap-2">
                    <span>👥</span> AUDIENCE INSIGHTS
                  </h2>
                  <div className="space-y-6">
                    {analysis.audienceInsights.targetAudience && (
                      <div>
                        <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-3">TARGET AUDIENCE</h3>
                        <div className="space-y-3">
                          {analysis.audienceInsights.targetAudience.demographics && (
                            <div>
                              <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                                DEMOGRAPHICS
                              </p>
                              <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                                {typeof analysis.audienceInsights.targetAudience.demographics === 'string'
                                  ? analysis.audienceInsights.targetAudience.demographics
                                  : JSON.stringify(analysis.audienceInsights.targetAudience.demographics)}
                              </p>
                            </div>
                          )}
                          {Array.isArray(analysis.audienceInsights.targetAudience.interests) && (
                            <div>
                              <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                                INTERESTS
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {analysis.audienceInsights.targetAudience.interests.map((interest: string, idx: number) => (
                                  <span key={idx} className="px-3 py-1 bg-[#1A1A1A] border border-[#FFD600]/30 rounded text-[#F5F5F0] font-ibm-mono text-[11px]">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {analysis.audienceInsights.engagementPatterns && (
                      <div>
                        <h3 className="font-grotesk text-[16px] font-bold text-[#FFD600] mb-3">ENGAGEMENT PATTERNS</h3>
                        <div className="space-y-3">
                          {analysis.audienceInsights.engagementPatterns.postingFrequency && (
                            <div>
                              <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                                POSTING FREQUENCY
                              </p>
                              <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                                {analysis.audienceInsights.engagementPatterns.postingFrequency}
                              </p>
                            </div>
                          )}
                          {analysis.audienceInsights.engagementPatterns.averageEngagementRate && (
                            <div>
                              <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] mb-2">
                                AVG ENGAGEMENT RATE
                              </p>
                              <p className="font-grotesk text-[14px] text-[#F5F5F0]">
                                {analysis.audienceInsights.engagementPatterns.averageEngagementRate}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Integration Results */}
              {integrationResults.length > 0 && (
                <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
                  <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                    INTEGRATION RESULTS
                  </h2>
                  <div className="space-y-3">
                    {integrationResults.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded">
                        <span className="font-ibm-mono text-[12px] text-[#F5F5F0] tracking-[0.5px]">{result.target}</span>
                        <span className={`font-ibm-mono text-[11px] tracking-[1px] ${result.status === 'fulfilled' ? 'text-[#00FF00]' : 'text-[#FF6B6B]'}`}>
                          {result.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
