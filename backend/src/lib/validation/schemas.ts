import { z } from 'zod'

// OAuth callback validation
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional()
})

// Analyze profile request validation
export const analyzeProfileSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Invalid Instagram username format'),
  integrationTargets: z
    .array(z.enum(['google_sheets', 'hubspot', 'mailchimp', 'bigquery', 'salesforce']))
    .optional()
})

// User access token validation
export const accessTokenSchema = z.object({
  accessToken: z.string().min(10, 'Invalid access token'),
  userId: z.string().min(1, 'User ID is required')
})

// Environment variables validation
export const envSchema = z.object({
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),
  INSTAGRAM_REDIRECT_URI: z.string().url(),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().optional()
})

export type OAuthCallback = z.infer<typeof oauthCallbackSchema>
export type AnalyzeProfile = z.infer<typeof analyzeProfileSchema>
export type AccessToken = z.infer<typeof accessTokenSchema>
export type Env = z.infer<typeof envSchema>
