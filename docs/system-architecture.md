# System Architecture

**Last Updated:** 2025-12-19
**Project:** Image Book Editor
**Version:** 1.0.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow](#data-flow)
5. [Authentication Architecture](#authentication-architecture)
6. [AI Integration Architecture](#ai-integration-architecture)
7. [Database Schema](#database-schema)
8. [API Architecture](#api-architecture)
9. [Frontend Architecture](#frontend-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Architecture](#security-architecture)
12. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Browser                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 App (React 19)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Server Comp  │  │ Client Comp  │  │  FabricJS       │  │ │
│  │  │ (SSR/RSC)    │  │ (Interactive)│  │  Canvas Engine  │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js API Routes (Serverless)               │ │
│  │  ┌──────────────────┐      ┌──────────────────────────┐   │ │
│  │  │ /api/detect-     │      │ /api/remove-background   │   │ │
│  │  │ bounding-boxes   │      │                          │   │ │
│  │  └──────────────────┘      └──────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐
│  Supabase        │  │ Google Gemini  │  │ Sharp Library   │
│  (Backend)       │  │ AI API         │  │ (Server-side)   │
│                  │  │                │  │                 │
│ • PostgreSQL DB  │  │ • Object       │  │ • Image         │
│ • Auth Service   │  │   Detection    │  │   Processing    │
│ • Storage        │  │ • Vision AI    │  │ • BG Removal    │
│ • Realtime       │  │                │  │                 │
└──────────────────┘  └────────────────┘  └─────────────────┘
```

### Architecture Style

**Monolithic Full-Stack Application**
- Single Next.js deployment
- Unified frontend/backend codebase
- Serverless API routes
- Edge-deployed for global performance

**Key Characteristics:**
- **Framework:** Next.js 15 App Router (React Server Components)
- **Deployment:** Vercel (edge network)
- **Backend:** Serverless functions + Supabase
- **State Management:** React hooks (no external state library)
- **Rendering:** Hybrid SSR/CSR with RSC

---

## Technology Stack

### Frontend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.7 | Full-stack React framework |
| React | 19.2.1 | UI library |
| TypeScript | 5.x | Type safety |
| FabricJS | 6.9.0 | Canvas manipulation |
| Tailwind CSS | 4.0 | Utility-first styling |
| Radix UI | Latest | Accessible UI components |
| shadcn/ui | Latest | Pre-built component library |

### Backend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.5.7 | Serverless endpoints |
| Supabase JS | 2.49.2 | Backend services client |
| Sharp | 0.34.5 | Image processing |
| Google Gemini API | 1.34.0 | AI object detection |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Hosting, CDN, serverless functions |
| Supabase | Database, auth, storage |
| Google Cloud | Gemini AI API |
| PhotoRoom (optional) | Advanced background removal |

### Development Tools

| Tool | Purpose |
|------|---------|
| Bun | Package manager, runtime |
| ESLint | Code linting |
| TypeScript | Static type checking |
| Git | Version control |

---

## System Components

### 1. Presentation Layer (Client-Side)

**React Components:**
```
┌─────────────────────────────────────────────┐
│          Next.js App Router Pages           │
├─────────────────────────────────────────────┤
│ • / (Main Editor)                           │
│ • /login (Authentication)                   │
│ • /remove-bg (BG Removal)                   │
│ • /remove-bg-photo-room (PhotoRoom)         │
│ • /detect-bounding-boxes (Object Detection) │
└─────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│          Core Components                     │
├─────────────────────────────────────────────┤
│ • ImageEditor (Master Component)            │
│ • BoundingBoxEditor (Canvas Component)      │
│ • UI Components (56 Radix UI components)    │
└─────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│          State Management                    │
├─────────────────────────────────────────────┤
│ • useImageEditor (733-line hook)            │
│ • useIsMobile (Responsive hook)             │
└─────────────────────────────────────────────┘
```

### 2. API Layer (Server-Side)

**Next.js Serverless Functions:**
```
┌─────────────────────────────────────────────┐
│          API Routes                          │
├─────────────────────────────────────────────┤
│ POST /api/detect-bounding-boxes             │
│   → Gemini AI object detection              │
│                                             │
│ POST /api/remove-background                 │
│   → Sharp image processing                  │
└─────────────────────────────────────────────┘
```

### 3. Backend Services Layer

**Supabase:**
```
┌─────────────────────────────────────────────┐
│          Supabase Services                   │
├─────────────────────────────────────────────┤
│ • Authentication (Email/Password)           │
│ • PostgreSQL Database                       │
│ • Storage (Future: Image storage)           │
│ • Realtime (Future: Collaboration)          │
└─────────────────────────────────────────────┘
```

**External AI Services:**
```
┌─────────────────────────────────────────────┐
│          AI Processing                       │
├─────────────────────────────────────────────┤
│ • Google Gemini 3 Pro                       │
│   - Vision analysis                         │
│   - Object detection                        │
│   - Bounding box generation                 │
│                                             │
│ • PhotoRoom API (Optional)                  │
│   - Background removal                      │
│   - Advanced segmentation                   │
└─────────────────────────────────────────────┘
```

### 4. Data Processing Layer

**Sharp Image Processing:**
```
┌─────────────────────────────────────────────┐
│          Image Processing Pipeline           │
├─────────────────────────────────────────────┤
│ 1. Image Upload (FormData)                  │
│ 2. Sharp Processing                         │
│    • Background removal                     │
│    • Color replacement                      │
│    • Format conversion                      │
│ 3. Return Processed Image (Blob)            │
└─────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│  User    │────▶│  Login   │────▶│ Supabase   │────▶│ Session  │
│  Browser │     │  Page    │     │ Auth API   │     │ Cookie   │
└──────────┘     └──────────┘     └────────────┘     └──────────┘
                       │                                     │
                       │                                     │
                       ▼                                     ▼
                 ┌──────────┐                         ┌──────────┐
                 │ Redirect │◀────────────────────────│Middleware│
                 │ to /     │      Session Valid      │ Validates│
                 └──────────┘                         └──────────┘
```

**Steps:**
1. User submits email/password on `/login`
2. Browser client calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. Session cookie set (httpOnly, secure)
5. Middleware validates session on subsequent requests
6. Redirect to main editor if authenticated

### 2. Canvas Editing Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────▶│ ImageEditor  │────▶│useImageEditor│
│  Action  │     │  Component   │     │    Hook      │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   State Updates           │
                              │ • Canvas state            │
                              │ • Sheet management        │
                              │ • Object manipulation     │
                              │ • Zoom level              │
                              └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   FabricJS Canvas         │
                              │ • Render objects          │
                              │ • Handle events           │
                              │ • Update visuals          │
                              └───────────────────────────┘
```

**Steps:**
1. User interacts with editor (click, drag, type)
2. ImageEditor component calls hook callbacks
3. useImageEditor updates internal state
4. State changes trigger re-renders
5. FabricJS canvas updates visual representation
6. User sees updated canvas

### 3. AI Object Detection Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────▶│Bounding Box  │────▶│ Upload Image │
│ Uploads  │     │    Page      │     │              │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │ POST /api/detect-bounding │
                              │        -boxes             │
                              └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   Gemini 3 Pro API        │
                              │ • Analyze image           │
                              │ • Detect objects          │
                              │ • Generate bounding boxes │
                              └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   Response (JSON)         │
                              │ { boxes: [...] }          │
                              └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │  BoundingBoxEditor        │
                              │ • Render boxes on canvas  │
                              │ • DPI coordinate transform│
                              └───────────────────────────┘
```

**Steps:**
1. User uploads image on bounding box detection page
2. Client sends image to `/api/detect-bounding-boxes`
3. API route forwards to Gemini 3 Pro
4. Gemini analyzes image, returns bounding boxes
5. API route returns JSON response
6. BoundingBoxEditor renders boxes on canvas
7. Coordinate transformation for DPI scaling

### 4. Background Removal Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────▶│  Remove BG   │────▶│Select Image  │
│          │     │    Page      │     │ & BG Color   │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │ POST /api/remove-         │
                              │      background           │
                              └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   Sharp Processing        │
                              │ • Load image buffer       │
                              │ • Remove background       │
                              │ • Apply new color         │
                              │ • Return PNG with alpha   │
                              └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   Client Receives Blob    │
                              │ • Preview processed image │
                              │ • Download option         │
                              └───────────────────────────┘
```

**Steps:**
1. User selects image and background color
2. Client sends FormData to `/api/remove-background`
3. API route uses Sharp to process image
4. Background removed, new color applied
5. Processed image returned as Blob
6. Client displays preview and download link

---

## Authentication Architecture

### Supabase Auth Integration

**Client Types:**
```typescript
// Browser Client (Client Components)
import { createBrowserClient } from '@/lib/supabase/browser';
const supabase = createBrowserClient();

// Server Client (Server Components)
import { createServerClient } from '@/lib/supabase/server';
const supabase = await createServerClient();

// Middleware Client (Route Protection)
import { createMiddlewareClient } from '@/lib/supabase/middleware';
const supabase = await createMiddlewareClient();

// Route Client (API Routes)
import { createRouteClient } from '@/lib/supabase/route';
const supabase = await createRouteClient();
```

### Middleware Protection

**File:** `src/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const supabase = await createMiddlewareClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  if (!session && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already logged in, redirect from login
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

### Session Management

**Cookie-Based Sessions:**
- HttpOnly cookies for security
- Secure flag in production (HTTPS)
- SameSite=Lax for CSRF protection
- Auto-refresh mechanism via Supabase

**Session Flow:**
```
Login → Session Cookie Set → Middleware Validates → Access Granted
                                      │
                                      ▼
                              Session Expired?
                                      │
                                      ▼
                              Redirect to /login
```

---

## AI Integration Architecture

### Google Gemini 3 Pro

**API Configuration:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-vision' });
```

**Request Flow:**
```
Image Upload
    │
    ▼
Convert to Base64
    │
    ▼
Send to Gemini API
    │
    ▼
AI Analysis (5-15s)
    │
    ▼
Bounding Box Coordinates
    │
    ▼
Return JSON Response
```

**Response Format:**
```json
{
  "boxes": [
    {
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 250,
      "label": "person",
      "confidence": 0.95
    }
  ]
}
```

### Sharp Image Processing

**Architecture:**
```
Image File
    │
    ▼
Buffer Conversion
    │
    ▼
Sharp Pipeline
    │
    ├── Remove Background
    │   └── Alpha Channel Processing
    │
    ├── Apply Background Color (Optional)
    │   └── Flatten with Color
    │
    └── Export as PNG
        │
        ▼
    Return Buffer/Blob
```

**Processing Options:**
```typescript
await sharp(inputBuffer)
  .removeBackground()
  .flatten({ background: backgroundColor || { r: 255, g: 255, b: 255 } })
  .png()
  .toBuffer();
```

---

## Database Schema

### Current State

**No Database Tables Yet (Future Implementation)**

### Proposed Schema

**Users Table (Supabase Auth handles this):**
```sql
-- Managed by Supabase Auth
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Books Table:**
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);
```

**Sheets Table:**
```sql
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  name TEXT,
  canvas_data JSONB, -- FabricJS canvas state
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sheets of own books"
  ON sheets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = sheets.book_id
      AND books.user_id = auth.uid()
    )
  );
```

**Objects Table:**
```sql
CREATE TABLE canvas_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID REFERENCES sheets(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL, -- 'image', 'text', 'shape'
  object_data JSONB NOT NULL, -- FabricJS object state
  layer_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE canvas_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage objects of own sheets"
  ON canvas_objects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN books ON books.id = sheets.book_id
      WHERE sheets.id = canvas_objects.sheet_id
      AND books.user_id = auth.uid()
    )
  );
```

---

## API Architecture

### API Route Pattern

**Standard Structure:**
```
src/app/api/
  └── [endpoint-name]/
      └── route.ts         # HTTP methods (GET, POST, etc.)
```

### Endpoint Design

**RESTful Conventions:**
- `POST` for creating/processing
- `GET` for retrieving
- `PUT/PATCH` for updating
- `DELETE` for removing

**Example API Route:**
```typescript
// src/app/api/detect-bounding-boxes/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // 3. Process request
    const result = await processImage(image);

    // 4. Return response
    return NextResponse.json({ data: result }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Response Format

```typescript
{
  error: string;           // Human-readable error message
  code?: string;           // Machine-readable error code
  details?: object;        // Additional error details
}
```

### Success Response Format

```typescript
{
  data: any;              // Response payload
  message?: string;       // Optional success message
  meta?: {                // Optional metadata
    page?: number;
    totalCount?: number;
  };
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── layout.tsx (Root Layout)
│   ├── Metadata
│   ├── Font Loading (Geist)
│   └── Global Styles
│
├── page.tsx (Main Editor - Protected)
│   └── ImageEditor
│       ├── useImageEditor Hook
│       │   ├── Canvas State
│       │   ├── Sheet Management
│       │   ├── Object Manipulation
│       │   └── Export Logic
│       │
│       └── UI Components
│           ├── Toolbar
│           ├── Layer Panel
│           ├── Properties Panel
│           └── Canvas Area (FabricJS)
│
├── login/page.tsx (Public)
│   └── LoginForm
│       ├── Email Input
│       ├── Password Input
│       └── Submit Button
│
├── remove-bg/page.tsx (Protected)
│   └── BackgroundRemovalTool
│       ├── Image Upload
│       ├── Color Picker
│       └── Preview/Download
│
├── remove-bg-photo-room/page.tsx (Protected)
│   └── PhotoRoomIntegration
│       └── PhotoRoom API Client
│
└── detect-bounding-boxes/page.tsx (Protected)
    └── BoundingBoxEditor
        ├── Image Upload
        ├── FabricJS Canvas
        └── Box Visualization
```

### State Management Strategy

**Hook-Based Architecture:**
```
useImageEditor (733 lines)
├── Local State (useState)
│   ├── canvas
│   ├── sheets
│   ├── currentSheet
│   ├── selectedObjects
│   ├── zoom
│   └── ... more states
│
├── Side Effects (useEffect)
│   ├── Canvas initialization
│   ├── Event listeners
│   └── Cleanup
│
└── Callbacks (useCallback)
    ├── createObject()
    ├── modifyObject()
    ├── deleteObject()
    ├── createSheet()
    ├── selectSheet()
    ├── setZoom()
    ├── exportPage()
    ├── exportBook()
    └── ... 32+ more callbacks
```

**No External State Library:**
- React hooks sufficient for current complexity
- Centralized in useImageEditor hook
- Passed via props and context (if needed)

### Canvas Architecture

**FabricJS Integration:**
```typescript
// Canvas Initialization
const canvas = new fabric.Canvas('canvas-id', {
  width: 8.5 * 96,  // Letter width at 96 DPI
  height: 11 * 96,  // Letter height at 96 DPI
  selection: true,
  backgroundColor: '#ffffff'
});

// Object Creation
const rect = new fabric.Rect({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fill: 'blue'
});

canvas.add(rect);
```

**DPI Handling:**
- Base canvas: 72 DPI (web standard)
- Transformation for different DPI
- Coordinate scaling for AI results

---

## Deployment Architecture

### Vercel Deployment

**Build Configuration:**
```json
{
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "outputDirectory": ".next",
  "installCommand": "bun install",
  "devCommand": "bun dev"
}
```

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

**Edge Functions:**
- Next.js API routes deployed as serverless functions
- Auto-scaling based on traffic
- Global edge network for low latency

### CI/CD Pipeline

**Automatic Deployment:**
```
Git Push to Main
    │
    ▼
Vercel Detects Change
    │
    ▼
Build Process
    ├── Install Dependencies (bun install)
    ├── Run Type Check (tsc)
    ├── Run Linter (eslint)
    ├── Build Next.js (bun run build)
    └── Run Tests (if configured)
    │
    ▼
Deploy to Edge Network
    │
    ▼
Health Check
    │
    ▼
Production Live
```

**Preview Deployments:**
- Every PR gets preview URL
- Isolated environment for testing
- Same production configuration

---

## Security Architecture

### Authentication Security

**Supabase Auth Features:**
- Bcrypt password hashing
- JWT tokens with expiration
- Refresh token rotation
- Email verification (configurable)
- Rate limiting on auth endpoints

**Session Security:**
- HttpOnly cookies (not accessible via JavaScript)
- Secure flag (HTTPS only in production)
- SameSite=Lax (CSRF protection)
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (30 days)

### API Security

**Protection Layers:**
```
Request
    │
    ▼
HTTPS (TLS 1.3)
    │
    ▼
CORS Policy
    │
    ▼
Middleware Auth Check
    │
    ▼
Input Validation
    │
    ▼
Rate Limiting (Vercel)
    │
    ▼
Process Request
    │
    ▼
Response
```

**Environment Variable Security:**
- Server-only vars never exposed to client
- `NEXT_PUBLIC_*` prefix for client-safe vars
- Vercel encrypted storage
- No secrets in git (.gitignore)

### Database Security

**Row Level Security (RLS):**
```sql
-- Example: Users can only access own books
CREATE POLICY "Own books only"
  ON books FOR ALL
  USING (auth.uid() = user_id);
```

**SQL Injection Prevention:**
- Supabase client uses parameterized queries
- No raw SQL from user input
- TypeScript type safety

### Content Security

**CSP Headers (Future Enhancement):**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval';"
  }
];
```

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
- Automatic route-based splitting (Next.js)
- Dynamic imports for heavy components
- Lazy loading for AI features

**Image Optimization:**
- Next.js Image component (automatic)
- WebP format with fallbacks
- Responsive image sizes
- Lazy loading off-screen images

**Canvas Performance:**
- FabricJS rendering optimizations
- Debounced zoom/pan operations
- Virtual scrolling for layer lists
- Object caching

### Backend Optimization

**API Route Optimization:**
- Serverless function cold start mitigation
- Concurrent request handling
- Response compression (gzip/brotli)

**Database Optimization:**
- Indexed columns (id, user_id, created_at)
- Query result caching
- Connection pooling (Supabase)

### Caching Strategy

**Static Assets:**
- CDN caching (Vercel Edge)
- Immutable assets (/_next/static/*)
- Long cache headers (1 year)

**API Responses:**
```typescript
// Cache API responses (future)
export const revalidate = 60; // 60 seconds

export async function GET() {
  const data = await fetchData();
  return NextResponse.json({ data });
}
```

### Monitoring & Observability

**Vercel Analytics:**
- Web Vitals tracking
- Core Web Vitals (LCP, FID, CLS)
- Real user monitoring

**Future Enhancements:**
- Error tracking (Sentry)
- Performance monitoring (Datadog, New Relic)
- API usage metrics
- Database query performance

---

## Scalability Considerations

### Horizontal Scaling

**Serverless Architecture Benefits:**
- Auto-scaling API routes
- Pay-per-invocation pricing
- No server management
- Global edge distribution

### Database Scaling

**Supabase Scaling:**
- Vertical scaling (CPU/RAM upgrades)
- Read replicas for high-read workloads
- Connection pooling (pgBouncer)
- Database caching

### File Storage Scaling

**Future Implementation:**
- Supabase Storage for images
- CDN integration for global delivery
- Automatic image optimization
- Lazy loading strategies

---

## Future Architecture Enhancements

### 1. Real-Time Collaboration
```
Supabase Realtime
    │
    ├── WebSocket Connections
    ├── Broadcast Canvas Changes
    ├── Presence Tracking
    └── Conflict Resolution
```

### 2. Offline Support
```
Service Worker
    │
    ├── Cache Canvas State (IndexedDB)
    ├── Queue API Requests
    ├── Sync on Reconnect
    └── PWA Capabilities
```

### 3. Microservices (If Scaling Needed)
```
Current: Monolithic
    │
    ▼
Future: Microservices
    ├── Auth Service (Supabase)
    ├── Image Processing Service
    ├── AI Service (Gemini)
    ├── Storage Service
    └── API Gateway
```

### 4. Advanced AI Features
```
AI Pipeline
    │
    ├── Style Transfer
    ├── Auto-Layout
    ├── Smart Cropping
    ├── Content-Aware Fill
    └── Generative AI (Image Creation)
```

---

## Diagrams

### Request Flow Diagram

```
User Request
    │
    ▼
Next.js Middleware
    │
    ├── Session Check ───┐
    │                    │ Invalid
    │                    ▼
    │              Redirect to /login
    │
    │ Valid
    ▼
Server Component (if SSR)
    │
    ├── Fetch Data (Supabase)
    ├── Process Business Logic
    └── Render HTML
    │
    ▼
Client Hydration
    │
    ├── Attach Event Listeners
    ├── Initialize Canvas (FabricJS)
    └── Enable Interactivity
    │
    ▼
User Interaction
    │
    ├── Canvas Manipulation
    ├── API Calls (AI Processing)
    └── State Updates (Hooks)
```

---

**Last Updated:** 2025-12-19
**Maintainer:** Development Team
**Review Frequency:** Quarterly or on major architectural changes
