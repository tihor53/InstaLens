import 'dotenv/config'
import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import { InstagramOAuth } from './lib/instagram/oauth'
import { TokenStore } from './lib/cache/token-store'
import { envSchema } from './lib/validation/schemas'
import { errorResponse, successResponse } from './lib/validation/errors'

import { createAuthRoutes } from './routes/auth'
import { createProfileRoutes } from './routes/profile'

// Validate environment variables
const env = envSchema.parse(process.env)

// Initialize Express app
const app: Express = express()
const port = parseInt(env.PORT)

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Initialize Instagram OAuth and Token Store
const instagramOAuth = new InstagramOAuth({
  appId: env.INSTAGRAM_APP_ID,
  appSecret: env.INSTAGRAM_APP_SECRET,
  redirectUri: env.INSTAGRAM_REDIRECT_URI,
  apiVersion: 'v18.0'
})

const tokenStore = new TokenStore()
console.log('✅ Token store initialized (in-memory)')

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json(
    successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      storage: 'in-memory'
    })
  )
})

// API Routes
app.use('/api/auth', createAuthRoutes(instagramOAuth, tokenStore))
app.use('/api/profile', createProfileRoutes(tokenStore))

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json(
    errorResponse(404, 'Endpoint not found', 'NOT_FOUND')
  )
})

// Error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'
  const code = err.code || 'INTERNAL_ERROR'

  res.status(statusCode).json(
    errorResponse(statusCode, message, code)
  )
})

// Start server
app.listen(port, () => {
  console.log(`✅ InstaLens Backend Server running at http://localhost:${port}`)
  console.log(`📍 Environment: ${env.NODE_ENV}`)
  console.log(`🔗 OAuth Redirect URI: ${env.INSTAGRAM_REDIRECT_URI}`)
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log('')
  console.log('Available endpoints:')
  console.log('  GET  /health - Health check')
  console.log('  GET  /api/auth/instagram - Start OAuth flow')
  console.log('  GET  /api/auth/instagram/callback - OAuth callback handler')
  console.log('  POST /api/auth/revoke - Revoke access token')
  console.log('  POST /api/profile/analyze - Analyze Instagram profile')
  console.log('  GET  /api/profile/me - Get authenticated user profile')
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

export default app
