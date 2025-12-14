/**
 * Custom React Hook for Socket.IO Client
 * Handles connection, authentication, and event management
 */

import { useEffect, useRef, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';

interface SocketOptions {
  token: string | null;
  userId: number | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

// Global socket instance (singleton pattern for optimization)
let globalSocket: Socket | null = null;

/**
 * Hook to manage Socket.IO connection with automatic cleanup
 * Implements singleton pattern to prevent multiple connections
 */
export function useSocket({
  token,
  userId,
  onConnect,
  onDisconnect,
  onError,
}: SocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (!token || !userId) {
      // Disconnect if no token
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      return;
    }

    // Use global socket if available and authenticated
    if (
      globalSocket?.connected &&
      (globalSocket?.auth as any)?.token === token
    ) {
      socketRef.current = globalSocket;
      onConnect?.();
      return;
    }

    try {
      // Create new socket connection with authentication
      const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        transports: ['websocket', 'polling'],
      });

      // Connection established
      socket.on('connect', () => {
        reconnectAttempts.current = 0;
        socketRef.current = socket;
        globalSocket = socket;
        onConnect?.();
      });

      // Connection error
      socket.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        reconnectAttempts.current++;

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          onError?.(
            'Failed to establish connection. Please check your internet connection.'
          );
        }
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        if (socketRef.current === globalSocket) {
          globalSocket = null;
        }
        onDisconnect?.();
      });

      // Server-side errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        onError?.(error || 'An error occurred');
      });

      socketRef.current = socket;
      globalSocket = socket;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      onError?.('Failed to initialize connection');
    }

    // Cleanup function
    return () => {
      // Don't disconnect on unmount if socket is still needed
      // The socket will remain connected for other components
    };
  }, [token, userId, onConnect, onDisconnect, onError]);

  // Helper functions for common operations
  const emit = useCallback(
    (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      }
    },
    []
  );

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      // Return unsubscribe function
      return () => {
        socketRef.current?.off(event, callback);
      };
    }
    return () => {};
  };

  const once = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.once(event, callback);
      }
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emit,
    on,
    once,
  };
}

/**
 * Hook for managing chat-specific socket events
 * Provides simplified interface for chat functionality
 */
export function useChatSocket(
  token: string | null,
  userId: number | null,
  receiverId: number | null
) {
  const { socket, isConnected, emit, on } = useSocket({
    token,
    userId,
    onError: (error) => console.error('Chat socket error:', error),
  });

  // Join chat room
  const joinChat = useCallback(() => {
    if (isConnected && receiverId) {
      emit('chat:join', receiverId);
    }
  }, [isConnected, receiverId, emit]);

  // Leave chat room
  const leaveChat = useCallback(() => {
    if (isConnected && receiverId) {
      emit('chat:leave', receiverId);
    }
  }, [isConnected, receiverId, emit]);

  // Send message
  const sendMessage = useCallback(
    (content: string, auctionId?: number) => {
      if (isConnected && receiverId && content.trim()) {
        emit('message:send', {
          receiverId,
          content: content.trim(),
          auctionId,
        });
      }
    },
    [isConnected, receiverId, emit]
  );

  // Send typing indicator
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (isConnected && receiverId) {
        emit(isTyping ? 'typing:start' : 'typing:stop', {
          receiverId,
        });
      }
    },
    [isConnected, receiverId, emit]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (auctionId?: number) => {
      if (isConnected && receiverId) {
        emit('message:read', {
          receiverId,
          auctionId,
        });
      }
    },
    [isConnected, receiverId, emit]
  );

  // Listen to incoming messages
  const onMessageReceived = useCallback(
    (callback: (message: any) => void) => {
      return on('message:new', callback);
    },
    [on]
  );

  // Listen to typing status
  const onTypingStatus = useCallback(
    (callback: (data: any) => void) => {
      const unsubscribeActive = on('typing:active', callback);
      const unsubscribeInactive = on('typing:inactive', callback);

      return () => {
        unsubscribeActive();
        unsubscribeInactive();
      };
    },
    [on]
  );

  // Listen to read receipts
  const onReadReceipt = useCallback(
    (callback: (data: any) => void) => {
      return on('message:read-receipt', callback);
    },
    [on]
  );

  // Listen to user activity
  const onUserActive = useCallback(
    (callback: (data: any) => void) => {
      const unsubscribeActive = on('chat:user-active', callback);
      const unsubscribeInactive = on('chat:user-inactive', callback);

      return () => {
        unsubscribeActive();
        unsubscribeInactive();
      };
    },
    [on]
  );

  // Listen to user status sync (online/offline)
  const onUserStatusSync = useCallback(
    (callback: (data: any) => void) => {
      return on('user:status-sync', callback);
    },
    [on]
  );

  return {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    setTyping,
    markAsRead,
    onMessageReceived,
    onTypingStatus,
    onReadReceipt,
    onUserActive,
    onUserStatusSync,
  };
}
