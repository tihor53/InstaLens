# InstaLens Backend

AI-powered Instagram business profile data extraction and analysis engine.

## 🚀 Features

- **Instagram OAuth 2.0 Integration** - Seamless user authentication
- **Profile & Media Extraction** - Extract profile info, posts, captions, hashtags
- **Token Management** - Secure token caching with Redis (30-60 day automatic refresh)
- **Rate Limiting** - Built-in rate limiting to prevent abuse
- **Business Intelligence** - Extract hashtags, mentions, engagement metrics
- **Error Handling** - Graceful error handling with meaningful messages

## 📋 Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Instagram App credentials:

```env
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/auth/instagram/callback
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### 3. Get Instagram App Credentials

1. Visit [Meta App Dashboard](https://developers.facebook.com/apps)
2. Create a new app or select existing
3. Add "Instagram" product
4. Navigate to **Settings > Basic** to get:
   - App ID
   - App Secret
5. Add Valid OAuth Redirect URIs:
   - `http://localhost:5000/api/auth/instagram/callback` (development)
   - Production URL (when deployed)

### 4. Setup Redis (Upstash)

1. Sign up at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token from the console

## 🏃 Running

### Development

```bash
npm run dev
```

Server starts at `http://localhost:5000`

### Build & Production

```bash
npm run build
npm start
```

## 📚 API Endpoints

### OAuth Endpoints

#### `GET /api/auth/instagram`
Redirects user to Instagram OAuth authorization window.

**Response**: Redirects to Instagram login

#### `GET /api/auth/instagram/callback`
Handles OAuth callback with authorization code. Exchanges code for access token and caches it.

**Query Parameters**:
- `code` - Authorization code from Instagram
- `state` - CSRF protection state

**Response**: Redirects to frontend with success/error

#### `POST /api/auth/revoke`
Revoke user's cached access token.

**Body**:
```json
{
  "userId": "instagram_user_id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "revoked": true
  }
}
```

### Profile Endpoints

#### `POST /api/profile/analyze`
Analyze an Instagram profile and extract business intelligence.

**Body**:
```json
{
  "userId": "instagram_user_id",
  "username": "instagram_username"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "123456789",
      "username": "business_name",
      "name": "Business Full Name",
      "biography": "About the business",
      "website": "https://example.com",
      "profilePictureUrl": "https://..."
    },
    "media": [
      {
        "id": "media_id",
        "type": "IMAGE",
        "url": "https://...",
        "caption": "Post caption",
        "hashtags": ["#tag1", "#tag2"],
        "mentions": ["@mention1"],
        "timestamp": "2024-01-15T10:30:00Z",
        "engagement": {
          "likes": 150,
          "comments": 25
        }
      }
    ],
    "extracted": {
      "totalPosts": 12,
      "allHashtags": ["#tag1", "#tag2"],
      "allMentions": ["@mention1"],
      "avgEngagement": 175
    },
    "cached": false
  }
}
```

#### `GET /api/profile/me`
Get authenticated user's own profile.

**Headers**:
```
X-User-ID: instagram_user_id
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "username": "myprofile",
    "name": "My Name",
    "biography": "My bio",
    "website": "https://..."
  }
}
```

## 🔄 OAuth Flow

```
1. User clicks "Authorize with Instagram" on frontend
   ↓
2. Frontend redirects to GET /api/auth/instagram
   ↓
3. Backend redirects to Instagram OAuth authorization window
   ↓
4. User authorizes app and Instagram redirects to callback
   ↓
5. Backend exchanges code for short-lived token
   ↓
6. Backend exchanges short-lived token for long-lived token (60 days)
   ↓
7. Backend caches token in Redis
   ↓
8. Backend redirects to frontend with success
```

## 🔐 Token Management

- **Short-lived tokens**: 1 hour validity
- **Long-lived tokens**: 60 days validity
- **Automatic refresh**: Tokens are cached and managed automatically
- **Secure storage**: Tokens stored in Redis with TTL matching expiration

## 🚦 Rate Limiting

Built-in rate limiting: 10 requests per second per IP address.

## 📝 Logging

All major operations are logged to console. In production, integrate with:
- Sentry (error tracking)
- Axiom (log aggregation)
- DataDog (monitoring)

## 📦 Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   ├── instagram/
│   │   │   ├── oauth.ts          # OAuth flow
│   │   │   └── client.ts         # Instagram API client
│   │   ├── cache/
│   │   │   └── token-cache.ts    # Redis token management
│   │   └── validation/
│   │       ├── schemas.ts        # Zod validation schemas
│   │       └── errors.ts         # Error handling
│   ├── routes/
│   │   ├── auth.ts               # OAuth routes
│   │   └── profile.ts            # Profile analysis routes
│   └── server.ts                 # Main server
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Testing

```bash
npm test
```

## 🐛 Debugging

Development logs include:
- OAuth flow steps
- Token exchange details
- API request/responses
- Cache hits/misses
- Rate limit checks

## 📄 License

MIT

## 🤝 Support

For issues or questions:
1. Check logs for error details
2. Verify Instagram App credentials
3. Ensure Redis is accessible
4. Check OAuth redirect URIs match exactly

---

**Built with**: Express.js • TypeScript • Instagram API • Upstash Redis
