// Custom hooks for inbox tab

import { useState, useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";

/**
 * Displays relative time since last sync
 */
export function SyncedAgo({ time }: { time: Date }) {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const seconds = Math.floor((Date.now() - time.getTime()) / 1000);

    if (seconds < 5) return <span>just now</span>;
    if (seconds < 60) return <span>{seconds}s ago</span>;
    if (seconds < 3600) return <span>{Math.floor(seconds / 60)}m ago</span>;
    return <span>{Math.floor(seconds / 3600)}h ago</span>;
}

/**
 * WebSocket hook for real-time inbox updates
 */
export function useInboxWebSocket(userId: number | undefined) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptRef = useRef(0);
    const maxReconnectAttempts = 10;

    const connect = useCallback(() => {
        if (!userId) return;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/inbox?userId=${userId}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[InboxWS] Connected');
                setIsConnected(true);
                reconnectAttemptRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'NEW_REPLY' || message.type === 'REPLY_UPDATED' || message.type === 'STATS_UPDATED') {
                        console.log(`[InboxWS] Received ${message.type}, refreshing data`);
                        queryClient.invalidateQueries({ queryKey: ['/api/inbox/replies'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/inbox/stats'] });
                    }
                } catch (error) {
                    console.error('[InboxWS] Error parsing message:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('[InboxWS] Disconnected:', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                if (reconnectAttemptRef.current < maxReconnectAttempts) {
                    const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
                    console.log(`[InboxWS] Reconnecting in ${backoffMs}ms (attempt ${reconnectAttemptRef.current + 1})`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptRef.current++;
                        connect();
                    }, backoffMs);
                }
            };

            ws.onerror = (error) => {
                console.error('[InboxWS] Error:', error);
            };
        } catch (error) {
            console.error('[InboxWS] Failed to create WebSocket:', error);
        }
    }, [userId]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !isConnected && userId) {
                console.log('[InboxWS] Tab visible, reconnecting...');
                reconnectAttemptRef.current = 0;
                connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isConnected, userId, connect]);

    return { isConnected, reconnect: connect };
}
