import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface InboxClient {
  ws: WebSocket;
  userId: number;
}

const clients = new Map<number, Set<WebSocket>>();
let wss: WebSocketServer | null = null;

export type InboxMessageType = 'NEW_REPLY' | 'REPLY_UPDATED' | 'STATS_UPDATED' | 'CONNECTED';

export interface InboxMessage {
  type: InboxMessageType;
  data?: any;
  timestamp: string;
}

export function broadcastToUser(userId: number, message: Omit<InboxMessage, 'timestamp'>) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    return;
  }

  const fullMessage = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString()
  });

  userClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(fullMessage);
    }
  });

  console.log(`[InboxWS] Broadcast to user ${userId}: ${message.type} (${userClients.size} clients)`);
}

export function broadcastNewReply(userId: number, reply: any) {
  broadcastToUser(userId, {
    type: 'NEW_REPLY',
    data: reply
  });
}

export function broadcastStatsUpdate(userId: number, stats: any) {
  broadcastToUser(userId, {
    type: 'STATS_UPDATED',
    data: stats
  });
}

export function broadcastReplyUpdated(userId: number, replyId: number, changes: any) {
  broadcastToUser(userId, {
    type: 'REPLY_UPDATED',
    data: { replyId, changes }
  });
}

export function getConnectedUserCount(): number {
  return clients.size;
}

export function getClientCountForUser(userId: number): number {
  return clients.get(userId)?.size || 0;
}

export function setupInboxWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ 
    noServer: true
  });

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userIdParam = url.searchParams.get('userId');
    
    if (!userIdParam) {
      console.log('[InboxWS] Connection rejected: no userId');
      ws.close(4001, 'userId required');
      return;
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      console.log('[InboxWS] Connection rejected: invalid userId');
      ws.close(4002, 'Invalid userId');
      return;
    }

    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);

    console.log(`[InboxWS] User ${userId} connected (${clients.get(userId)!.size} connections)`);

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      data: { message: 'Connected to inbox real-time updates' },
      timestamp: new Date().toISOString()
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('[InboxWS] Error processing message:', error);
      }
    });

    ws.on('close', () => {
      const userSockets = clients.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`[InboxWS] User ${userId} disconnected (${clients.get(userId)?.size || 0} connections remaining)`);
    });

    ws.on('error', (error) => {
      console.error(`[InboxWS] WebSocket error for user ${userId}:`, error);
      const userSockets = clients.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          clients.delete(userId);
        }
      }
    });
  });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = parse(request.url || '').pathname;
    
    if (pathname === '/ws/inbox') {
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit('connection', ws, request);
      });
    }
  });

  console.log('[InboxWS] Inbox real-time WebSocket server initialized on /ws/inbox');
}
