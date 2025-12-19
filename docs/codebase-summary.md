# Codebase Summary

**Generated:** 2025-12-19
**Project:** Image Book Editor
**Tech Stack:** Next.js 15 + React 19 + TypeScript 5 + FabricJS

---

## Project Overview

Image Book Editor is a full-stack Next.js application providing multi-page canvas-based image editing with AI-powered features. The codebase follows Next.js 15 App Router conventions with clean separation between client/server components and comprehensive TypeScript typing.

**Key Statistics:**
- **Total Components:** 58 (2 custom + 56 UI library)
- **API Endpoints:** 2 (AI-powered processing)
- **Routes:** 5 (4 protected, 1 public)
- **Custom Hooks:** 2 (1 major state hook)
- **Lines of Code:** ~2,000+ (excluding UI library)
- **Dependencies:** 60+
- **TypeScript Coverage:** 100%

---

## Directory Structure

```
image-book-editor/
├── .next/                          # Build output (gitignored)
├── .orchids/                       # Orchids configuration
│   └── orchids.json               # Project ID, deployment config
├── node_modules/                   # Dependencies
├── public/                         # Static assets
│   ├── file.svg                   # File icon
│   ├── globe.svg                  # Globe icon
│   ├── next.svg                   # Next.js logo
│   ├── vercel.svg                 # Vercel logo
│   └── window.svg                 # Window icon
├── src/                           # Source code
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes
│   │   │   ├── detect-bounding-boxes/
│   │   │   │   └── route.ts       # Gemini AI object detection
│   │   │   └── remove-background/
│   │   │       └── route.ts       # Sharp background removal
│   │   ├── detect-bounding-boxes/ # Object detection page
│   │   │   └── page.tsx
│   │   ├── login/                 # Authentication page
│   │   │   └── page.tsx
│   │   ├── remove-bg/             # Background removal page
│   │   │   └── page.tsx
│   │   ├── remove-bg-photo-room/  # PhotoRoom integration page
│   │   │   └── page.tsx
│   │   ├── layout.tsx             # Root layout (metadata, fonts)
│   │   ├── page.tsx               # Main editor (auth protected)
│   │   └── globals.css            # Global styles, Tailwind imports
│   ├── components/                # React components
│   │   ├── BoundingBoxEditor/     # Standalone canvas component
│   │   │   └── index.tsx          # 570 lines, FabricJS integration
│   │   ├── ImageEditor/           # Master editor component
│   │   │   └── index.tsx          # 120 lines, composite component
│   │   └── ui/                    # Radix UI components (56 files)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   ├── hooks/                     # Custom React hooks
│   │   ├── useImageEditor.ts      # 733 lines, main state management
│   │   └── useIsMobile.ts         # Mobile detection hook
│   ├── lib/                       # Utility libraries
│   │   ├── supabase/              # Supabase client configurations
│   │   │   ├── browser.ts         # Client-side Supabase client
│   │   │   ├── middleware.ts      # Middleware Supabase client
│   │   │   ├── queries.ts         # Database query functions (8 functions)
│   │   │   ├── route.ts           # Route handler Supabase client
│   │   │   └── server.ts          # Server-side Supabase client
│   │   └── utils.ts               # Utility functions (cn, etc.)
│   └── middleware.ts              # Auth middleware (route protection)
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── bun.lock                       # Bun lockfile
├── components.json                # shadcn/ui configuration
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── next-env.d.ts                  # Next.js type declarations
├── package.json                   # Dependencies and scripts
├── package-lock.json              # npm lockfile
├── postcss.config.mjs             # PostCSS configuration
├── README.md                      # Project readme
└── tsconfig.json                  # TypeScript configuration
```

---

## Core Components Analysis

### 1. ImageEditor Component
**Location:** `src/components/ImageEditor/index.tsx`
**Lines of Code:** 120
**Purpose:** Master composite component for multi-page image editing

**Key Features:**
- Multi-page/sheet management
- Canvas-based editing with FabricJS
- Zoom controls (25%-200%)
- Layer management interface
- Template application
- Export functionality

**Dependencies:**
- `useImageEditor` hook (733 lines)
- FabricJS for canvas manipulation
- Radix UI components for UI

**State Management:**
- 40+ callbacks from useImageEditor hook
- Hook handles all business logic
- Component focuses on presentation

**Props Interface:**
```typescript
// Inferred from usage
interface ImageEditorProps {
  // No required props, self-contained
}
```

