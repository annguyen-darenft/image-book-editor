# Image Book Editor

A Next.js 15 full-stack application for creating multi-page image books with AI-powered editing capabilities including background removal and object detection.

## Features

- **Multi-Page Canvas Editor:** Create and edit image books with multiple pages using FabricJS
- **AI-Powered Tools:**
  - Object detection using Google Gemini 3 Pro
  - Background removal with Sharp and PhotoRoom integration
- **Layer Management:** Create, modify, and organize objects with intuitive controls
- **Zoom Controls:** 25%-200% zoom for precise editing
- **Template System:** Apply and customize layout templates
- **Export Options:** Export individual pages or entire books as images
- **Authentication:** Secure user authentication via Supabase

## Tech Stack

**Frontend:**
- Next.js 15.5.7 (App Router, Turbopack)
- React 19.2.1
- TypeScript 5.x
- FabricJS 6.9.0 (canvas engine)
- Tailwind CSS 4 + Radix UI (shadcn/ui)

**Backend:**
- Next.js API Routes (serverless)
- Supabase (auth, database)
- Sharp 0.34.5 (image processing)
- Google Gemini 3 Pro (AI detection)
- PhotoRoom API (background removal)

**Infrastructure:**
- Vercel (deployment)
- Bun (package manager)

## Prerequisites

- Bun 1.0+ (or Node.js 20+)
- Supabase account
- Google Gemini API key
- PhotoRoom API key (optional)

## Getting Started

### 1. Clone Repository

```bash
git clone <repository-url>
cd image-book-editor
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create `.env` file from template:

```bash
cp .env.example .env
```

Fill in required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# AI APIs
GEMINI_API_KEY=<your-google-gemini-api-key>

# Optional: PhotoRoom API
PHOTOROOM_API_KEY=<your-photoroom-api-key>
```

#### Getting Supabase Credentials:

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings > API
4. Copy Project URL and anon/public key

#### Getting Gemini API Key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy API key

### 4. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
bun run build
bun start
```

## Project Structure

```
image-book-editor/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes
│   │   │   ├── detect-bounding-boxes/
│   │   │   └── remove-background/
│   │   ├── detect-bounding-boxes/  # AI detection page
│   │   ├── login/                  # Auth page
│   │   ├── remove-bg/              # BG removal page
│   │   ├── remove-bg-photo-room/   # PhotoRoom integration
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Main editor
│   │   └── globals.css
│   ├── components/
│   │   ├── BoundingBoxEditor/      # Canvas component (570 lines)
│   │   ├── ImageEditor/            # Master editor (120 lines)
│   │   └── ui/                     # 56 Radix UI components
│   ├── hooks/
│   │   ├── useImageEditor.ts       # Main state hook (733 lines)
│   │   └── useIsMobile.ts
│   ├── lib/
│   │   ├── supabase/               # Supabase clients
│   │   └── utils.ts
│   └── middleware.ts               # Auth middleware
├── public/                         # Static assets
├── docs/                           # Documentation
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md
│   ├── code-standards.md
│   └── system-architecture.md
├── package.json
├── next.config.ts
└── tsconfig.json
```

## Usage Guide

### Main Image Editor

**Access:** `/` (requires authentication)

**Features:**
- Create/delete/navigate sheets (pages)
- Add/modify/delete objects on canvas
- Zoom controls (25%-200%)
- Layer management
- Template application
- Export pages or entire book

**Workflow:**
1. Login with email/password
2. Create new sheet or select existing
3. Add objects to canvas (images, text, shapes)
4. Organize layers and apply templates
5. Adjust zoom for precision
6. Export pages or complete book

### Background Removal Tool

**Access:** `/remove-bg`

**Features:**
- Upload image for processing
- Select custom background color
- Preview processed image
- Download result

**Using Sharp Processing:**
1. Upload image file
2. Choose background color (optional)
3. Click "Remove Background"
4. Download processed image

**Using PhotoRoom (Advanced):**
- Access `/remove-bg-photo-room`
- Requires PhotoRoom API key
- Higher quality removal

### Object Detection Tool

**Access:** `/detect-bounding-boxes`

**Features:**
- AI-powered object detection
- Visual bounding box overlay
- DPI-aware coordinate handling

**Workflow:**
1. Upload image
2. AI analyzes and detects objects
3. Bounding boxes rendered on canvas
4. View detected object coordinates

## API Endpoints

### POST /api/detect-bounding-boxes

Detect objects in images using Google Gemini 3 Pro.

**Request:**
```typescript
FormData {
  image: File | Blob
}
```

**Response:**
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

### POST /api/remove-background

Remove background from images using Sharp.

**Request:**
```typescript
FormData {
  image: File | Blob,
  backgroundColor?: string  // Hex color
}
```

**Response:**
```
Blob (image/png with transparency)
```

## Development

### Adding UI Components

This project uses shadcn/ui for UI components:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### Linting

```bash
bun run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## Authentication

