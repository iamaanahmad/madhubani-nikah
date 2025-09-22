# Madhubani Nikah - Islamic Matrimony Platform

**Halal Connections, Trusted Platform.**

Madhubani Nikah is a modern, privacy-first Islamic matrimony platform built with Next.js, designed specifically for the Muslim community of the Madhubani region. Our mission is to provide a safe, secure, and 100% free environment where individuals can find suitable life partners according to Islamic values, with a "character-first" approach that emphasizes piety, education, and family values.

---

## ✨ Key Features

- **Privacy-Centric**: Users have full control over their data, with features like optional photo uploads, blurred photos, and secure internal messaging.
- **Progressive Web App (PWA)**: Installable on any device for a native app-like experience with offline capabilities.
- **AI-Powered Smart Matching**: Utilizes Google's Gemini AI via Genkit to provide intelligent explanations for why two profiles are a good match.
- **100% Free**: The platform is a community service with no subscription fees or hidden charges.
- **Multi-Language Support (i18n)**: Fully localized in English, Hindi, and Urdu to serve the entire community.
- **Admin Dashboard**: A comprehensive back-office for managing users, verifying profiles, and overseeing platform activity.
- **Modern, Responsive UI**: A beautiful and accessible user interface built with ShadCN UI and Tailwind CSS.
- **Family-Oriented**: Encourages family involvement in a way that respects individual choice and control.

---

## 🏗️ Architecture & Tech Stack

This project is built on a robust and modern tech stack, leveraging server-side rendering for performance and a component-based architecture for maintainability.

### Core Technologies

| Category                | Technology                                                                                                   | Purpose                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Framework**           | [**Next.js 14+ (App Router)**](https://nextjs.org/)                                                          | React framework for Server-Side Rendering (SSR), Server Components, and file-based routing. |
| **Language**            | [**TypeScript**](https://www.typescriptlang.org/)                                                            | Superset of JavaScript for static typing and improved code quality.                    |
| **Styling**             | [**Tailwind CSS**](https://tailwindcss.com/)                                                                 | A utility-first CSS framework for rapid UI development.                                |
| **UI Components**       | [**ShadCN UI**](https://ui.shadcn.com/)                                                                      | A collection of beautifully designed, accessible, and unstyled components.             |
| **Icons**               | [**Lucide React**](https://lucide.dev/)                                                                      | A clean and consistent icon library.                                                   |
| **Generative AI**       | [**Genkit (Gemini)**](https://firebase.google.com/docs/genkit)                                               | Google's open-source framework for building AI-powered features with Google Gemini.    |
| **Internationalization**| [**next-intl**](https://next-intl.dev/)                                                                      | Library for handling translations, localized routing, and formatting.                  |
| **PWA**                 | [**@ducanh2912/next-pwa**](https://github.com/DuCanh2912/next-pwa)                                            | Enables Progressive Web App capabilities, including service workers and offline support. |
| **Forms**               | [**React Hook Form**](https://react-hook-form.com/) & [**Zod**](https://zod.dev/)                               | Efficient form management and schema-based validation.                                 |
| **Charts**              | [**Recharts**](https://recharts.org/)                                                                        | A composable charting library for React, used in the Admin Analytics dashboard.        |

### Architectural Decisions

- **App Router**: We use the Next.js App Router for its support for nested layouts, loading states, and Server Components, which significantly improves performance by reducing client-side JavaScript.
- **Server Components by Default**: Most components are rendered on the server to fetch data and render static HTML, improving initial page load times. Interactive components are explicitly marked with the `'use client';` directive.
- **Genkit for AI**: All AI-driven functionality is encapsulated in Genkit "flows" located in `src/ai/flows`. This separates the AI logic from the UI and allows for structured, testable, and powerful AI features.
- **Intended Backend (Appwrite)**: The application is designed to integrate with [Appwrite](https://appwrite.io/) as its backend-as-a-service. The complete specification for the database collections, attributes, storage buckets, and authentication is documented in `src/lib/appwrite-spec.md`.

---

## 📂 Project Structure

The project follows a feature-colocated structure within the `src/` directory.

```
/
├── public/                 # Static assets, fonts, icons, and manifest.json
├── src/
│   ├── ai/                 # Genkit AI configuration and flows
│   │   ├── flows/          # AI-powered features (e.g., match explanation)
│   │   └── genkit.ts       # Genkit initialization
│   ├── app/                # Next.js App Router
│   │   ├── [locale]/       # Internationalized routes
│   │   │   ├── (main)/     # Main application pages and layouts
│   │   │   ├── admin/      # Admin dashboard pages and layout
│   │   │   ├── layout.tsx  # Locale-specific layout
│   │   │   └── page.tsx    # Home page
│   │   ├── globals.css     # Global styles and ShadCN theme variables
│   │   └── layout.tsx      # Root layout of the application
│   ├── components/         # Reusable React components
│   │   ├── admin/          # Components for the admin dashboard
│   │   ├── layout/         # Page layout components (Header, Footer, Sidebar)
│   │   ├── matches/        # Components for displaying user matches
│   │   ├── profile/        # Components for the user profile page
│   │   ├── shared/         # Components shared across the entire app
│   │   └── ui/             # Core ShadCN UI components (Button, Card, etc.)
│   ├── hooks/              # Custom React hooks (e.g., useToast)
│   ├── lib/                # Shared utilities, data, and types
│   ├── locales/            # Translation files (en.json, hi.json, ur.json)
│   ├── i18n.ts             # next-intl configuration
│   └── middleware.ts       # next-intl middleware for locale handling
├── next.config.ts          # Next.js configuration, including PWA setup
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or a compatible package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd madhubani-nikah
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory. If you are using Genkit with Google AI, you will need to add your API key.
    ```env
    GEMINI_API_KEY=your_google_ai_api_key
    ```

### Running the Development Server

To run the application in development mode, you need to run both the Next.js app and the Genkit development server.

1.  **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

2.  **Run the Genkit development server (in a separate terminal):**
    This allows you to test and interact with your AI flows.
    ```bash
    npm run genkit:watch
    ```
    The Genkit UI will be available at [http://localhost:4000](http://localhost:4000).

---

## 💡 Key Logic & Components

- **`src/app/[locale]/layout.tsx`**: This is the entry point for all pages. It sets up the internationalization context using `NextIntlClientProvider`.
- **`src/components/layout/main-layout.tsx`**: This component wraps most pages, providing the standard header, footer, and sidebar structure.
- **`src/ai/flows/smart-match-explanation.ts`**: A Genkit flow that takes two user profiles and uses the Gemini LLM to generate a human-readable explanation of their compatibility.
- **`src/components/matches/match-card.tsx`**: A versatile component for displaying a user's profile summary, with different states for logged-in users, logged-out users, and previews.
- **`src/components/shared/install-pwa-prompt.tsx`**: A custom, beautifully designed component that prompts users to install the app on their device, improving user retention.
