# Code Standards & Development Guidelines

**Last Updated:** 2025-12-19
**Applies To:** Image Book Editor Project
**Stack:** Next.js 15 + React 19 + TypeScript 5

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [TypeScript Standards](#typescript-standards)
3. [React Component Patterns](#react-component-patterns)
4. [Next.js Conventions](#nextjs-conventions)
5. [Styling Guidelines](#styling-guidelines)
6. [API Route Standards](#api-route-standards)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Testing Standards](#testing-standards)
10. [Git Workflow](#git-workflow)
11. [Code Review Checklist](#code-review-checklist)

---

## Project Structure

### Directory Organization

**Mandatory Structure:**
```
src/
├── app/                    # Next.js App Router (routes + layouts)
│   ├── api/               # API routes only
│   ├── [route]/           # Page routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Root page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── [ComponentName]/   # Component directories (PascalCase)
│   │   └── index.tsx     # Main component file
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
│   └── use[HookName].ts  # Hook files (camelCase with 'use' prefix)
├── lib/                  # Utility libraries
│   ├── supabase/        # Supabase clients and queries
│   └── utils.ts         # Shared utilities
└── middleware.ts        # Next.js middleware
```

**Naming Conventions:**
- **Components:** PascalCase directories and files (`ImageEditor/`, `BoundingBoxEditor/`)
- **Hooks:** camelCase with `use` prefix (`useImageEditor.ts`, `useIsMobile.ts`)
- **Utilities:** camelCase (`utils.ts`, `queries.ts`)
- **API Routes:** kebab-case directories (`detect-bounding-boxes/`, `remove-background/`)
- **Page Routes:** kebab-case directories (`remove-bg/`, `detect-bounding-boxes/`)

---

## TypeScript Standards

### Configuration

**Strict Mode Required:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Definitions

**Prefer Interfaces for Objects:**
```typescript
// Good
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Avoid (unless extending types needed)
type UserProfile = {
  id: string;
  email: string;
};
```

**Use Type for Unions and Primitives:**
```typescript
// Good
type Status = 'idle' | 'loading' | 'success' | 'error';
type ID = string | number;

// Avoid
interface Status {
  value: 'idle' | 'loading' | 'success' | 'error';
}
```

### Type Safety

**Avoid `any` - Use `unknown` Instead:**
```typescript
// Bad
function processData(data: any) {
  return data.value;
}

// Good
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}
```

**Use Type Guards:**
```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}
```

### Null Safety

**Use Optional Chaining:**
```typescript
// Good
const userName = user?.profile?.name ?? 'Anonymous';

// Avoid
const userName = user && user.profile && user.profile.name || 'Anonymous';
```

**Explicit Return Types:**
```typescript
// Good - explicit return type
function getUser(id: string): Promise<User | null> {
  return supabase.from('users').select().eq('id', id).single();
}

// Avoid - inferred types (for public APIs)
function getUser(id: string) {
  return supabase.from('users').select().eq('id', id).single();
}
```

---

## React Component Patterns

### Component Structure

**Functional Components Only:**
```typescript
// Good
export default function MyComponent({ prop1, prop2 }: Props) {
  return <div>{prop1}</div>;
}

// Avoid class components (legacy)
export default class MyComponent extends React.Component {
  render() {
    return <div>{this.props.prop1}</div>;
  }
}
```

### Props Interface

**Define Props Interface:**
```typescript
interface ImageEditorProps {
  initialZoom?: number;
  onSave?: (data: BookData) => void;
  className?: string;
}

export default function ImageEditor({
  initialZoom = 100,
  onSave,
  className
}: ImageEditorProps) {
  // Component logic
}
```

**Props Destructuring:**
- Destructure in function signature
- Provide default values in destructuring
- Use optional chaining for nested props

### Client vs Server Components

**Default to Server Components:**
```typescript
// Server component (default, no directive)
import { createServerClient } from '@/lib/supabase/server';

export default async function ServerPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.from('books').select();

  return <div>{/* Render */}</div>;
}
```

**Mark Client Components Explicitly:**
```typescript
// Client component (needs interactivity)
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [state, setState] = useState(0);
  return <button onClick={() => setState(s => s + 1)}>{state}</button>;
}
```

**When to Use Client Components:**
- Event handlers (onClick, onChange, etc.)
- Hooks (useState, useEffect, custom hooks)
- Browser APIs (localStorage, window, etc.)
- Third-party libraries requiring window/document

### Hooks Usage

**Rules of Hooks:**
```typescript
// Good - hooks at top level
function MyComponent() {
  const [state, setState] = useState(0);
  const data = useCustomHook();

  if (condition) {
    return <div>Early return OK after hooks</div>;
  }

  return <div>{state}</div>;
}

// Bad - conditional hooks
function MyComponent() {
  if (condition) {
    const [state, setState] = useState(0); // ERROR
  }
}
```

**Custom Hook Pattern:**
```typescript
// File: src/hooks/useMyHook.ts
import { useState, useCallback } from 'react';

export function useMyHook() {
  const [state, setState] = useState<State>({});

  const action = useCallback(() => {
    setState(prev => ({ ...prev, updated: true }));
  }, []);

  return { state, action };
}

// Usage in component
import { useMyHook } from '@/hooks/useMyHook';

export default function Component() {
  const { state, action } = useMyHook();
  return <button onClick={action}>{state.value}</button>;
}
```

### Component Composition

**Prefer Composition Over Props:**
```typescript
// Good - composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Avoid - too many props
<Card
  title="Title"
  content="Content"
  hasHeader={true}
  hasFooter={false}
/>
```

---

## Next.js Conventions

### App Router Structure

**Page Component Pattern:**
```typescript
// src/app/my-route/page.tsx
export default function MyRoutePage() {
  return <div>Page content</div>;
}
```

**Layout Component Pattern:**
```typescript
// src/app/my-route/layout.tsx
export default function MyRouteLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>Navigation</nav>
      {children}
    </div>
  );
}
```

### Metadata

**Static Metadata:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
};

export default function Page() {
  return <div>Content</div>;
}
```

**Dynamic Metadata:**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await fetchData(params.id);

  return {
    title: data.title,
    description: data.description
  };
}
```

### Loading States

**Use loading.tsx:**
```typescript
// src/app/my-route/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

**Use Suspense for Components:**
```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Error Handling

**Use error.tsx:**
```typescript
// src/app/my-route/error.tsx
'use client';

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## Styling Guidelines

### Tailwind CSS

**Use Tailwind Utility Classes:**
```typescript
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  Content
</div>

// Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  Content
</div>
```

**Conditional Classes with `cn` Utility:**
```typescript
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded',
    isActive && 'bg-blue-500 text-white',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Button
</button>
```

**Component Variants with CVA:**
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### CSS Variables

**Use CSS Variables for Theming:**
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
}
```

**Reference in Tailwind:**
```typescript
<div className="bg-background text-foreground">
  Uses CSS variables
</div>
```

---

## API Route Standards

### File Structure

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle GET
}

export async function POST(request: NextRequest) {
  // Handle POST
}
```

### Error Handling Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Validate input
    const body = await request.json();

    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }

    // Process request
    const result = await processData(body);

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

### Authentication in API Routes

```typescript
import { createRouteClient } from '@/lib/supabase/route';

export async function POST(request: NextRequest) {
  const supabase = await createRouteClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Proceed with authenticated request
}
```

### Response Standards

**Success Response:**
```typescript
return NextResponse.json({
  data: result,
  message: 'Operation successful'
}, { status: 200 });
```

**Error Response:**
```typescript
return NextResponse.json({
  error: 'Error message',
  code: 'ERROR_CODE',
  details: { field: 'Additional info' }
}, { status: 400 });
```

---

## State Management

### Local State

**useState for Simple State:**
```typescript
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
```

### Complex State with Hooks

**Custom Hook Pattern (useImageEditor example):**
```typescript
// src/hooks/useImageEditor.ts
export function useImageEditor() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [zoom, setZoom] = useState(100);

  const createSheet = useCallback(() => {
    setSheets(prev => [...prev, createNewSheet()]);
  }, []);

  const selectSheet = useCallback((index: number) => {
    setCurrentSheet(index);
    // Additional logic
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setZoom(Math.max(25, Math.min(200, level)));
    canvas?.setZoom(level / 100);
  }, [canvas]);

  // ... 40+ more callbacks

  return {
    canvas,
    sheets,
    currentSheet,
    zoom,
    createSheet,
    selectSheet,
    setZoomLevel,
    // ... all other callbacks
  };
}
```

**Usage:**
```typescript
export default function ImageEditor() {
  const {
    canvas,
    sheets,
    currentSheet,
    zoom,
    createSheet,
    selectSheet,
    setZoomLevel
  } = useImageEditor();

  return (
    <div>
      <button onClick={createSheet}>New Sheet</button>
      <input
        type="range"
        value={zoom}
        onChange={(e) => setZoomLevel(Number(e.target.value))}
      />
    </div>
  );
}
```

### Server State

**Use Server Components for Data Fetching:**
```typescript
// Server component (async)
export default async function Page() {
  const supabase = await createServerClient();
  const { data } = await supabase.from('books').select();

  return <BookList books={data} />;
}
```

**Client-side Data Fetching (if needed):**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/browser';

export default function ClientComponent() {
  const [data, setData] = useState([]);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('books').select();
      setData(data);
    }
    fetchData();
  }, []);

  return <div>{data.map(...)}</div>;
}
```

---

## Error Handling

### Try-Catch Blocks

**Mandatory for Async Operations:**
```typescript
async function fetchUserData(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error; // Re-throw or handle appropriately
  }
}
```

### Error Boundaries

**Create Error Boundary Component:**
```typescript
// src/components/ErrorBoundary/index.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

**Usage:**
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

### Input Validation

**Validate API Inputs:**
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(0).max(120)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body); // Throws if invalid

    // Use validated data
    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

---

## Testing Standards

### Unit Tests

**Test Structure:**
```typescript
// src/hooks/__tests__/useImageEditor.test.ts
import { renderHook, act } from '@testing-library/react';
import { useImageEditor } from '../useImageEditor';

describe('useImageEditor', () => {
  it('should create a new sheet', () => {
    const { result } = renderHook(() => useImageEditor());

    act(() => {
      result.current.createSheet();
    });

    expect(result.current.sheets).toHaveLength(1);
  });

  it('should update zoom level', () => {
    const { result } = renderHook(() => useImageEditor());

    act(() => {
      result.current.setZoomLevel(150);
    });

    expect(result.current.zoom).toBe(150);
  });
});
```

### Component Tests

```typescript
// src/components/ImageEditor/__tests__/ImageEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ImageEditor from '../index';

describe('ImageEditor', () => {
  it('renders without crashing', () => {
    render(<ImageEditor />);
    expect(screen.getByText(/Image Editor/i)).toBeInTheDocument();
  });

  it('creates new sheet on button click', () => {
    render(<ImageEditor />);
    const button = screen.getByRole('button', { name: /new sheet/i });

    fireEvent.click(button);

    expect(screen.getByText(/Sheet 1/i)).toBeInTheDocument();
  });
});
```

### API Route Tests

```typescript
// src/app/api/remove-background/__tests__/route.test.ts
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('/api/remove-background', () => {
  it('returns 400 for missing image', async () => {
    const request = new NextRequest('http://localhost/api/remove-background', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('processes image successfully', async () => {
    const mockImage = new Blob(['fake-image'], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', mockImage);

    const request = new NextRequest('http://localhost/api/remove-background', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

---

## Git Workflow

### Branch Naming

**Convention:**
```
feature/short-description
bugfix/issue-description
hotfix/critical-fix
refactor/code-improvement
docs/documentation-update
```

**Examples:**
```
feature/ai-object-detection
bugfix/canvas-zoom-issue
hotfix/auth-session-timeout
refactor/extract-editor-hook
docs/api-documentation
```

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(editor): add multi-page support

Implemented sheet management and navigation for multi-page editing.
Added zoom controls and layer management.

Closes #123

---

fix(api): handle large image uploads

Increased max file size limit and added proper error handling
for oversized images.

Fixes #456

---

docs(readme): update setup instructions

Added environment variable documentation and Supabase setup steps.
```

### Pull Request Process

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes and Commit:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push to Remote:**
   ```bash
   git push origin feature/my-feature
   ```

4. **Create Pull Request:**
   - Descriptive title
   - Detailed description
   - Link related issues
   - Add screenshots if UI changes

5. **Code Review:**
   - Address reviewer comments
   - Update code as needed
   - Request re-review

6. **Merge:**
   - Squash commits if multiple small commits
   - Merge to main branch
   - Delete feature branch

---

## Code Review Checklist

### General

- [ ] Code follows project structure conventions
- [ ] TypeScript strict mode satisfied (no `any`)
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code
- [ ] ESLint passes without errors
- [ ] Build succeeds without warnings

### Components

- [ ] Client/server component directive appropriate
- [ ] Props interface defined
- [ ] Proper TypeScript types
- [ ] Hooks follow Rules of Hooks
- [ ] Event handlers have proper types
- [ ] Accessibility attributes present (ARIA, alt text)

### Styling

- [ ] Tailwind classes used (no inline styles)
- [ ] Responsive design considered
- [ ] Theme variables used for colors
- [ ] No hardcoded values

### API Routes

- [ ] Input validation implemented
- [ ] Error handling present
- [ ] Authentication checked if required
- [ ] Appropriate HTTP status codes
- [ ] Consistent response format

### Security

- [ ] No exposed secrets or API keys
- [ ] Environment variables used correctly
- [ ] User input sanitized
- [ ] Authentication/authorization checked
- [ ] SQL injection prevented (using Supabase ORM)

### Performance

- [ ] Images optimized
- [ ] Large components lazy loaded
- [ ] Database queries optimized
- [ ] No unnecessary re-renders
- [ ] Memoization used where appropriate

### Testing

- [ ] Unit tests for business logic
- [ ] Component tests for UI
- [ ] API route tests
- [ ] Edge cases covered
- [ ] Error scenarios tested

---

## Performance Best Practices

### Image Optimization

**Use Next.js Image Component:**
```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // for above-the-fold images
/>
```

### Code Splitting

**Dynamic Imports:**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false // disable SSR for client-only components
});
```

### Memoization

**useMemo for Expensive Calculations:**
```typescript
const expensiveResult = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

**useCallback for Function References:**
```typescript
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

**React.memo for Component Optimization:**
```typescript
const MyComponent = React.memo(function MyComponent({ prop }) {
  return <div>{prop}</div>;
});
```

---

## Accessibility Standards

### Semantic HTML

```typescript
// Good
<button onClick={handleClick}>Click Me</button>

// Avoid
<div onClick={handleClick}>Click Me</div>
```

### ARIA Attributes

```typescript
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
>
  <CloseIcon />
</button>
```

### Keyboard Navigation

```typescript
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Interactive Element
</div>
```

---

## Documentation Standards

### Component Documentation

```typescript
/**
 * ImageEditor component provides multi-page canvas-based image editing.
 *
 * @example
 * ```tsx
 * <ImageEditor
 *   initialZoom={100}
 *   onSave={(data) => console.log(data)}
 * />
 * ```
 */
export default function ImageEditor({ initialZoom, onSave }: ImageEditorProps) {
  // Implementation
}
```

### Function Documentation

```typescript
/**
 * Removes background from an image using Sharp processing.
 *
 * @param imageBuffer - The image buffer to process
 * @param backgroundColor - Optional background color (hex format)
 * @returns Processed image buffer with background removed
 * @throws {Error} If image processing fails
 */
async function removeBackground(
  imageBuffer: Buffer,
  backgroundColor?: string
): Promise<Buffer> {
  // Implementation
}
```

### API Documentation

```typescript
/**
 * POST /api/detect-bounding-boxes
 *
 * Detects objects in an image using Google Gemini 3 Pro AI.
 *
 * @param request.body.image - Image file (FormData)
 * @returns {Object} result
 * @returns {Array<BoundingBox>} result.boxes - Detected bounding boxes
 *
 * @example
 * const formData = new FormData();
 * formData.append('image', file);
 * const response = await fetch('/api/detect-bounding-boxes', {
 *   method: 'POST',
 *   body: formData
 * });
 */
```

---

**Last Updated:** 2025-12-19
**Review Frequency:** Quarterly or on major stack updates
**Maintainer:** Development Team
