# Messaging Platform

A modern, real-time chat application built with Next.js 14, TypeScript, Tailwind CSS, Convex backend, and Clerk authentication.

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Convex (Backend as a Service)
- **Database**: Convex Cloud Database
- **Authentication**: Clerk
- **Code Quality**: ESLint

## Features

- ✨ Real-time messaging
- 🔐 Secure authentication with Clerk
- 💬 One-to-one conversations
- 🎨 Modern, dark-themed UI with Tailwind CSS
- ⚡ Type-safe backend with Convex
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (included with Node.js)
- Clerk account: https://clerk.com
- Convex account: https://convex.dev

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Configure Clerk**
   - Create an application in [Clerk Dashboard](https://dashboard.clerk.com)
   - Add your API keys to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
     CLERK_SECRET_KEY=your_key
     ```

4. **Set up Convex**
   ```bash
   npx convex dev
   ```
   - Follow the prompts to create/link a project
   - Add your deployment URL to `.env.local`:
     ```
     NEXT_PUBLIC_CONVEX_URL=your_url
     ```

5. **Deploy the database schema**
   ```bash
   npx convex push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication pages
│   ├── (chat)/             # Chat application pages
│   └── layout.tsx          # Root layout with providers
├── components/             # Reusable React components
│   ├── chat/               # Chat-specific components
│   └── ui/                 # General UI components
├── lib/                    # Utility functions
└── middleware.ts           # Clerk authentication middleware

convex/
├── schema.ts               # Database schema
├── messages.ts             # Message queries & mutations
├── auth.ts                 # Auth utilities
└── _auth.ts                # Convex auth config
```

## Database Schema

### Users
- Store user profiles from Clerk
- Username, email, profile image

### Conversations
- Stores direct message conversations
- Contains participant IDs and metadata

### Messages
- Individual chat messages
- Linked to conversations and users

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Authentication Flow

1. Users visit the app
2. Unauthenticated users are redirected to `/sign-in`
3. Clerk handles sign-up/sign-in
4. Authenticated users access chat interface
5. UserButton in sidebar allows sign-out

## Key Components

- **Sidebar**: Navigation and user profile
- **ChatWindow**: Message display and input
- **Auth Pages**: Sign-in and sign-up with Clerk

## Development Tips

- Convex runs in the background during development with `npx convex dev`
- All database changes are automatically synchronized
- TypeScript provides full type safety
- Clerk middleware protects routes in `src/middleware.ts`

## Deployment

### To Vercel (recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy Convex database:
   ```bash
   npx convex deploy
   ```
5. Update `.env.local` with production URL

### Other Platforms

Follow the same environment variable setup for Netlify, AWS, or your preferred platform.

## Troubleshooting

**Can't connect to Convex?**
- Ensure `npx convex dev` is running in a separate terminal
- Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

**Authentication issues?**
- Verify Clerk API keys are correct
- Check Clerk dashboard for configured URLs

**TypeScript errors?**
- Run `npm install` to ensure dependencies are installed
- Delete `.next` folder and rebuild

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

## License

MIT License - see LICENSE file for details
