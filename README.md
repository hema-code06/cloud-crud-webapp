# Cloud CRUD
A full-stack Salesforce CRUD web application built with React, TypeScript, Node.js, Express, and the Salesforce REST API for performing CRUD operations on Salesforce standard objects (Account, Opportunity, Lead, Contact, Case) through a custom UI, authenticated via OAuth 2.0 (Authorization Code + PKCE) against a Salesforce External Client App.

- **Live app:** https://cloud-crud-webapp.vercel.app
- **Backend API:** https://cloud-crud-webapp.onrender.com
- **Git repo:** https://github.com/hema-code06/cloud-crud-webapp

---

## What it does

- Log in with a Salesforce account via OAuth 2.0 (no native Salesforce UI involved after login)
- Pick an object from a dropdown: Account, Opportunity, Lead, Contact, or Case
- The app dynamically fetches that object's field metadata (via the Salesforce Describe API) and renders up to 8 relevant createable/updateable fields.
- Create, view, edit, and delete records directly from the UI
- Records load 20 at a time, with the next page fetched automatically as you scroll (infinite scroll via `IntersectionObserver`)

---

## Key Features

- Salesforce OAuth 2.0 authentication with Authorization Code + PKCE
- Server-side session management
- Dynamic Salesforce object metadata using Describe API
- Support for Account, Opportunity, Lead, Contact, and Case
- Create, view, update, and delete records
- Infinite scrolling with 20-record pagination
- Dynamic form generation based on Salesforce field metadata
- Picklist, date, datetime, boolean, number, email, and phone field support
- Protected backend API routes
- REST API integration with Salesforce
- Responsive Salesforce-inspired UI

---

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Axios
- CSS

**Backend**
- Node.js
- Express
- TypeScript
- Express Session

**Salesforce**
- Salesforce REST API
- Describe API
- SOQL
- OAuth 2.0 Authorization Code + PKCE
- Salesforce External Client App

**Deployment**
- Vercel — Frontend
- Render — Backend

---

## Architecture

```
┌────────────┐        OAuth 2.0 + PKCE        ┌──────────────┐
│  Browser   │ ─────────────────────────────▶ │  Salesforce  │
│ (React SPA)│ ◀───────────────────────────── │ (login.sfdc)│
└─────┬──────┘        authorization code       └──────────────┘
      │
      │ /api/* (session cookie)
      ▼
┌─────────────┐   REST API (sobjects, describe, query)  ┌──────────────┐
│   Backend   │ ───────────────────────────────────────▶│  Salesforce  │
│ (Express)   │ ◀───────────────────────────────────────│  Data APIs   │
└─────────────┘                                          └──────────────┘
```

- **Frontend**: React + TypeScript + Vite, deployed on **Vercel**
- **Backend**: Node.js + Express + TypeScript, deployed on **Render**
- **Session**: server-side session (cookie-based), holding the Salesforce access/refresh token — the token never touches the browser directly
- **Salesforce auth**: External Client App using the Authorization Code flow with PKCE
- **Data access**: Salesforce REST API (`/services/data/v59.0`) — `sobjects/{object}/describe` for field metadata, SOQL queries for records, and standard `sobjects` endpoints for create/update/delete

The frontend calls the backend at `/api/*`, which Vercel rewrites (via `vercel.json`) to the Render backend. This keeps the session cookie same-origin from the browser's perspective, which is also why the Salesforce **Callback URL** points at the Vercel domain rather than Render directly — the full OAuth round trip stays on one origin.

---

## Salesforce setup (External Client App)

1. Sign up for a Developer Edition org at [developer.salesforce.com/signup](https://developer.salesforce.com/signup)
2. Enable **My Domain** (Setup → My Domain) if not already enabled — required for External Client Apps
3. Setup → **External Client Apps** → New
4. Under **App Settings**, enable OAuth and set:
   - **Callback URL**: `https://cloud-crud-webapp.vercel.app/api/auth/callback`
   - **Selected OAuth Scopes**: `Manage user data via APIs (api)`, `Perform requests at any time (refresh_token, offline_access)`
5. Under **Flow Enablement**, enable **Authorization Code and Credentials Flow**
6. Under **Security**, confirm **Require Proof Key for Code Exchange (PKCE)** is enabled
7. Save, and copy the **Consumer Key** and **Consumer Secret** for your environment variables

---

## Environment variables

### Backend (`backend/.env` locally, or Render → Environment)

| Variable | Description |
|---|---|
| `SF_CLIENT_ID` | Consumer Key from the Salesforce External Client App |
| `SF_CLIENT_SECRET` | Consumer Secret from the Salesforce External Client App |
| `SF_REDIRECT_URI` | Salesforce OAuth callback URL |
| `SF_AUTHORIZE_URL` | Salesforce OAuth authorization endpoint |
| `SF_TOKEN_URL` | Salesforce OAuth token endpoint |
| `FRONTEND_URL` | Deployed frontend URL |
| `SESSION_SECRET` | Long random secret used to secure server-side sessions |
| `NODE_ENV` | `production` |
| `NPM_CONFIG_PRODUCTION` | `false` for the Render TypeScript build |


### Frontend (`frontend/.env` locally, or Vercel → Environment Variables)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `/api` (proxied to the backend via `vercel.json`) |

---

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

---

> **Demo note:** The application requires Salesforce OAuth authentication.
> Click **Login with Salesforce** and authorize the application using your own Salesforce account.
> The application does not store or expose your Salesforce password or OAuth tokens in the browser.

---

*Built with ❤️ using React · TypeScript · Salesforce REST API · Node.js · Express*
