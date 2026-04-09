'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PixelDivider from '@/components/PixelDivider';

interface ProfileData {
  profile: {
    id: string;
    username: string;
    name: string;
    biography: string;
    website: string;
    profilePictureUrl: string;
  };
  media: any[];
  extracted: {
    totalPosts: number;
    allHashtags: string[];
    allMentions: string[];
    avgEngagement: number;
  };
}

export default function ExtractionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramUrl = searchParams.get('url');
  const userId = searchParams.get('userId');
  const success = searchParams.get('success');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    // Check if user just authorized via OAuth
    if (success === 'true' && userId) {
      // Fetch profile data using the userId and access token stored in backend
      fetchProfileData(userId);
    } else if (!success || success === 'false') {
      if (success === 'false') {
        setError('OAuth authorization failed. Please try again.');
      }
      setLoading(false);
    }
  }, [userId, success]);

  const fetchProfileData = async (uid: string) => {
    try {
      setLoading(true);

      // Call backend API to analyze the profile
      const response = await fetch('http://localhost:3001/api/profile/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to analyze profile');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError('');
      } else {
        setError(result.error?.message || 'Failed to fetch profile data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
              ANALYZING PROFILE...
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                TOTAL POSTS
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.extracted.totalPosts}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                AVG ENGAGEMENT
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.extracted.avgEngagement}
              </p>
            </div>

            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <p className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] mb-3">
                HASHTAGS USED
              </p>
              <p className="font-grotesk text-[clamp(28px,6vw,48px)] font-bold text-[#F5F5F0]">
                {data.extracted.allHashtags.length}
              </p>
            </div>
          </div>

          {/* Hashtags */}
          {data.extracted.allHashtags.length > 0 && (
            <div className="bg-[#0F0F0F] p-6 md:p-8 mb-8" style={{ border: '2px solid #2D2D2D' }}>
              <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                TOP HASHTAGS
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.extracted.allHashtags.slice(0, 20).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-[#1A1A1A] border border-[#FFD600]/20 text-[#F5F5F0] font-ibm-mono text-[11px] tracking-[1px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mentions */}
          {data.extracted.allMentions.length > 0 && (
            <div className="bg-[#0F0F0F] p-6 md:p-8" style={{ border: '2px solid #2D2D2D' }}>
              <h2 className="font-grotesk text-[20px] font-bold text-[#F5F5F0] tracking-[-0.5px] mb-6">
                COLLABORATIONS & MENTIONS
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.extracted.allMentions.slice(0, 15).map((mention, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-[#1A1A1A] border border-[#FFD600]/20 text-[#F5F5F0] font-ibm-mono text-[11px] tracking-[1px]"
                  >
                    @{mention}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-12" />
        </div>
      </section>

      <PixelDivider />
    </main>
  );
}
