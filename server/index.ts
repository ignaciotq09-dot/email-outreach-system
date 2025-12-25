import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite-fixed";
import { monitoringService } from "./monitoring-service";
import { jobScheduler } from "./scheduler";
import { SequenceAutomationService } from "./sequence-automation";
import { followUpEngine } from "./services/follow-up-engine";
import { replyDetectionEngine } from "./services/reply-detection-engine";
import { EmailTrackingService } from "./services/email-tracking";
import { startAutoReplyScheduler, stopAutoReplyScheduler } from "./services/auto-reply-scheduler";
import { LinkedInJobProcessor } from "./services/linkedin-job-processor";
import { startEmailArchivalScheduler, stopEmailArchivalScheduler } from "./services/email-archival-scheduler";
// Disabled: Replit Gmail routes conflict with custom OAuth connector
// import replitGmailRoutes from "./routes/replit-gmail";

const app = express();

// Trust proxy headers (required for Replit environment and rate limiting)
app.set('trust proxy', true);

// Enable gzip/brotli compression for faster asset delivery
app.use(compression({
  // Compress all responses
  threshold: 0,
  // Use maximum compression level for production
  level: process.env.NODE_ENV === 'production' ? 9 : 6
}));

// Add caching headers for better performance
app.use((req, res, next) => {
  // Skip caching for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return next();
  }

  // Cache static assets with hashed names (Vite generates these)
  if (req.path.match(/\.[a-f0-9]{8}\./)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache images for a day
  else if (req.path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  // Cache fonts forever
  else if (req.path.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  // Don't cache HTML
  else if (req.path === '/' || req.path.match(/\.html$/)) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }

  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Disabled: Replit Gmail routes conflict with custom OAuth connector
  // app.use(replitGmailRoutes);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);

    // Validate email tracking configuration on startup
    EmailTrackingService.validateOnStartup();

    // DISABLED: Email monitoring service requires gmail.readonly scope
    // The current Replit Gmail connector only has add-on and send scopes
    // monitoringService.start();
    // log('[Monitor] Email monitoring service started');

    // Start the job scheduler (checks every minute)
    jobScheduler.start();
    log('[Scheduler] Job scheduler started');

    // Start the sequence automation worker (checks every minute)
    SequenceAutomationService.start();
    log('[SequenceAutomation] Sequence automation service started');

    // Start the bulletproof follow-up engine (new persistent job queue system)
    // Always enabled - stops follow-ups automatically when contact replies
    (async () => {
      try {
        await followUpEngine.start();
        log('[FollowUpEngine] Bulletproof follow-up engine started');
      } catch (error: any) {
        console.error('[FollowUpEngine] Failed to start:', error?.message);
        log('[FollowUpEngine] Running in degraded mode - check database schema');
      }
    })();

    // Start the bulletproof reply detection engine (new persistent job queue system)
    // Note: Will be started when user connects an email provider
    log('[ReplyDetectionEngine] Reply detection engine ready (starts on provider connection)');

    // Start the bulletproof auto-reply scheduler (checks every 10-12 minutes)
    startAutoReplyScheduler();
    log('[AutoReplyScheduler] Bulletproof auto-reply scheduler started');

    // Start the bulletproof LinkedIn job processor (processes queue via Phantombuster)
    LinkedInJobProcessor.start();
    log('[LinkedInJobProcessor] Bulletproof LinkedIn job processor started');

    // Start the email archival scheduler (runs daily at 2 AM)
    startEmailArchivalScheduler();
    log('[EmailArchivalScheduler] Email archival scheduler started');
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('[Monitor] Stopping email monitoring service');
    monitoringService.stop();
    log('[Scheduler] Stopping job scheduler');
    jobScheduler.stop();
    log('[SequenceAutomation] Stopping sequence automation service');
    SequenceAutomationService.stop();
    log('[FollowUpEngine] Stopping bulletproof follow-up engine');
    followUpEngine.stop();
    log('[ReplyDetectionEngine] Stopping reply detection engine');
    replyDetectionEngine.stop();
    log('[AutoReplyScheduler] Stopping auto-reply scheduler');
    stopAutoReplyScheduler();
    log('[LinkedInJobProcessor] Stopping LinkedIn job processor');
    LinkedInJobProcessor.stop();
    log('[EmailArchivalScheduler] Stopping email archival scheduler');
    stopEmailArchivalScheduler();
  });
})();