---

### 2. BoundingBoxEditor Component
**Location:** `src/components/BoundingBoxEditor/index.tsx`
**Lines of Code:** 570
**Purpose:** Standalone canvas tool for AI object detection visualization

**Key Features:**
- FabricJS canvas integration
- DPI-aware coordinate handling
- Bounding box visualization
- Coordinate transformation (72 DPI to actual DPI)
- Rectangle drawing and manipulation

**Technical Details:**
- Canvas size: 8.5" x 11" (letter size)
- Coordinate system conversion for different DPI
- Event handling for box selection
- Visual feedback for detected objects

**Use Case:**
- Display AI-detected bounding boxes
- Manual bounding box creation
- Object selection and editing

---

### 3. useImageEditor Hook
**Location:** `src/hooks/useImageEditor.ts`
**Lines of Code:** 733
**Purpose:** Central state management for image editor

**Responsibilities:**
- Canvas state management
- Sheet/page navigation
- Object creation and manipulation
- Layer management
- Template handling
- Zoom controls
- Export logic

**Returns:** 40+ callbacks and state values
- createObject()
- modifyObject()
- deleteObject()
- renameObject()
- createSheet()
- deleteSheet()
- selectSheet()
- setZoom()
- applyTemplate()
- exportPage()
- exportBook()
- ... and more

**Architecture Pattern:**
- Single source of truth for editor state
- Encapsulates all business logic
- Clean separation from UI concerns
- Callback-based API for components

---

## API Routes

### 1. Detect Bounding Boxes
**Endpoint:** `POST /api/detect-bounding-boxes`
**Location:** `src/app/api/detect-bounding-boxes/route.ts`
**Purpose:** AI-powered object detection using Google Gemini 3 Pro

**Request:**
```typescript
// Accepts image data (multipart/form-data or base64)
FormData {
  image: File | Blob
}
```

**Response:**
```typescript
{
  boxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    confidence?: number;
  }>;
}
```

**AI Model:** Google Gemini 3 Pro (multimodal)
**Processing Time:** ~5-15s depending on image size
**Error Handling:** Returns 500 with error message on failure

---

### 2. Remove Background
**Endpoint:** `POST /api/remove-background`
**Location:** `src/app/api/remove-background/route.ts`
**Purpose:** Background removal using Sharp image processing

**Request:**
```typescript
FormData {
  image: File | Blob;
  backgroundColor?: string; // Hex color
}
```

**Response:**
```typescript
// Returns processed image as Blob
Blob (image/png)
```

**Processing:**
1. Sharp loads image
2. Removes background (alpha channel processing)
3. Optionally applies background color
4. Returns PNG with transparency

**Performance:** ~2-5s for typical images
**Max File Size:** 10MB (configurable)

---

## Page Routes

### 1. Main Editor (Root)
**Route:** `/`
**File:** `src/app/page.tsx`
**Auth:** Required (middleware protected)
**Purpose:** Primary multi-page image editor interface

**Components Used:**
- ImageEditor (master component)
- UI components (buttons, dialogs, etc.)

---

### 2. Login Page
**Route:** `/login`
**File:** `src/app/login/page.tsx`
**Auth:** Public
**Purpose:** Supabase email/password authentication

**Features:**
- Email/password form
- Supabase Auth integration
- Redirect to main editor on success

---

### 3. Background Removal (Sharp)
**Route:** `/remove-bg`
**File:** `src/app/remove-bg/page.tsx`
**Auth:** Required
**Purpose:** Standalone background removal tool using Sharp

**Features:**
- Image upload
- Custom background color picker
- Preview processed image
- Download result

---

### 4. Background Removal (PhotoRoom)
**Route:** `/remove-bg-photo-room`
**File:** `src/app/remove-bg-photo-room/page.tsx`
**Auth:** Required
**Purpose:** PhotoRoom API integration for background removal

**Features:**
- PhotoRoom API processing
- Higher quality removal
- API key required

---

### 5. Bounding Box Detection
**Route:** `/detect-bounding-boxes`
**File:** `src/app/detect-bounding-boxes/page.tsx`
**Auth:** Required
**Purpose:** AI object detection visualization

**Components:**
- BoundingBoxEditor component
- AI API integration
- Visual bounding box overlay

---

## Supabase Integration

### Client Configurations

**4 Client Files:**

