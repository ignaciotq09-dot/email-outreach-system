import type { Express } from 'express';
import { requireAuth } from '../../auth/middleware';
import { handleSpamCheck } from './spam-routes';
import { handleThrottleStatus, handleScheduleBatch, handleNextSendTime, handleRandomDelay } from './throttle-routes';
import { handleWarmupStatus, handleWarmupSettings, handleWarmupEnabled, handleWarmupStage, handleManualOverride, handleWarmupReset, handleWarmupStages } from './warmup-routes';

export function registerDeliverabilityRoutes(app: Express) {
  app.post('/api/deliverability/spam-check', requireAuth, handleSpamCheck);
  app.get('/api/deliverability/throttle/status', requireAuth, handleThrottleStatus);
  app.post('/api/deliverability/throttle/schedule-batch', requireAuth, handleScheduleBatch);
  app.get('/api/deliverability/throttle/next-send-time', requireAuth, handleNextSendTime);
  app.get('/api/deliverability/throttle/random-delay', requireAuth, handleRandomDelay);
  app.get('/api/deliverability/warmup/status', requireAuth, handleWarmupStatus);
  app.get('/api/deliverability/warmup/settings', requireAuth, handleWarmupSettings);
  app.put('/api/deliverability/warmup/enabled', requireAuth, handleWarmupEnabled);
  app.post('/api/deliverability/warmup/stage', requireAuth, handleWarmupStage);
  app.put('/api/deliverability/warmup/manual-override', requireAuth, handleManualOverride);
  app.post('/api/deliverability/warmup/reset', requireAuth, handleWarmupReset);
  app.get('/api/deliverability/warmup/stages', handleWarmupStages);
}
