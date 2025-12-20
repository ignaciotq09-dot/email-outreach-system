import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import { emailQueue } from './email-queue';

export function setupEmailWebSocket(httpServer: Server) {
  // Create WebSocket server WITHOUT auto-attaching to HTTP server
  const wss = new WebSocketServer({ 
    noServer: true  // Important: don't auto-handle upgrade events
  });

  const clients = new Set<WebSocket>();

  // Broadcast stats to all connected clients
  const broadcastStats = () => {
    const stats = emailQueue.getStats();
    const message = JSON.stringify({
      type: 'stats',
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Set up email queue event listeners
  emailQueue.on('batch-added', (data) => {
    const message = JSON.stringify({
      type: 'batch-added',
      data
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    broadcastStats();
  });

  emailQueue.on('email-sent', (data) => {
    const message = JSON.stringify({
      type: 'email-sent',
      data
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    broadcastStats();
  });

  emailQueue.on('email-failed', (data) => {
    const message = JSON.stringify({
      type: 'email-failed',
      data
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    broadcastStats();
  });

  emailQueue.on('queue-cleared', () => {
    const message = JSON.stringify({
      type: 'queue-cleared'
    });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    broadcastStats();
  });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    clients.add(ws);

    // Send initial stats
    const stats = emailQueue.getStats();
    ws.send(JSON.stringify({
      type: 'connected',
      data: {
        message: 'Connected to email progress updates',
        stats
      }
    }));

    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'get-stats') {
          broadcastStats();
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast stats every 5 seconds to keep clients updated
  setInterval(broadcastStats, 5000);

  // Manually handle upgrade requests - ONLY for our specific path
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = parse(request.url || '').pathname;
    
    // Only handle /ws/email-progress, let everything else pass through (like Vite HMR)
    if (pathname === '/ws/email-progress') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Important: Let other WebSocket handlers (like Vite) handle their paths
      // Don't destroy the socket - just let it pass through
      return;
    }
  });

  console.log('[WebSocket] Email progress WebSocket server initialized on /ws/email-progress');
}