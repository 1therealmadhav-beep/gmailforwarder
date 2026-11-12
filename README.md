# Gmail Forwarder

A powerful email forwarding application that automatically forwards Gmail emails based on custom rules. Features admin and user panels with Firebase Realtime Database, deployed on Vercel.

## Features

- **User Panel**: Connect Gmail, create forwarding rules, view email history, manage settings
- **Admin Panel**: Manage users, view audit logs, configure system settings, monitor statistics
- **Flexible Forwarding Rules**: Filter by sender, domain, subject keywords, Gmail labels
- **Dual Forwarding Methods**: 
  - Gmail API (uses connected Gmail account)
  - Custom SMTP via Nodemailer (SendGrid, Mailgun, own server, etc.)
- **Real-time Processing**: Cron jobs process emails every 5 minutes
- **Secure**: OAuth 2.0, encrypted token storage, minimal scopes
- **Audit Logs**: Complete activity tracking for compliance

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS
- **Backend**: Vercel Functions (Node.js)
- **Database**: Firebase Realtime Database
- **Authentication**: Google OAuth 2.0
- **Email**: Gmail API + Nodemailer (SMTP)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Realtime Database
- Google Cloud project with Gmail API enabled
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo>
cd gmailforwarder
npm install --legacy-peer-deps
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Realtime Database
3. Create a web app to get client config
4. Generate a service account key for admin SDK
5. Set database rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "auditLogs": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://your-domain.com/api/gmail/callback`
5. Add required scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

### 5. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

Vercel will automatically configure the cron job from `vercel.ts`.

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Google OAuth
│   │   ├── gmail/             # Gmail connection/callback
│   │   ├── forwarding-rules/  # CRUD for forwarding rules
│   │   ├── emails/            # Email history
│   │   ├── user/              # User profile & settings
│   │   ├── admin/             # Admin endpoints
│   │   ├── test-smtp/         # SMTP connection test
│   │   └── cron/              # Scheduled email processing
│   ├── admin/                 # Admin panel pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── users/             # User management
│   │   ├── audit-logs/        # Activity logs
│   │   └── settings/          # System configuration
│   ├── user/                  # User panel pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── gmail/             # Gmail connection
│   │   ├── rules/             # Forwarding rules
│   │   ├── emails/            # Email history
│   │   └── settings/          # User preferences
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── firebase.ts            # Firebase client config
│   ├── firebase-admin.ts      # Firebase admin config
│   ├── google-auth.ts         # Google OAuth helpers
│   ├── gmail.ts               # Gmail API service
│   ├── nodemailer.ts          # SMTP email service
│   ├── database.ts            # Database operations
│   ├── email-processor.ts     # Email forwarding logic
│   └── utils.ts               # Utility functions
├── types/
│   └── index.ts               # TypeScript types
└── vercel.ts                  # Vercel configuration
```

## Forwarding Rules

Users can create rules with the following filters:

- **From Email**: Exact email or domain (e.g., `@company.com`)
- **Subject Filter**: Keywords in subject line
- **Label Filter**: Gmail labels (INBOX, IMPORTANT, CATEGORY_*)
- **Forward As Attachment**: Send original email as `.eml` attachment

### Forward Methods

1. **Gmail API** (Default): Uses user's connected Gmail account
2. **Custom SMTP**: Configure any SMTP server:
   - Gmail (requires App Password)
   - Outlook/Hotmail
   - Yahoo
   - Zoho
   - SendGrid, Mailgun, Amazon SES
   - Custom SMTP server

## Admin Features

- **Dashboard**: System statistics, recent users, health metrics
- **User Management**: View all users, change roles, delete accounts
- **Audit Logs**: Filterable activity log with details
- **Settings**: Configure app limits, Firebase, Google OAuth, cron schedule

## Security

- All API routes validate user authentication
- Admin routes check for admin role
- OAuth tokens encrypted in database
- Minimal required Google scopes
- Rate limiting on email forwarding
- Cron endpoint protected by secret token

## Cron Job

The email processor runs every 5 minutes via Vercel Cron:
- Fetches unforwarded emails for all users
- Matches against forwarding rules
- Sends via Gmail API or custom SMTP
- Logs all activity to audit logs

Schedule can be customized in Admin Settings.

## License

MIT