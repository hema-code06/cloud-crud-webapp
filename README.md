# Cloud CRUD

A full-stack web application for performing Create, Read, Update, and Delete operations on
Salesforce standard objects — **Account, Opportunity, Lead, Contact, and Case** — through a
custom UI, without ever touching the native Salesforce interface. Authentication is handled
entirely through Salesforce OAuth 2.0 (Authorization Code + PKCE) against a Salesforce External
Client App.

## Overview

Cloud CRUD lets a logged-in Salesforce user pick a standard object from a dropdown, and the
application dynamically discovers that object's fields through Salesforce's Describe API,
renders a form and a table from that metadata, and performs CRUD operations against real
Salesforce data through the REST API. No object-specific UI code exists anywhere in the
application — the same components drive Account, Opportunity, Lead, Contact, and Case screens
purely from metadata returned by Salesforce.

## Features

- **Salesforce OAuth 2.0 login** using the Authorization Code flow with PKCE — no passwords or
  tokens are ever handled or stored by the frontend.
- **Automatic access-token refresh.** Salesforce access tokens expire well before the app's
  8-hour session does; the backend detects an expired token, silently exchanges the stored
  refresh token for a new one, and retries the failed request — so a long-lived session doesn't
  suddenly start failing partway through.
- **Object selector** with the five required standard objects: Account, Opportunity, Lead,
  Contact, Case.
- **Dynamic field metadata** — up to 8 createable/updateable fields per object are resolved at
  runtime via the Describe API, so the same form and table components work for every object.
- **Full CRUD** — create, view (read-only), update, and delete records directly from the table.
- **Infinite-scroll pagination** — records load 20 at a time; scrolling near the bottom triggers
  the next page automatically via `IntersectionObserver`.
- **Type-aware form fields** — picklist, boolean, date, datetime, number, email, and phone fields
  each render with the appropriate input control, including live picklist options pulled from
  Salesforce.
- **Server-side sessions** — the Salesforce access/refresh tokens live only in a server-side
  session (backed by Redis in production, in-memory in local development); the browser only ever
  holds a session cookie.

## Architecture

```
┌────────────┐        OAuth 2.0 + PKCE        ┌──────────────┐
│  Browser   │ ─────────────────────────────▶ │  Salesforce  │
│ (React SPA)│ ◀───────────────────────────── │ (login.sfdc) │
└─────┬──────┘        authorization code       └──────────────┘
      │
      │ /api/* (session cookie)
      ▼
┌─────────────┐   REST API (sobjects, describe, query)  ┌──────────────┐
│   Backend   │ ───────────────────────────────────────▶│  Salesforce  │
│ (Express)   │ ◀───────────────────────────────────────│  Data APIs   │
└─────────────┘                                          └──────────────┘
```

- **Frontend:** React + TypeScript + Vite, deployed on Vercel.
- **Backend:** Node.js + Express + TypeScript, deployed on Render.
- **Session:** server-side, cookie-based; the Salesforce access/refresh tokens never reach the
  browser.
- **Salesforce auth:** an External Client App using the Authorization Code flow with PKCE.
- **Data access:** the Salesforce REST API (`/services/data/v59.0`) — `sobjects/{object}/describe`
  for field metadata, SOQL for record queries, and the standard `sobjects` endpoints for
  create/update/delete.

The frontend calls the backend at `/api/*`, which Vercel rewrites (via `vercel.json`) to the
Render backend. This keeps the session cookie same-origin from the browser's point of view, which
is also why the Salesforce Callback URL points at the Vercel domain rather than directly at
Render — the entire OAuth round trip stays on one origin.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Axios |
| Backend | Node.js, Express, TypeScript, express-session |
| Session store | Redis (production) / in-memory (local dev) |
| Salesforce | REST API, Describe API, SOQL, OAuth 2.0 (Authorization Code + PKCE), External Client App |
| Deployment | Vercel (frontend), Render (backend) |

---

## Salesforce setup (External Client App)

1. Sign up for a Developer Edition org at [developer.salesforce.com/signup](https://developer.salesforce.com/signup).
2. Enable **My Domain** (Setup → My Domain) if it isn't already enabled — this is required for
   External Client Apps.
3. Go to **Setup → External Client Apps → New**.
4. Under **App Settings**, enable OAuth and set:
   - **Callback URL:** `https://cloud-crud-webapp.vercel.app/api/auth/callback`
   - **Selected OAuth Scopes:** *Manage user data via APIs* (`api`), *Perform requests at any
     time* (`refresh_token`, `offline_access`)
5. Under **Flow Enablement**, enable **Authorization Code** and **Credentials Flow**.
6. Under **Security**, confirm **Require Proof Key for Code Exchange (PKCE)** is enabled.
7. Save, then copy the **Consumer Key** and **Consumer Secret** into your environment variables.

## Environment variables

**Backend** (`backend/.env` locally, or Render → Environment)

| Variable | Description |
|---|---|
| `SF_CLIENT_ID` | Consumer Key from the Salesforce External Client App |
| `SF_CLIENT_SECRET` | Consumer Secret from the Salesforce External Client App |
| `SF_REDIRECT_URI` | Salesforce OAuth callback URL |
| `SF_AUTHORIZE_URL` | Salesforce OAuth authorization endpoint |
| `SF_TOKEN_URL` | Salesforce OAuth token endpoint |
| `FRONTEND_URL` | Deployed frontend URL |
| `SESSION_SECRET` | Long random secret used to sign server-side sessions |
| `REDIS_URL` | Optional — enables a Redis-backed session store; falls back to in-memory if unset |
| `NODE_ENV` | `production` in deployment |
| `NPM_CONFIG_PRODUCTION` | `false`, required for the Render TypeScript build step |

**Frontend** (`frontend/.env` locally, or Vercel → Environment Variables)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `/api` (proxied to the backend via `vercel.json`) |

## Running locally

**Backend**

```bash
cd backend
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

> The application requires Salesforce OAuth authentication — there is no offline/demo mode.
> Click **Login with Salesforce** and authorize with your own Salesforce account. The app never
> stores or exposes your Salesforce password, and OAuth tokens are never sent to the browser.

---

*Built with ❤️ React · TypeScript · Node.js · Express · the Salesforce REST API.*
