export class RateLimiter { private lastSendTime = 0; private sendCount = 0; private sendWindow = 60000; private readonly RATE_LIMIT = 150;
  canSend(): boolean { const now = Date.now(); if (now - this.lastSendTime > this.sendWindow) { this.lastSendTime = now; this.sendCount = 0; } return this.sendCount < this.RATE_LIMIT; }
  incrementSendCount() { this.sendCount++; }
  resetSendCount() { this.sendCount = 0; }
}