### Email/Password Authentication

Default authentication uses Supabase email/password:

1. Navigate to `/login`
2. Enter email and password
3. Submit to create account or login
4. Redirected to main editor

### Session Management

- Sessions stored in httpOnly cookies
- Middleware validates on each request
- Auto-redirect to `/login` if unauthenticated
- Protected routes: `/`, `/remove-bg`, `/remove-bg-photo-room`, `/detect-bounding-boxes`

## Database Setup (Future)

Currently, the application does not persist book data. For production use, set up database tables:

**Suggested Schema:**
- `books` - User-created books
- `sheets` - Pages within books
- `canvas_objects` - Objects on each sheet

See `docs/system-architecture.md` for detailed schema.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `PHOTOROOM_API_KEY` (optional)

**Build Settings:**
- Framework: Next.js
- Build Command: `bun run build`
- Output Directory: `.next`
- Install Command: `bun install`

### Alternative Platforms

Compatible with any Next.js hosting provider:
- Netlify
- Railway
- Render
- Self-hosted

## Troubleshooting

### Build Errors

**Issue:** TypeScript errors during build
```bash
# Fix: Run type check
npx tsc --noEmit

# Check for any type errors and fix
```

**Issue:** Missing environment variables
```bash
# Ensure .env file exists with all required variables
cat .env
```

### Runtime Errors

**Issue:** "Unauthorized" on protected pages
- Check Supabase credentials in `.env`
- Verify session cookie is set (login again)
- Check middleware configuration

**Issue:** AI API failures
- Verify Gemini API key is valid
- Check API quota limits
- Ensure image format is supported

**Issue:** Canvas not rendering
- Check browser console for errors
- Verify FabricJS loaded correctly
- Ensure canvas element exists in DOM

### Performance Issues

**Issue:** Slow canvas rendering
- Reduce zoom level
- Limit objects on canvas
- Check browser performance

**Issue:** AI processing timeout
- Reduce image size
- Check network connection
- Verify API service status

## Contributing

### Code Standards

- Follow TypeScript strict mode
- Use functional components only
- Prefer composition over props
- Add type definitions for all props
- Use shadcn/ui for UI components

See `docs/code-standards.md` for detailed guidelines.

### Git Workflow

1. Create feature branch: `feature/description`
2. Make changes with conventional commits
3. Run linter: `bun run lint`
4. Push and create pull request
5. Request code review
6. Merge to main

**Commit Format:**
```
<type>(<scope>): <description>

feat(editor): add multi-page support
fix(api): handle large images
docs(readme): update setup instructions
```

## Documentation

Comprehensive documentation available in `/docs`:

- **project-overview-pdr.md** - Product requirements and roadmap
- **codebase-summary.md** - Detailed code analysis
- **code-standards.md** - Development guidelines
- **system-architecture.md** - Technical architecture

## License

[Your License Here]

## Support

For issues and questions:
- Create GitHub issue
- Check documentation in `/docs`
- Review troubleshooting section

## Roadmap

### Phase 1: MVP (Completed)
- [x] Multi-page canvas editor
- [x] AI background removal
- [x] AI object detection
- [x] User authentication
- [x] Export functionality

### Phase 2: Enhancement (Planned)
- [ ] Database persistence for books
- [ ] Cloud storage integration
- [ ] Advanced export formats (PDF)
- [ ] Template marketplace
- [ ] Version history

### Phase 3: Scale (Future)
- [ ] Real-time collaboration
- [ ] Mobile responsive design
- [ ] Plugin system
- [ ] Desktop app
- [ ] Advanced AI features

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [FabricJS](http://fabricjs.com)
- [Supabase](https://supabase.com)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Google Gemini AI](https://ai.google.dev)
- [Sharp](https://sharp.pixelplumbing.com)

---

**Last Updated:** 2025-12-19
**Version:** 1.0.0
