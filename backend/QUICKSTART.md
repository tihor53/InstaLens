# InstaLens Backend - Quick Start Guide

## 📦 What's Been Created

Complete backend implementation with:
- ✅ OAuth 2.0 authentication flow
- ✅ Instagram API client (Basic Display API)
- ✅ In-memory token storage (no database required)
- ✅ Profile and media extraction
- ✅ Business intelligence parsing (hashtags, mentions, engagement)
- ✅ Error handling and validation
- ✅ TypeScript with full type safety

## 🚀 Getting Started

### Step 1: Setup Meta App Dashboard

1. Go to [Meta Developers](https://developers.facebook.com)
2. Create/select an app
3. Add "Instagram" product
4. Get your **App ID** and **App Secret** from Settings > Basic
5. Add OAuth Redirect URI:
   ```
   http://localhost:3001/api/auth/instagram/callback
   ```

### Step 2: Configure Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3001/api/auth/instagram/callback
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 3: Run Backend

```bash
npm run dev
```

Server running at: `http://localhost:3001`

## 🔌 Connect Frontend to Backend

Update frontend to call:

```typescript
POST /api/profile/analyze
Body: {
  userId: "instagram_user_id"
}
```

## 📋 Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   ├── instagram/
│   │   │   ├── oauth.ts ............ OAuth implementation
│   │   │   └── client.ts ........... Instagram API calls
│   │   ├── cache/
│   │   │   └── token-store.ts ...... In-memory token storage
│   │   └── validation/
│   │       ├── schemas.ts .......... Input validation (Zod)
│   │       └── errors.ts ........... Error handling
│   ├── routes/
│   │   ├── auth.ts ................. OAuth endpoints
│   │   └── profile.ts .............. Profile analysis endpoints
│   └── server.ts ................... Express app setup
├── .env.example .................... Environment template
├── package.json .................... Dependencies
├── tsconfig.json ................... TypeScript config
└── README.md ....................... Full API documentation
```

## 🔄 OAuth Flow Summary

```
User clicks "Login with Instagram"
        ↓
GET /api/auth/instagram (redirects to Instagram)
        ↓
User authorizes on Instagram
        ↓
GET /api/auth/instagram/callback (exchanges code for token)
        ↓
Token stored in memory (session)
        ↓
Redirects to frontend with success
        ↓
Frontend can now call POST /api/profile/analyze
        ↓
Backend extracts profile data using stored token
```

## 📧 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/auth/instagram` | Start OAuth flow |
| `GET` | `/api/auth/instagram/callback` | Handle OAuth callback |
| `POST` | `/api/auth/revoke` | Revoke access token |
| `POST` | `/api/profile/analyze` | Analyze Instagram profile |
| `GET` | `/api/profile/me` | Get authenticated user profile |
| `GET` | `/health` | Health check |

## 🧪 Test OAuth Flow

1. Start backend: `npm run dev`
2. Visit: `http://localhost:3001/api/auth/instagram`
3. Login with Instagram account
4. Should redirect back with success

## ⚠️ Important Notes

- Instagram Basic Display API works on **any public profile**
- Access tokens are stored in application memory during runtime
- Tokens are **lost when server restarts** (acceptable for MVP/testing)
- For production, implement persistent token storage (database)
- Rate limiting may apply based on Instagram API quotas
- All endpoints require proper authentication

## 🔗 Next Steps

1. ✅ Backend is ready
2. ⏳ Connect frontend OAuth button to `/api/auth/instagram`
3. ⏳ Update frontend `/api/analyze` to call backend
4. ⏳ Add Mastra AI agents for analysis
5. ⏳ Setup integrations (Google Sheets, HubSpot)

---

**Need help?** Check `README.md` for detailed API documentation

