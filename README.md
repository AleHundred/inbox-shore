# InboxShore 🌊

A modern, full-stack customer support portal. Built with intention, crafted for human connection.

## What This Is

InboxShore is a demonstration of what happens when engineering meets empathy. It's a standalone product that shows how support software should feel—fast, accessible, and genuinely helpful. No external dependencies, no third-party API reliance. Just clean architecture and thoughtful design from the ground up.

This project includes test messages from some of my favorite musicians—Lucy Dacus, Phoebe Bridgers, Sharon Van Etten, and Julien Baker—as an ode to art that moves you. Because good software, like good music, should make you feel something.

## The Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Express.js with custom JWT authentication
- **State Management**: React Query (with optimistic updates)
- **Styling**: Tailwind CSS, Headless UI
- **Form & Validation**: React Hook Form, Zod
- **Testing**: Jest, React Testing Library
- **Mock Data**: Faker.js-powered mock server
- **Quality Tools**: ESLint, Prettier, Biome, Husky (pre-commit hooks), EditorConfig
- **Documentation**: Swagger (OpenAPI), Markdown
- **Deployment**: Docker, Docker Compose, Vercel
- **Other**: Custom error boundaries, Winston logging, Rate limiting middleware, Custom React hooks and context

## What Makes This Different

### Performance Without Compromise

- Reverse pagination that respects conversation flow
- Request batching and intelligent caching
- Skeleton loaders that actually improve perceived performance
- Component memoization where it matters

### Accessibility First

- Full keyboard navigation with thoughtful shortcuts
- Screen reader optimizations throughout
- Focus management that follows natural reading patterns
- Error states that help rather than frustrate

### Built for Real Humans

- Optimistic updates so conversations feel instant
- Centralized error handling that's actually helpful
- HTTP-only JWT cookies for security without friction
- Responsive design that works everywhere

### Production-Ready

- Comprehensive error boundaries
- Winston logging with context
- Rate limiting and security headers
- Docker containerization
- API documentation that developers will actually use

## Getting Started

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Run locally (frontend on :3000, server on :3001)
npm run dev

# Run with Docker
docker-compose up
# Frontend available at http://localhost:3000
# API available at http://localhost:3001

# Run tests
npm test

# Deploy to Vercel
vercel
```

## Project Structure

```
├── app/                  # Next.js app directory
├── components/
│   ├── features/        # Feature-specific components
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI primitives
├── lib/
│   ├── api/             # API client and services
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utility functions
├── server/              # Express backend
│   ├── middleware/      # Auth, error handling, logging
│   ├── routes/          # API endpoints
│   └── models/          # Data models
└── __tests__/           # Test suites
```

## Design Decisions

Every choice here was deliberate:

- Mocked data over real APIs: This is about showing craft, not integrations
- JWT in HTTP-only cookies: Security that doesn't get in the way
- React Query over Redux: Because server state is different from client state
- Tailwind over CSS-in-JS: Performance and maintainability at scale
- Express over serverless: Sometimes you need a real server
- TypeScript everywhere: Type safety is user safety

## Deployment

InboxShore uses a **hybrid deployment architecture** that separates the frontend and backend for optimal performance and scalability. This approach leverages the strengths of each platform while maintaining the clean separation of concerns in your application.

### Architecture Overview

```
┌─────────────────┐    HTTPS/API     ┌──────────────────┐
│   Vercel        │ ───────────────> │    Railway       │
│   (Frontend)    │                  │   (Backend)      │
│   Next.js App   │                  │  Express Server  │
└─────────────────┘                  └──────────────────┘
```

**Why This Architecture?**

The hybrid deployment strategy provides several key advantages. **Vercel excels at hosting Next.js applications** with features like automatic static optimization, edge caching, and seamless preview deployments. **Railway provides excellent containerized hosting** for your Express server with persistent storage, environment variable management, and automatic SSL termination.

This separation allows your frontend to benefit from Vercel's global CDN while your backend runs as a dedicated service with consistent performance. The architecture also enables independent scaling and deployment cycles for each part of your application.

### Live Application

**🚀 Production URLs:**

- **Frontend:** https://inbox-shore-git-deployment-alejandra-villas-projects-05dd66da.vercel.app
- **Backend API:** https://inbox-shore-production.up.railway.app
- **API Health Check:** https://inbox-shore-production.up.railway.app/api/health

### Deploying Your Own Instance

**Prerequisites:**

- Vercel account (free tier available)
- Railway account (free tier available)
- Git repository with your code

#### Step 1: Deploy Backend to Railway

Railway deployment handles your Express server and provides the API endpoints your frontend needs.

1. Connect your repository to Railway
2. Configure environment variables in Railway dashboard:
   ```
   JWT_SECRET=your-secure-jwt-secret-32-chars-minimum
   NODE_ENV=production
   PORT=3001
   ```
3. Railway automatically builds and deploys your server from the `/server` directory
4. Note your Railway app URL (format: `https://your-app.railway.app`)

#### Step 2: Deploy Frontend to Vercel

Vercel handles your Next.js frontend and API routes, connecting to your Railway backend.

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard:
   ```
   JWT_SECRET=same-secret-as-railway
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_BASE_URL=https://your-vercel-app.vercel.app/api
   ```
3. Vercel automatically builds and deploys your Next.js application

#### Step 3: Verify Deployment

Test the complete application flow to ensure both services communicate correctly:

1. Visit your Vercel URL
2. Log in using test credentials
3. Create a support request
4. Verify the request appears in your list
5. Test the conversation interface

### Environment Variables Explained

Understanding how environment variables work across both platforms helps you maintain secure, flexible deployments:

- `JWT_SECRET`: Must be identical on both platforms for authentication to work
- `NEXT_PUBLIC_API_URL`: Tells your frontend where to find your backend API
- `NEXT_PUBLIC_USE_MOCK_API`: Set to `false` in production to use real backend data
- `NEXT_PUBLIC_API_BASE_URL`: Used for internal Next.js API routes

### Deployment Commands (Alternative)

If you prefer command-line deployment:

```bash
# Deploy backend to Railway
cd server
railway login
railway init
railway up

# Deploy frontend to Vercel
cd ..
vercel login
vercel --prod
```

## What I Learned Building This

InboxShore taught me that the best software is invisible. It's there when you need it, gone when you don't. It respects your time, your data, and your humanity.

Good error handling isn't about catching errors—it's about helping people recover from them. Good performance isn't about milliseconds—it's about making interactions feel effortless. Good design isn't about beauty—it's about removing friction from human tasks.

## Contributing

This is a portfolio project, but I'd love to hear your thoughts. Found a bug? Have an idea? Open an issue. Sometimes the best code reviews come from fresh eyes. Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/AleHundred/inbox-shore/issues).

## License

MIT License

## Project Origin

Originally developed as a technical exercise, InboxShore has been extensively re-imagined and rebuilt. The project represents a personal exploration of communication interface design and API integration.

## Contact

Alejandra Villa

- GitHub: [@alehundred](https://github.com/alehundred)
- LinkedIn: [alxvilla](https://linkedin.com/in/alxvilla)

## Acknowledgments

- Inspired by modern support communication platforms
- Developed as a personal learning project
