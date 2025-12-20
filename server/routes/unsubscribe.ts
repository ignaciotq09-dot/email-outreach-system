/**
 * Unsubscribe Routes
 * Manage email unsubscribe requests and preferences
 * Multi-tenant: All unsubscribe lists are scoped per user
 */

import type { Express } from 'express';
import { db } from '../db';
import { unsubscribes } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth/middleware';

export function registerUnsubscribeRoutes(app: Express) {
  /**
   * POST /api/unsubscribe
   * Add an email to unsubscribe list
   * Supports both JSON (UI) and form-urlencoded (Gmail one-click)
   * Multi-tenant: userId is required (from session or query param for email links)
   */
  app.post('/api/unsubscribe', async (req: any, res) => {
    try {
      // Support Gmail one-click unsubscribe (form data) and JSON (UI)
      let email = req.body.email;
      let reason = req.body.reason;
      
      // Gmail one-click sends form-urlencoded with "List-Unsubscribe=One-Click"
      // Email comes from query param or Referrer header
      if (!email && req.query.email) {
        email = req.query.email as string;
      }
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      // Multi-tenant: Get userId from session (for UI calls) or query param (for email links)
      const userId = req.session?.userId || (req.query.uid ? parseInt(req.query.uid as string) : null);
      
      if (!userId) {
        return res.status(400).json({ 
          error: 'User context required for unsubscribe' 
        });
      }
      
      // Check if already unsubscribed for this user
      const existing = await db
        .select()
        .from(unsubscribes)
        .where(and(
          eq(unsubscribes.email, email.toLowerCase()),
          eq(unsubscribes.userId, userId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        // Update if inactive, otherwise return existing
        if (!existing[0].active) {
          await db
            .update(unsubscribes)
            .set({ 
              active: true, 
              reason,
              unsubscribedAt: new Date()
            })
            .where(and(
              eq(unsubscribes.email, email.toLowerCase()),
              eq(unsubscribes.userId, userId)
            ));
        }
        
        return res.json({ 
          success: true,
          message: 'Email successfully unsubscribed'
        });
      }
      
      // Add new unsubscribe with userId
      await db.insert(unsubscribes).values({
        userId,
        email: email.toLowerCase(),
        reason,
      });
      
      console.log(`[Unsubscribe] Added: ${email} for user ${userId}`);
      
      res.json({ 
        success: true,
        message: 'Email successfully unsubscribed'
      });
    } catch (error) {
      console.error('[Unsubscribe] Error adding:', error);
      res.status(500).json({ 
        error: 'Failed to process unsubscribe request' 
      });
    }
  });

  /**
   * GET /api/unsubscribe/check/:email
   * Check if an email is unsubscribed for the current user
   * Multi-tenant: filtered by userId
   */
  app.get('/api/unsubscribe/check/:email', requireAuth, async (req: any, res) => {
    try {
      const { email } = req.params;
      const userId = req.session.userId;
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }
      
      const result = await db
        .select()
        .from(unsubscribes)
        .where(and(
          eq(unsubscribes.email, email.toLowerCase()),
          eq(unsubscribes.userId, userId)
        ))
        .limit(1);
      
      const isUnsubscribed = result.length > 0 && result[0].active;
      
      res.json({ 
        isUnsubscribed,
        email: email.toLowerCase()
      });
    } catch (error) {
      console.error('[Unsubscribe] Check error:', error);
      res.status(500).json({ 
        error: 'Failed to check unsubscribe status' 
      });
    }
  });

  /**
   * GET /api/unsubscribe/list
   * Get all unsubscribed emails for the current user
   * Multi-tenant: filtered by userId
   */
  app.get('/api/unsubscribe/list', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      const result = await db
        .select()
        .from(unsubscribes)
        .where(and(
          eq(unsubscribes.active, true),
          eq(unsubscribes.userId, userId)
        ))
        .orderBy(unsubscribes.unsubscribedAt);
      
      res.json(result);
    } catch (error) {
      console.error('[Unsubscribe] List error:', error);
      res.status(500).json({ 
        error: 'Failed to get unsubscribe list' 
      });
    }
  });

  /**
   * DELETE /api/unsubscribe/:email
   * Remove email from unsubscribe list (resubscribe)
   * Multi-tenant: filtered by userId
   */
  app.delete('/api/unsubscribe/:email', requireAuth, async (req: any, res) => {
    try {
      const { email } = req.params;
      const userId = req.session.userId;
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }
      
      await db
        .update(unsubscribes)
        .set({ active: false })
        .where(and(
          eq(unsubscribes.email, email.toLowerCase()),
          eq(unsubscribes.userId, userId)
        ));
      
      console.log(`[Unsubscribe] Resubscribed: ${email} for user ${userId}`);
      
      res.json({ 
        success: true,
        message: 'Email successfully resubscribed'
      });
    } catch (error) {
      console.error('[Unsubscribe] Delete error:', error);
      res.status(500).json({ 
        error: 'Failed to remove from unsubscribe list' 
      });
    }
  });

  /**
   * GET /unsubscribe (public page)
   * Public unsubscribe confirmation page with XSS protection
   */
  app.get('/unsubscribe', (req, res) => {
    const rawEmail = req.query.email as string;
    
    // Sanitize email to prevent XSS
    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    const safeEmail = rawEmail ? escapeHtml(rawEmail) : '';
    
    // Also escape for JSON to prevent script injection
    const jsonSafeEmail = rawEmail ? JSON.stringify(rawEmail) : '""';
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribe</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          button {
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background: #b91c1c;
          }
          .success {
            color: #16a34a;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Unsubscribe from Emails</h1>
        ${safeEmail ? `
          <p>Email: <strong>${safeEmail}</strong></p>
          <button onclick="unsubscribe()">Confirm Unsubscribe</button>
          <div id="message"></div>
          <script>
            const EMAIL_TO_UNSUBSCRIBE = ${jsonSafeEmail};
            async function unsubscribe() {
              try {
                const response = await fetch('/api/unsubscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: EMAIL_TO_UNSUBSCRIBE })
                });
                const data = await response.json();
                const messageEl = document.getElementById('message');
                if (messageEl) {
                  messageEl.textContent = data.message || 'Success';
                  messageEl.className = 'success';
                }
              } catch (error) {
                const messageEl = document.getElementById('message');
                if (messageEl) {
                  messageEl.textContent = 'Error: ' + (error instanceof Error ? error.message : 'Unknown error');
                  messageEl.style.color = 'red';
                }
              }
            }
          </script>
        ` : `
          <p>Please provide an email address in the URL.</p>
          <p>Example: /unsubscribe?email=your@email.com</p>
        `}
      </body>
      </html>
    `);
  });
}