1. **Browser Client** (`lib/supabase/browser.ts`)
   - Client-side operations
   - Uses NEXT_PUBLIC_ env vars
   - Client components only

2. **Server Client** (`lib/supabase/server.ts`)
   - Server-side operations
   - Cookie-based session
   - Server components, API routes

3. **Middleware Client** (`lib/supabase/middleware.ts`)
   - Route protection
   - Session validation
   - Redirect logic

4. **Route Client** (`lib/supabase/route.ts`)
   - API route handlers
   - Server-side processing
   - Database queries

### Query Functions
**Location:** `lib/supabase/queries.ts`
**Functions:** 8 database query helpers

**Examples:**
- `getUser()` - Fetch authenticated user
- `getUserProfile()` - Get user profile data
- `updateUserProfile()` - Update profile
- `createBook()` - Create new book
- `getBooks()` - List user's books
- `saveBookData()` - Persist book state
- ... (additional CRUD operations)

**Pattern:**
- Type-safe queries
- Error handling
- Return typed results

---

## Authentication Flow

### Middleware Protection
**File:** `src/middleware.ts`

**Logic:**
```typescript
1. Check session via middleware client
2. If no session → redirect to /login
3. If session valid → allow access
4. Exclude /login from protection
```

**Protected Routes:**
- `/` (main editor)
- `/remove-bg`
- `/remove-bg-photo-room`
- `/detect-bounding-boxes`

**Public Routes:**
- `/login`

---

## Styling System

### Tailwind CSS Configuration
- **Version:** 4.x
- **Configuration:** `postcss.config.mjs`
- **Global Styles:** `src/app/globals.css`

**Tailwind Setup:**
```css
@import "tailwindcss";

/* Custom styles */
:root {
  --background: ...;
  --foreground: ...;
  /* CSS variables for theming */
}
```

### shadcn/ui Configuration
**File:** `components.json`

```json
{
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Component Generation:**
```bash
npx shadcn@latest add [component-name]
```

---

## Type System

### TypeScript Configuration
**File:** `tsconfig.json`

**Key Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Path Aliases:**
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/app` → `src/app`

---

## Build Configuration

### Next.js Config
**File:** `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack enabled for dev
  // App Router required
  // TypeScript strict mode
};

export default nextConfig;
```

### ESLint Configuration
**File:** `eslint.config.mjs`

**Rules:**
- Next.js recommended rules
- React hooks rules
- TypeScript integration

---

## Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# AI APIs
GEMINI_API_KEY=<google-gemini-api-key>
```

### Optional Variables
```bash
# PhotoRoom API (for advanced background removal)
PHOTOROOM_API_KEY=<photoroom-api-key>
```

**Security:**
- `NEXT_PUBLIC_*` vars exposed to browser
- Server-only vars (GEMINI_API_KEY) never exposed
- `.env` in .gitignore
- `.env.example` as template

---

## Dependencies

### Core Framework (9 packages)
```json
"next": "15.5.7",
"react": "19.2.1",
"react-dom": "19.2.1",
"typescript": "^5"
```

### Canvas & Graphics (2 packages)
```json
"fabric": "^6.9.0",
"sharp": "^0.34.5"
```

### UI Library (20+ packages)
```json
"@radix-ui/react-*": "Multiple components",
"tailwindcss": "^4.0.0-beta.11",
"tailwind-merge": "^2.6.0",
"class-variance-authority": "^0.7.1"
```

### Backend & Auth (5 packages)
```json
"@supabase/supabase-js": "^2.49.2",
"@supabase/ssr": "^0.6.1"
```

### AI Integration (1 package)
```json
"@google/generative-ai": "^1.34.0"
```

### Forms & Validation (3 packages)
```json
"react-hook-form": "^7.54.2",
"@hookform/resolvers": "^3.9.2",
"zod": "^3.24.1"
```

### Utilities (10+ packages)
```json
"clsx": "^2.1.1",
"date-fns": "^4.1.0",
"lucide-react": "^0.469.0",
"sonner": "^1.7.3",
"recharts": "^2.15.0",
"vaul": "^1.1.6"
```

### Dev Dependencies (10+ packages)
```json
"@eslint/eslintrc": "^3",
"eslint": "^9",
"eslint-config-next": "15.5.7",
"@types/node": "^20",
"@types/react": "^19",
"@types/react-dom": "^19"
```

**Total:** 60+ dependencies

---

## Code Patterns & Conventions

### Component Pattern
```typescript
// Client component for interactive elements
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MyComponent() {
  const [state, setState] = useState();

  return (
    <div>
      <Button onClick={() => setState(...)}>
        Action
      </Button>
    </div>
  );
}
```

### Hook Pattern
```typescript
// Custom hook for reusable logic
export function useCustomHook() {
  const [state, setState] = useState();

  const action = useCallback(() => {
    // Logic
  }, [dependencies]);

  return {
    state,
    action
  };
}
```

### API Route Pattern
```typescript
// route.ts in api directory
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Process
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

