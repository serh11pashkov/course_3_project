# Course Management Platform

A Next.js application for managing courses, assignments, and grading with AI-powered assessment capabilities.

## Features

- **Student Dashboard**: View enrolled courses and assignment submissions
- **Teacher Dashboard**: Manage courses, create assignments, and grade submissions
- **Assignment Grading**: AI-assisted grading with rubric-based evaluation
- **File Management**: Upload and download course materials and student submissions
- **Authentication**: Secure login with NextAuth

## Tech Stack

- **Next.js 15.5** (React 19)
- **TypeScript**
- **Tailwind CSS**
- **Firebase/Firestore**
- **NextAuth 4.24**
- **Google Genkit** (AI features)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build & Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

The application runs on **port 9002** in both development and production.

## Project Structure

- `/src/app` - Next.js pages and API routes
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and Firebase configs
- `/src/ai` - AI/Genkit integration for grading
- `/docs` - Architecture and database documentation
