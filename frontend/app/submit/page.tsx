'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PixelDivider from '@/components/PixelDivider';

export default function SubmitPage() {
  const router = useRouter();
  const [instagramUrl, setInstagramUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInstagramUrl = (url: string): boolean => {
    const instagramRegex =
      /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?$/;
    return instagramRegex.test(url.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = instagramUrl.trim();

    if (!trimmedUrl) {
      setError('Please enter an Instagram URL');
      return;
    }

    if (!validateInstagramUrl(trimmedUrl)) {
      setError('Please enter a valid Instagram profile URL (e.g., instagram.com/username)');
      return;
    }

    let normalizedUrl = trimmedUrl;
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setLoading(true);
    
    // Redirect to backend OAuth with the profile URL to analyze after login
    const extractUrl = encodeURIComponent(`/extraction?url=${encodeURIComponent(normalizedUrl)}`);
    window.location.href = `http://localhost:3001/api/auth/instagram?redirect=${extractUrl}`;
  };

  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center w-full bg-[#0A0A0A] py-16 px-6 md:py-[80px] md:px-[120px] overflow-hidden">
        {/* Badge */}
        <div className="flex items-center justify-center gap-[8px] h-[32px] px-[12px] md:px-[16px] bg-[#1A1A1A] border-2 border-[#FFD600]">
          <div className="w-[8px] h-[8px] bg-[#FFD600] shrink-0" />
          <span className="font-ibm-mono text-[9px] md:text-[11px] font-bold text-[#FFD600] tracking-[1px] md:tracking-[2px] whitespace-nowrap">
            INSTAGRAM PROFILE ANALYZER
          </span>
        </div>

        <div className="h-8 md:h-[32px]" />

        {/* Headline */}
        <h1 className="font-grotesk text-[clamp(36px,8vw,72px)] font-bold text-[#F5F5F0] tracking-[-1px] leading-none text-center w-full max-w-[900px]">
          PASTE YOUR INSTAGRAM PROFILE
        </h1>

        <div className="h-4 md:h-[16px]" />

        {/* Subheading */}
        <p className="font-ibm-mono text-[13px] md:text-[15px] text-[#888888] tracking-[1px] leading-[1.6] text-center w-full max-w-[700px]">
          ENTER ANY PUBLIC INSTAGRAM BUSINESS OR CREATOR PROFILE TO EXTRACT INSIGHTS.
        </p>

        <div className="h-10 md:h-[48px]" />

        {/* Form Container */}
        <div className="w-full max-w-[600px] bg-[#0F0F0F] p-8 md:p-10" style={{ border: "2px solid #2D2D2D" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input */}
            <div>
              <label htmlFor="instagram-url" className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] block mb-3">
                INSTAGRAM PROFILE URL
              </label>
              <input
                id="instagram-url"
                type="text"
                value={instagramUrl}
                onChange={(e) => {
                  setInstagramUrl(e.target.value);
                  setError('');
                }}
                placeholder="e.g., instagram.com/username"
                className="w-full px-4 md:px-6 py-3 md:py-4 bg-[#1A1A1A] border-2 border-[#2D2D2D] text-[#F5F5F0] placeholder-[#666666] font-ibm-mono text-[13px] focus:outline-none focus:border-[#FFD600] transition-colors disabled:opacity-50"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 md:p-4 bg-[#3D1A1A] border-2 border-[#FF6B6B]">
                <p className="font-ibm-mono text-[12px] text-[#FF6B6B] tracking-[0.5px]">
                  ⚠ {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-[#FFD600] hover:bg-[#e6c200] disabled:bg-[#666666] text-[#0A0A0A] font-grotesk text-[12px] md:text-[13px] font-bold tracking-[2px] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  ANALYZING...
                </span>
              ) : (
                'START ANALYSIS'
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 pt-8 border-t-2 border-[#2D2D2D]">
            <div className="flex gap-3">
              <span className="text-[#FFD600] text-lg shrink-0">💡</span>
              <p className="font-ibm-mono text-[11px] md:text-[12px] text-[#888888] tracking-[0.5px] leading-relaxed">
                Paste any public Instagram business or creator profile URL to extract detailed intelligence including business type, content themes, hashtag analysis, engagement metrics, and AI-powered recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="h-12 md:h-[64px]" />
      </section>

      {/* Divider */}
      <PixelDivider />
    </main>
  );
}
