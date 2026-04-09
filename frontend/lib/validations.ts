import { z } from 'zod';

// Instagram URL validation schema
export const instagramUrlSchema = z.object({
  profileUrl: z
    .string()
    .url('Must be a valid URL')
    .regex(
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?$/,
      'Must be a valid Instagram profile URL (e.g., https://instagram.com/username)'
    ),
  integrationTargets: z
    .array(
      z.enum([
        'google_sheets',
        'bigquery',
        'hubspot',
        'salesforce',
        'mailchimp',
        'zapier',
      ])
    )
    .optional(),
});

// Instagram URL extraction schema
export const instagramUrlExtractionSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .regex(
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?$/,
      'Must be a valid Instagram profile URL'
    ),
});

// Extraction payload schema
export const extractionPayloadSchema = z.object({
  profileUrl: z.string().url(),
  integrationTargets: z.array(z.string()).optional().default([]),
  googleSheetsId: z.string().optional(),
  hubspotListId: z.string().optional(),
});

export type InstagramUrlInput = z.infer<typeof instagramUrlSchema>;
export type ExtractionPayload = z.infer<typeof extractionPayloadSchema>;
