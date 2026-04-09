'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PixelDivider from '@/components/PixelDivider';

type IntegrationTarget = 'google_sheets' | 'hubspot' | 'bigquery' | 'mailchimp' | 'salesforce';

export default function SubmitPage() {
  const router = useRouter();
  const [instagramUrl, setInstagramUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIntegrations, setSelectedIntegrations] = useState<IntegrationTarget[]>([]);
  const [googleSheetsId, setGoogleSheetsId] = useState('');
  const [hubspotListId, setHubspotListId] = useState('');

  const validateInstagramUrl = (url: string): boolean => {
    const instagramRegex =
      /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?$/;
    return instagramRegex.test(url.trim());
  };

  const toggleIntegration = (target: IntegrationTarget) => {
    setSelectedIntegrations((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
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

    // Extract username from URL
    const match = trimmedUrl.match(/instagram\.com\/([a-zA-Z0-9_.-]+)\/?/);
    const username = match ? match[1] : '';

    if (!username) {
      setError('Could not extract Instagram username from URL');
      return;
    }

    // Validate that if Google Sheets is selected, ID is provided
    if (selectedIntegrations.includes('google_sheets') && !googleSheetsId.trim()) {
      setError('Please provide your Google Sheets ID for Google Sheets integration');
      return;
    }

    // Validate that if HubSpot is selected, list ID is provided
    if (selectedIntegrations.includes('hubspot') && !hubspotListId.trim()) {
      setError('Please provide your HubSpot List ID for HubSpot integration');
      return;
    }

    setLoading(true);

    // Build query string with integrations and credentials
    const params = new URLSearchParams({
      username: encodeURIComponent(username),
      integrations: selectedIntegrations.join(','),
      ...(selectedIntegrations.includes('google_sheets') && { googleSheetsId }),
      ...(selectedIntegrations.includes('hubspot') && { hubspotListId }),
    });

    // Navigate to extraction page with all parameters
    router.push(`/extraction?${params.toString()}`);
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

            {/* Integration Selection */}
            <div className="pt-4 border-t-2 border-[#2D2D2D]">
              <label className="font-ibm-mono text-[11px] text-[#FFD600] tracking-[2px] block mb-4">
                EXPORT TO (OPTIONAL)
              </label>
              
              <div className="space-y-3">
                {/* Google Sheets */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIntegrations.includes('google_sheets')}
                    onChange={() => toggleIntegration('google_sheets')}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-ibm-mono text-[12px] font-bold text-[#F5F5F0]">
                      Google Sheets
                    </p>
                    <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[0.5px]">
                      Export analytics to your Google Sheet
                    </p>
                  </div>
                </label>
                {selectedIntegrations.includes('google_sheets') && (
                  <input
                    type="text"
                    placeholder="Google Sheets ID (from URL)"
                    value={googleSheetsId}
                    onChange={(e) => setGoogleSheetsId(e.target.value)}
                    className="ml-7 w-full px-4 py-3 bg-[#1A1A1A] border-2 border-[#2D2D2D] text-[#F5F5F0] placeholder-[#666666] font-ibm-mono text-[12px] focus:outline-none focus:border-[#FFD600] transition-colors"
                  />
                )}

                {/* HubSpot */}
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={selectedIntegrations.includes('hubspot')}
                    onChange={() => toggleIntegration('hubspot')}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-ibm-mono text-[12px] font-bold text-[#F5F5F0]">
                      HubSpot
                    </p>
                    <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[0.5px]">
                      Create contact in your HubSpot CRM
                    </p>
                  </div>
                </label>
                {selectedIntegrations.includes('hubspot') && (
                  <input
                    type="text"
                    placeholder="HubSpot List ID"
                    value={hubspotListId}
                    onChange={(e) => setHubspotListId(e.target.value)}
                    className="ml-7 w-full px-4 py-3 bg-[#1A1A1A] border-2 border-[#2D2D2D] text-[#F5F5F0] placeholder-[#666666] font-ibm-mono text-[12px] focus:outline-none focus:border-[#FFD600] transition-colors"
                  />
                )}

                {/* BigQuery */}
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={selectedIntegrations.includes('bigquery')}
                    onChange={() => toggleIntegration('bigquery')}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-ibm-mono text-[12px] font-bold text-[#F5F5F0]">
                      BigQuery
                    </p>
                    <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[0.5px]">
                      Store in BigQuery warehouse
                    </p>
                  </div>
                </label>

                {/* Mailchimp */}
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={selectedIntegrations.includes('mailchimp')}
                    onChange={() => toggleIntegration('mailchimp')}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-ibm-mono text-[12px] font-bold text-[#F5F5F0]">
                      Mailchimp
                    </p>
                    <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[0.5px]">
                      Add to Mailchimp audience
                    </p>
                  </div>
                </label>

                {/* Salesforce */}
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={selectedIntegrations.includes('salesforce')}
                    onChange={() => toggleIntegration('salesforce')}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-ibm-mono text-[12px] font-bold text-[#F5F5F0]">
                      Salesforce
                    </p>
                    <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[0.5px]">
                      Sync to Salesforce
                    </p>
                  </div>
                </label>
              </div>
            </div>

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
