# Quick Setup Guide

## ⚠️ IMPORTANT: You MUST add real API keys to make this work!

### Step 1: Get Clerk API Keys (Required)

1. Go to **https://dashboard.clerk.com**
2. Sign up or log in
3. Click **"+ Create application"**
4. Choose a name (e.g., "Chat App")
5. Select authentication methods (Email, Google, etc.)
6. Click **"Create application"**

7. You'll see your API keys. Copy them:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

8. **Paste them into `.env.local`:**
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   CLERK_SECRET_KEY=sk_test_your_actual_key_here
   ```

9. In Clerk Dashboard, go to **Settings → URLs** and configure:
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in: `http://localhost:3000/dashboard`

### Step 2: Set Up Convex Backend (Required)

1. Go to **https://www.convex.dev**
2. Sign up with GitHub
3. In your terminal, run:
   ```bash
   npx convex dev
   ```
4. Follow the prompts:
   - "Create a new project" → Yes
   - Choose project name
   - Authenticate with GitHub

5. The CLI will show your deployment URL:
   ```
   Deployment URL: https://your-project-12345.convex.cloud
   ```

6. **Copy this URL to `.env.local`:**
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-project-12345.convex.cloud
   ```

7. Push the schema:
   ```bash
   npx convex push
   ```

### Step 3: Start Development

**Terminal 1** - Keep Convex running:
```bash
npx convex dev
```

**Terminal 2** - Start Next.js:
```bash
npm run dev
```

Visit **http://localhost:3000** and sign up!

---

## ✅ What's Been Configured

- ✅ **ClerkProvider** - Wraps entire app for authentication
- ✅ **ConvexProviderWithClerk** - Connects Clerk auth to Convex backend
- ✅ **Middleware** - Protects `/dashboard` route
- ✅ **Sign-in/Sign-up pages** - Clerk UI components
- ✅ **Database schema** - Users, Conversations, Messages tables

## 🔒 How Clerk + Convex Integration Works

```
User Signs In (Clerk)
    ↓
Clerk provides auth token
    ↓
ConvexProviderWithClerk passes token to Convex
    ↓
Convex backend receives authenticated user
    ↓
You can use ctx.auth.getUserIdentity() in Convex functions
```

## 🚫 Why It's Not Working Now?

The `.env.local` file has **FAKE placeholder keys**. The app cannot authenticate without real keys from Clerk Dashboard.

## 📝 Current .env.local status:

```env
# ❌ THESE ARE FAKE - Replace with real keys!
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhhbXBsZV9wbGFjZWhvbGRlcl9rZXkfcl9ub3RfcmVhbA
CLERK_SECRET_KEY=sk_test_ZXhhbXBsZV9wbGFjZWhvbGRlcl9rZXkfcr9ub3RfcmVhbA
NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud
```

## 🎯 After Adding Real Keys:

```bash
# Restart the dev server
npm run dev
```

Then visit http://localhost:3000 and you'll be redirected to sign-in!

## 🆘 Troubleshooting

**"Cannot connect to Clerk"**
- Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_`
- Verify the key is from Clerk Dashboard
- Restart dev server after changing env vars

**"Convex error"**
- Make sure `npx convex dev` is running in another terminal
- Check that `NEXT_PUBLIC_CONVEX_URL` matches your Convex deployment

**"Unauthorized" in Convex functions**
- Verify `ConvexProviderWithClerk` is configured (it is!)
- Make sure user is signed in with Clerk

Good luck! 🚀