### Server Component Pattern
```typescript
// Server component (no 'use client')
import { createServerClient } from '@/lib/supabase/server';

export default async function ServerPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.from('table').select();

  return <div>{/* Render data */}</div>;
}
```

---

## Performance Considerations

### Canvas Optimization
- FabricJS rendering optimizations
- Debounced zoom/pan operations
- Lazy loading for large canvases
- Virtual scrolling for layer lists

### Image Processing
- Sharp for fast server-side processing
- Client-side preview generation
- Lazy loading of images
- Progressive image loading

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (automatic)
- Lazy loading of AI features
- Tree-shaking of unused code

### Caching Strategy
- Static assets via Vercel CDN
- API route caching (configurable)
- Browser cache for images
- Supabase query caching

---

## Testing Strategy

**Current Status:** No test files present

**Recommended:**
- Unit tests for hooks (useImageEditor)
- Component tests for ImageEditor, BoundingBoxEditor
- Integration tests for API routes
- E2E tests for critical user flows

**Suggested Tools:**
- Jest for unit tests
- React Testing Library for components
- Playwright for E2E tests

---

## Security Considerations

### Authentication
- Server-side session validation
- Middleware route protection
- Supabase Row Level Security (RLS)

### API Security
- Environment variables for API keys
- Server-only processing for sensitive operations
- Input validation on API routes
- CORS configuration

### Data Security
- No client-side storage of sensitive data
- HTTPS enforcement (production)
- Secure cookie handling
- Sanitized user inputs

---

## Known Technical Debt

1. **Testing:** No test coverage
2. **Error Handling:** Limited error boundaries
3. **Documentation:** Inline code documentation sparse
4. **Accessibility:** Need ARIA labels, keyboard nav testing
5. **Performance Monitoring:** No APM integration
6. **Image Storage:** No persistent storage strategy implemented
7. **Collaborative Editing:** No real-time sync implemented

---

## Future Enhancement Areas

1. **State Management:** Consider Zustand/Jotai for complex state
2. **Database Schema:** Need migrations for book storage
3. **File Storage:** Implement Supabase Storage for images
4. **Real-time Features:** Supabase Realtime for collaboration
5. **Offline Support:** PWA capabilities
6. **Mobile Optimization:** Responsive canvas handling
7. **Export Formats:** PDF generation, print-ready output

---

## Development Workflow

### Local Development
```bash
# Install dependencies
bun install

# Run dev server (Turbopack)
bun dev

# Build for production
bun run build

# Run production build
bun start

# Lint code
bun run lint
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in Supabase credentials
3. Add Gemini API key
4. (Optional) Add PhotoRoom API key

### Adding UI Components
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
# etc.
```

---

## Deployment

### Vercel Deployment
**Platform:** Vercel (optimized for Next.js)
**Build Command:** `bun run build`
**Output Directory:** `.next`
**Install Command:** `bun install`

**Environment Variables:** Set in Vercel dashboard
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GEMINI_API_KEY

**Auto-Deploy:** Enabled via Orchids configuration

---

## Key Files Reference

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `src/hooks/useImageEditor.ts` | Main state hook | 733 | High |
| `src/components/BoundingBoxEditor/index.tsx` | Canvas component | 570 | High |
| `src/components/ImageEditor/index.tsx` | Master component | 120 | Medium |
| `src/middleware.ts` | Auth protection | ~30 | Low |
| `src/app/page.tsx` | Main editor page | ~100 | Medium |
| `src/app/api/detect-bounding-boxes/route.ts` | AI detection API | ~80 | Medium |
| `src/app/api/remove-background/route.ts` | Background removal API | ~60 | Medium |
| `src/lib/supabase/queries.ts` | Database queries | ~150 | Medium |

---

**Last Updated:** 2025-12-19
**Maintainer:** Development Team
**Review Frequency:** Monthly or on major changes
