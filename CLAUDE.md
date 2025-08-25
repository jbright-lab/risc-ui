# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 React application with TypeScript, Tailwind CSS, and modern tooling. The project uses the App Router architecture with a `src/` directory structure and includes Turbopack for fast development builds.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack
npm run dev

# Start development server with WebSocket support
npm run dev:ws

# Build for production
npm run build

# Start production server (with WebSocket)
npm start

# Run linting
npm run lint
```

### Package Management
```bash
# Install dependencies
npm install

# Add new dependencies
npm install <package-name>

# Add dev dependencies
npm install -D <package-name>
```

### Docker
```bash
# Build Docker image
docker build -t risc-ui .

# Run Docker container
docker run -p 3000:3000 risc-ui

# Run with custom port
docker run -p 8080:3000 risc-ui
```

## Project Structure

### Key Directories
- `src/app/`: App Router pages and layouts (Next.js 13+ App Directory)
- `src/app/globals.css`: Global styles with Tailwind CSS
- `public/`: Static assets (images, icons, etc.)

### Configuration Files
- `next.config.ts`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS configuration (if created)
- `tsconfig.json`: TypeScript configuration with path mapping (`@/*` → `src/*`)
- `eslint.config.mjs`: ESLint configuration using Next.js presets

## Architecture Notes

### App Router Structure
- Uses Next.js 15 App Router with TypeScript
- Layout components define shared UI structure
- Pages are defined as `page.tsx` files in route directories
- Import alias `@/*` maps to `src/*` for clean imports

### Styling
- Tailwind CSS 4.0 with PostCSS integration
- Geist font family (Sans and Mono variants) included
- Dark mode support built into components
- CSS custom properties for theming

### Development Tools
- Turbopack enabled for fast development builds
- ESLint with Next.js and TypeScript presets
- Strict TypeScript configuration
- Hot reloading and fast refresh enabled
- WebSocket integration for real-time data updates

## Common Patterns

### Component Structure
```typescript
// Typical component structure
import type { ComponentProps } from 'react';

interface MyComponentProps {
  // props definition
}

export default function MyComponent({ }: MyComponentProps) {
  return (
    // JSX
  );
}
```

### Import Patterns
```typescript
// Use @ alias for src imports
import Component from '@/components/Component';
import { utility } from '@/lib/utils';

// Next.js specific imports
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
```

### File Naming
- Components: PascalCase (e.g., `MyComponent.tsx`)
- Pages: lowercase (e.g., `page.tsx`, `layout.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)