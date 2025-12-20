# Email Outreach System

## Overview
This project is an AI-powered email outreach system designed for a single user to manage contacts, generate personalized emails, send bulk communications, track replies, and automate timed follow-ups. It includes persistent storage and detailed analytics. The system aims to be a powerful, scalable tool for effective email campaigns across sales, marketing, and recruitment. It also integrates a visual workflow builder for multi-channel outreach automation and incorporates research-backed sales psychology for message generation.

## User Preferences
- **Email Language Style**: Emails should use simple, natural, human-like language. Avoid overly complicated words, corporate jargon, or formal phrases. Write like a real person talking to another person.
- **Form Fields**: Only include fields that are explicitly mentioned in the user's prompt. Do not create placeholder fields for optional information (like "specific topic discussed") unless the user specifically requests them.

## System Architecture

### UI/UX Decisions
The user interface is built with React, TypeScript, Tailwind CSS, and Shadcn UI, featuring a blue primary color, status-specific colors, a white background, and a system font stack. The landing page uses a violet/fuchsia gradient, blur orbs, Framer Motion, and glassmorphism. A 45%/55% split is used for the compose tab, and users bypass onboarding post-authentication.

### Technical Implementations
The system uses a React frontend with TanStack Query, an Express.js backend with TypeScript, and a PostgreSQL database (Neon-backed). It's a multi-tenant platform with strict tenant isolation, scalable for many users. Authentication is via OAuth (Gmail/Outlook/Yahoo). OpenAI powers AI-driven personalization. The codebase follows a micro-architecture pattern, with modules under 300 lines.

Core functionalities include:
- **Authentication System**: Production-grade Replit Auth OIDC integration with PostgreSQL-backed session store and automatic token refresh.
- **Email Connectors**: Optional Gmail, Outlook, and Yahoo OAuth for linking accounts.
- **Main Application**: Features for campaign creation, contact management (AI bulk import, deduplication), sent email tracking, an inbox with automated reply monitoring, and user settings.
- **Compose Page**: A three-step workflow for form completion, AI email variant generation, selection, contact addition, and sending.
- **Bulletproof Follow-Up Engine**: Reliable follow-up automation with a persistent job queue, pre-flight checks, and audit trails.
- **Automated Email Monitoring System**: Configurable background service for reply detection, SMS notifications via Twilio, and two-pass AI validation.
- **Bulletproof Reply Detection System**: A robust system designed for 100% reply detection using multi-tier scanning, Gmail History API, Message-ID correlation, and AI classification.
- **Email Deliverability Diagnostics**: Checks SPF/DKIM/DMARC authentication and classifies bounces.
- **Analytics Dashboard**: Comprehensive, multi-tenant campaign performance analytics.
- **Email Personalization System**: AI personalization with a priority pipeline for writing style, tone, user instructions, and variant diversity.
- **Lead Finder (Apollo.io Integration)**: Automated lead discovery with free people search, advanced filters, and campaign-scoped import.
- **AI-Powered Conversational Search**: Natural language lead discovery with ICP learning and semantic matching.
- **SMS Outreach System**: Integrated SMS capability with AI personalization, character counter, Twilio integration, and phone enrichment from Apollo.io.
- **Bulletproof AI Auto-Reply System**: Intelligent automatic meeting booking with zero-mistake intent detection via three-layer verification (two AI passes + deterministic pattern validation), a background scheduler, robust retry logic, and dual notifications.
- **LinkedIn Outreach System**: Uses Phantombuster for browser automation of connection requests and direct messages, managed by a bulletproof job queue with daily limits and retry logic.
- **AI Workflow Automation System**: A visual workflow builder for multi-channel outreach automations.
    - **Natural Language Workflow Creation**: AI generates workflows from plain English descriptions.
    - **Visual Workflow Editor**: React Flow-based editor with color-coded nodes for triggers, actions, conditions, and delays.
    - **AI Chat Refinement**: Iterative workflow modification through conversational AI.
    - **Scheduling System**: Cron-like scheduling with recurrence options and timezone configuration.
    - **Workflow Execution Engine**: Breadth-first graph traversal for executing workflows, logging steps, and handling branching.
    - **Run History Panel**: Real-time execution monitoring with status, timestamps, metrics, and error messages.
- **Sales Psychology System**: AI message generation optimized with sales psychology principles.
    - **No-Fabrication Rule**: AI uses only provided personalization data.
    - **Tiered Personalization**: 4-tier system based on data availability (Name only, Name + Company/Role, Name + Company + Pain Point, Full Context + Trigger).
    - **Channel-Specific Optimization**: Tailored content for Email, SMS, and LinkedIn.
    - **Cognitive Biases Applied**: Incorporates reciprocity, social proof, curiosity gap, and loss aversion.
    - **Follow-Up Sequence**: Research-backed timing and strategies for follow-up emails.

### System Design Choices
- **Micro-Architecture Pattern**: Small, focused modules for maintainability.
- **Database Schema**: Modularized core tables defined with Drizzle ORM.
- **API Endpoints**: Comprehensive RESTful API.
- **OpenAI Integration**: Utilizes GPT-5 with JSON response and strict prompt engineering.
- **Scalability**: Leverages Neon-backed serverless PostgreSQL and Drizzle ORM.
- **UI/UX Refinements**: Streamlined campaign builder, smart authentication routing, no onboarding.
- **Critical Implementation Rule**: Avoid dynamic Tailwind class names; use explicit, literal names.
- **Multi-Tenant Isolation**: Complete isolation across all subsystems.
- **OAuth-Only Authentication**: Pure OAuth authentication with no bypasses.

## External Dependencies
-   **PostgreSQL**: Neon-backed for data storage and session management.
-   **Replit Auth (OIDC)**: User authentication.
-   **Gmail API**: Sending, reading, and modifying emails.
-   **Microsoft Graph API**: Sending, reading, and modifying emails.
-   **OpenAI**: Via Replit AI Integrations (GPT-5) for email generation, personalization, and appointment detection.
-   **Twilio SMS API**: Sending SMS notifications.
-   **Apollo.io API**: Lead discovery and people search.
-   **Phantombuster**: LinkedIn automation for connection requests and direct messages.