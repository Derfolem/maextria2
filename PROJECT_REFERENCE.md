MAEXTRIA - PROJECT REFERENCE
================================

Purpose
-------
This file captures essential project context so the assistant can proceed
even if workspace commands produce no output. Keep it updated when major
architecture or tooling changes happen.

High-level summary
------------------
- Platform: MAEXTRIA (educational platform)
- Frontend: React + Vite + TypeScript
- Backend: Node + Express + SQLite
- Production site: https://maextria.com.br
- Deploy: Vercel (frontend) + Supabase (services)
- User roles: aluno, professor, admin (distinct dashboards)
- Integrations: OpenAI for content generation; paid certificates

Frontend package.json (verbatim)
-------------------------------
{
  "name": "maextria-frontend",
  "version": "1.0.0",
  "description": "Frontend da plataforma MAEXTRIA de cursos online",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run generate-sitemap && tsc && vite build && npm run build:ssr && node scripts/prerender.mjs",
    "build:ssr": "vite build --ssr src/entry-server.tsx --outDir dist-ssr",
    "preview": "vite preview",
    "generate-sitemap": "node scripts/generate-sitemap.mjs"
  },
  "dependencies": {
    "@stripe/react-stripe-js": "^2.9.0",
    "@stripe/stripe-js": "^4.0.0",
    "@supabase/supabase-js": "^2.45.6",
    "@types/dompurify": "^3.0.5",
    "axios": "^1.6.2",
    "dompurify": "^3.3.1",
    "framer-motion": "^10.18.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.6.0",
    "react-icons": "^4.12.0",
    "react-router-dom": "^6.20.1",
    "recharts": "^2.15.4",
    "uuid": "^13.0.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/uuid": "^10.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}

Backend package.json (verbatim)
------------------------------
{
  "name": "maextria-backend",
  "version": "1.0.0",
  "description": "Backend da plataforma MAEXTRIA de cursos online",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:init": "node dist/database/init.js",
    "db:seed": "tsx src/database/seed.ts"
  },
  "keywords": [
    "courses",
    "learning",
    "education"
  ],
  "author": "MAEXTRIA",
  "license": "MIT",
  "dependencies": {
    "better-sqlite3": "^11.8.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.7",
    "openai": "^4.20.1",
    "uuid": "^9.0.1",
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.6",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
