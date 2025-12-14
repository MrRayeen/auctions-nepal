"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Loader,
  AlertCircle,
  Check,
  CheckCheck,
  Dot,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { useChatSocket } from "@/hooks/useSocket";

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  read: boolean;
  senderName?: string;
}

interface User {
  id: number;
  name?: string;
  email: string;
}

interface Conversation {
  id: number;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface TypingUser {
  userId: number;
  userName: string;
}

export default function ChatClient() {
  const searchParams = useSearchParams();
  // Support both userId and sellerId query parameters for flexibility
  const initialUserId = searchParams.get("userId") || searchParams.get("sellerId")
    ? parseInt(searchParams.get("userId") || searchParams.get("sellerId") || "")
    : null;
  const initialAuctionId = searchParams.get("auctionId")
    ? parseInt(searchParams.get("auctionId") || "")
    : null;
  const { addToast } = useToast();

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [currentAuctionId, setCurrentAuctionId] = useState<number | null>(initialAuctionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authTokenRef = useRef<string>("");

  // Get current user from token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      authTokenRef.current = token;
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.userId);
        setCurrentUserEmail(payload.email);
      } catch (err) {
        console.error("Failed to parse token:", err);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, []);

  // Socket.IO connection
  const {
    isConnected,
    sendMessage: socketSendMessage,
    joinChat,
    leaveChat,
    setTyping,
    markAsRead,
    onMessageReceived,
    onTypingStatus,
    onReadReceipt,
    onUserActive,
    onUserStatusSync,
  } = useChatSocket(authTokenRef.current, currentUserId, selectedConversation?.user.id || null);

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? "connected" : "disconnected");
  }, [isConnected]);

  // Listen for incoming messages
  useEffect(() => {
    const unsubscribe = onMessageReceived((message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return unsubscribe;
  }, [onMessageReceived]);

  // Listen for typing indicators
  useEffect(() => {
    const unsubscribe = onTypingStatus((data: any) => {
      if ("userId" in data && "userName" in data) {
        // Typing active
        setTypingUsers((prev) => {
          const exists = prev.some((u) => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, userName: data.userName }];
        });
      } else if ("userId" in data) {
        // Typing inactive
        setTypingUsers((prev) =>
          prev.filter((u) => u.userId !== data.userId)
        );
      }
    });

    return unsubscribe;
  }, [onTypingStatus]);

  // Listen for online/offline status
  useEffect(() => {
    const unsubscribe = onUserStatusSync((data: any) => {
      if ("userId" in data && "isOnline" in data) {
        if (data.isOnline) {
          // User is online
          setOnlineUsers((prev) => new Set([...prev, data.userId]));
        } else {
          // User is offline
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(data.userId);
            return updated;
          });
        }
      }
    });

    return unsubscribe;
  }, [onUserStatusSync]);

  // Listen for read receipts
  useEffect(() => {
    const unsubscribe = onReadReceipt((data: any) => {
      // Mark messages as read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId === data.readBy ? { ...msg, read: true } : msg
        )
      );
    });

    return unsubscribe;
  }, [onReadReceipt]);

  // Fetch conversations on login
  useEffect(() => {
    if (!currentUserId) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const res = await fetch(`/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = await res.json();
        setConversations(data);

        // Handle initial user selection
        if (initialUserId) {
          const conversation = data.find(
            (conv: Conversation) => conv.user.id === initialUserId
          );
          if (conversation) {
            setSelectedConversation(conversation);
          } else {
            try {
              const userRes = await fetch(`/api/users/${initialUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                setSelectedConversation({
                  id: initialUserId,
                  user: userData.user,
                  lastMessage: "",
                  timestamp: "now",
                  unread: 0,
                });
              }
            } catch (err) {
              console.error("Error fetching user:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        addToast("Failed to load conversations", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserId, initialUserId, addToast]);

  // Fetch messages for selected conversation via REST (initial load)
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(
          `/api/chat?userId=${selectedConversation.user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await res.json();
        setMessages(data);

        // Mark messages as read via Socket.IO
        markAsRead();
      } catch (err) {
        console.error("Error fetching messages:", err);
        addToast("Failed to load messages", "error");
      }
    };

    // Join socket.io chat room
    joinChat();
    fetchMessages();

    return () => {
      leaveChat();
    };
  }, [selectedConversation, currentUserId, joinChat, leaveChat, markAsRead, addToast, isConnected]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !selectedConversation || !currentUserId) return;

    try {
      setSendingMessage(true);
      setTyping(false); // Stop typing indicator

      const content = messageText.trim();
      
      // Send via Socket.IO with auctionId if available
      socketSendMessage(content, currentAuctionId || undefined);

      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      addToast("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  }, [messageText, selectedConversation, currentUserId, currentAuctionId, socketSendMessage, setTyping, addToast]);

  // Handle typing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessageText(e.target.value);

      // Send typing indicator
      if (e.target.value.length > 0) {
        setTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      }
    },
    [setTyping]
  );

  // Key press handler
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    (conv.user.name || conv.user.email || "Unknown")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getDisplayName = (user: User) =>
    user.name || user.email?.split("@")[0] || "Unknown";
  const getInitial = (user: User) =>
    (getDisplayName(user)[0] || "U").toUpperCase();

  const isUserOnline = selectedConversation
    ? onlineUsers.has(selectedConversation.user.id)
    : false;

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-nepal-900">
        <Loader className="animate-spin text-nepal-accent" size={40} />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="h-screen flex items-center justify-center bg-nepal-900 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 mx-auto flex items-center justify-center">
            <Send size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Start Chatting
            </h1>
            <p className="text-gray-400 mb-6">
              Sign in to message with sellers and other bidders
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/login">
                <button className="glass-button px-8 py-3 rounded-full font-bold">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white font-bold">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col pt-16 bg-nepal-900 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-nepal-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Connection Status Bar */}
      {connectionStatus !== "connected" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 text-sm flex items-center gap-2"
        >
          <Loader size={14} className="animate-spin" />
          {connectionStatus === "connecting"
            ? "Connecting to chat..."
            : "Connection lost. Reconnecting..."}
        </motion.div>
      )}

      <div className="flex h-full relative z-10">
        {/* Conversations List */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-nepal-900/80 backdrop-blur">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white mb-4">Messages</h1>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent transition-colors"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No conversations
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.user.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors text-left relative ${
                      selectedConversation?.user.id === conv.user.id
                        ? "bg-white/10 border-l-2 border-l-nepal-accent"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center text-white font-bold">
                          {getInitial(conv.user)}
                        </div>
                        {onlineUsers.has(conv.user.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-nepal-900" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold text-white truncate">
                            {getDisplayName(conv.user)}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {conv.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {conv.unread > 0 && (
                        <div className="shrink-0 w-5 h-5 rounded-full bg-nepal-accent text-white text-xs flex items-center justify-center font-bold">
                          {Math.min(conv.unread, 9)}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-linear-to-b from-nepal-900/50 to-nepal-900/80 backdrop-blur">
            {/* Chat Header */}
            <div className="border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center text-white font-bold">
                    {getInitial(selectedConversation.user)}
                  </div>
                  {isUserOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-nepal-900" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    {getDisplayName(selectedConversation.user)}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {isUserOnline ? (
                      <span className="flex items-center gap-1">
                        <Dot size={8} className="fill-green-500 text-green-500" />
                        Active now
                      </span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Phone size={18} className="text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Video size={18} className="text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreVertical size={18} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.senderId === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === currentUserId
                            ? "bg-nepal-accent text-white rounded-br-none"
                            : "bg-white/10 text-gray-100 rounded-bl-none"
                        }`}
                      >
                        <p className="wrap-break-word text-sm">{message.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(message.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </span>
                          {message.senderId === currentUserId && (
                            <>
                              {message.read ? (
                                <CheckCheck size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {typingUsers.map((user) => (
                      <motion.div
                        key={user.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/10 text-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={sendingMessage || !isConnected}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-nepal-accent transition-colors disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage || !isConnected}
                  className="glass-button px-6 py-2 rounded-lg flex items-center gap-2 font-bold disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </motion.button>
              </div>
              {!isConnected && (
                <p className="text-xs text-yellow-400 mt-2">
                  Reconnecting to chat service...
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Send size={48} className="text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white">
                Select a conversation
              </h2>
              <p className="text-gray-400">
                Choose a chat to start messaging
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
