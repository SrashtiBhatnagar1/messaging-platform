# Copilot Instructions for Messaging Platform

## Project Overview

This is a real-time chat application built with Next.js 14, TypeScript, Tailwind CSS, Convex, and Clerk authentication.

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Convex (Backend as a Service)
- **Database**: Convex Cloud Database
- **Authentication**: Clerk
- **Linting**: ESLint

## Project Structure

```
messaging-platform/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── sign-in/         # Sign-in page
│   │   │   ├── sign-up/         # Sign-up page
│   │   │   └── layout.tsx       # Auth layout
│   │   ├── (chat)/              # Chat application routes
│   │   │   ├── page.tsx         # Chat home page
│   │   │   └── layout.tsx       # Chat layout with sidebar
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Root page (redirect logic)
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── chat/                # Chat-related components
│   │   │   ├── Sidebar.tsx      # Chat sidebar navigation
│   │   │   └── ChatWindow.tsx   # Chat message display
│   │   └── ui/                  # Reusable UI components
│   ├── lib/                     # Utility functions and helpers
│   └── middleware.ts            # Clerk middleware configuration
├── convex/
│   ├── schema.ts                # Database schema definition
│   ├── messages.ts              # Message queries and mutations
│   ├── auth.ts                  # Authentication utilities
│   └── _auth.ts                 # Convex auth configuration
├── public/                      # Static assets
├── .env.local.example           # Environment variables template
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── tailwind.config.js           # Tailwind CSS configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Clerk account and API keys
- Convex account and deployment URL

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Add your Clerk API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Add your Convex deployment URL:
   - `NEXT_PUBLIC_CONVEX_URL`

Example `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Step 3: Set Up Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your API keys to `.env.local`
4. In Clerk settings, configure redirect URLs:
   - Sign in URL: `http://localhost:3000/sign-in`
   - Sign up URL: `http://localhost:3000/sign-up`
   - After sign in URL: `http://localhost:3000`

### Step 4: Set Up Convex

1. Create a Convex account at [convex.dev](https://www.convex.dev)
2. Initialize Convex in your project:
   ```bash
   npx convex dev
   ```
3. Follow the prompts to connect your project
4. Get your deployment URL from the Convex dashboard
5. Update `.env.local` with your URL

### Step 5: Deploy Database Schema

```bash
npx convex push
```

This will create the database tables based on `convex/schema.ts`.

## Development

### Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Run Convex development mode

In a separate terminal:
```bash
npx convex dev
```

### Lint code

```bash
npm run lint
```

## Key Features

- **Real-time Chat**: Instant message delivery using Convex real-time subscriptions
- **User Authentication**: Secure authentication with Clerk
- **Modern UI**: Built with Tailwind CSS and dark theme optimized
- **Type Safety**: Full TypeScript implementation
- **Scalable Backend**: Convex handles backend logic and database

## Important Notes

### Authentication Flow

1. Unauthenticated users are redirected to `/sign-in`
2. After sign-in, users are redirected to the chat page
3. Clerk middleware (`src/middleware.ts`) protects routes

### Component Guidelines

- All client components should have `"use client"` directive
- Use Clerk hooks (`useAuth`, `useUser`) for authentication state
- Use Convex hooks from `convex/react` for data fetching

### Database Schema

The Convex schema includes:
- **users**: User profiles with Clerk integration
- **conversations**: Direct message conversations
- **messages**: Individual chat messages

### Adding New Features

1. Create database schema changes in `convex/schema.ts`
2. Add queries/mutations in `convex/messages.ts` (or create new files)
3. Create React components in `src/components/`
4. Update routes as needed in `src/app/`

## Troubleshooting

### Clerk not found errors
- Ensure `ClerkProvider` is wrapped around your app in `src/app/layout.tsx`
- Check that all Clerk environment variables are set

### Convex connection issues
- Run `npx convex dev` to start the local Convex backend
- Verify `NEXT_PUBLIC_CONVEX_URL` is correct in `.env.local`

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` folder: `rm -rf .next` and rebuild

## Production Deployment

1. Set environment variables in your hosting provider
2. Deploy Convex database:
   ```bash
   npx convex deploy
   ```
3. Deploy Next.js app to Vercel, Netlify, or your preferred platform

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is open source and available under the MIT License.
