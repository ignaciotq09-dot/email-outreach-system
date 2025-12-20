# OAuth Setup Guide

This application uses OAuth authentication with Gmail and Microsoft Outlook. Users authenticate via their email provider, and their OAuth tokens are used for both authentication and email operations.

## Required Environment Variables

### Gmail OAuth
To enable Gmail authentication, you need Google Cloud Platform credentials:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Gmail API and Google People API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://your-replit-url/api/auth/gmail/callback`

Set these environment variables in Replit Secrets:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Outlook OAuth
To enable Outlook/Microsoft authentication:

1. Register an app in [Azure Portal](https://portal.azure.com/) → App registrations
2. Add platform: Web application
3. Add redirect URI: `https://your-replit-url/api/auth/outlook/callback`
4. Create a client secret

Set these environment variables in Replit Secrets:
```
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=common
```

Note: `AZURE_TENANT_ID=common` allows any Microsoft account. Set to your specific tenant ID to restrict to your organization only.

## OAuth Scopes

### Gmail
- `openid` - OpenID Connect authentication
- `userinfo.email` - User email address
- `userinfo.profile` - User profile information
- `gmail.readonly` - Read email messages
- `gmail.send` - Send email messages
- `gmail.modify` - Modify email labels and metadata

### Outlook
- `openid` - OpenID Connect authentication
- `profile` - User profile information
- `email` - User email address
- `offline_access` - Refresh tokens
- `Mail.Read` - Read email messages
- `Mail.ReadWrite` - Read and write email messages
- `Mail.Send` - Send email messages
- `User.Read` - Read user profile

## Architecture Notes

1. **Unified OAuth**: The same OAuth token is used for both user authentication AND email sending
2. **Encrypted Storage**: OAuth tokens are encrypted using AES-256-GCM before storing in database
3. **Token Refresh**: System will automatically refresh expired tokens using refresh tokens
4. **Single-User**: This is a single-user application - each user connects their own email account
5. **Session Management**: PostgreSQL-backed sessions with 30-day lifetime

## Security

- Tokens encrypted at rest using AES-256-GCM
- State tokens for OAuth CSRF protection
- Session cookies with sameSite=lax (required for OAuth redirects)
- Rate limiting on auth endpoints
- HTTPS required in production
