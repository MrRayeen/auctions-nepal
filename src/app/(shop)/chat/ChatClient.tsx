"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Search, MoreVertical, Phone, Video, Loader, AlertCircle, Check, CheckCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  read: boolean;
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

export default function ChatClient() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId") ? parseInt(searchParams.get("userId")!) : null;
  const { addToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.userId);
      } catch (err) {
        console.error("Failed to parse token:", err);
      }
    } else {
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, []);

  // Fetch conversations
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

        // If initialUserId is provided, find and select that conversation
        if (initialUserId) {
          const conversation = data.find((conv: Conversation) => conv.user.id === initialUserId);
          if (conversation) {
            setSelectedConversation(conversation);
          } else {
            // Create a new conversation with this user - fetch user data first
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
              } else {
                // Fallback if user fetch fails
                setSelectedConversation({
                  id: initialUserId,
                  user: { id: initialUserId, email: "", name: "" },
                  lastMessage: "",
                  timestamp: "now",
                  unread: 0,
                });
              }
            } catch (err) {
              console.error("Error fetching seller user data:", err);
              setSelectedConversation({
                id: initialUserId,
                user: { id: initialUserId, email: "", name: "" },
                lastMessage: "",
                timestamp: "now",
                unread: 0,
              });
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
  }, [currentUserId, initialUserId]);

  // Fetch messages for selected conversation
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

        // Mark messages as read
        await fetch(`/api/chat`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: selectedConversation.user.id }),
        });
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();

    // Only poll if the tab is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(pollInterval);
      } else {
        fetchMessages();
        pollInterval = setInterval(fetchMessages, 10000); // 10 seconds
      }
    };

    // Set up polling with 10 second interval
    let pollInterval = setInterval(fetchMessages, 10000);
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedConversation, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUserId) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem("authToken");

      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: selectedConversation.user.id,
          content: messageText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setMessageText("");
      setIsTyping(false);
    } catch (err) {
      console.error("Error sending message:", err);
      addToast("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    // Could add typing indicator API call here if needed
  };

  const filteredConversations = conversations.filter((conv) =>
    (conv.user.name || conv.user.email || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayName = (user: User) => user.name || user.email?.split("@")[0] || "Unknown";
  const getInitial = (user: User) => (getDisplayName(user)[0] || "U").toUpperCase();

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-nepal-900">
        <Loader className="animate-spin text-nepal-accent" size={40} />
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col pt-16 bg-nepal-900 relative overflow-hidden">
      {/* Show login prompt if not logged in */}
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 mx-auto flex items-center justify-center">
              <Send size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Start Chatting</h1>
              <p className="text-gray-400 mb-6">Sign in to message with sellers and other bidders</p>
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
        </div>
      ) : (
        <>
          {/* Background Blobs */}
          <div className="fixed top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="flex h-full relative z-10">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-nepal-900/80 backdrop-blur">
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <h1 className="text-2xl font-bold text-white mb-4">Messages</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg glass-panel bg-white/5 border-white/20 text-white placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <motion.div
                      key={conv.user.id}
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                        selectedConversation?.user.id === conv.user.id ? "bg-white/10 border-l-2 border-l-nepal-accent" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitial(conv.user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-white truncate">{getDisplayName(conv.user)}</h3>
                            <span className="text-xs text-gray-400 ml-2 shrink-0">{conv.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{conv.lastMessage || "No messages yet"}</p>
                        </div>
                        {conv.unread > 0 && (
                          <div className="w-5 h-5 rounded-full bg-nepal-accent text-black text-xs flex items-center justify-center font-bold shrink-0">
                            {conv.unread}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No conversations yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area - Mobile Responsive */}
            {selectedConversation ? (
              <div className="flex flex-1 flex-col w-full md:w-auto">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-nepal-900/80 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-nepal-accent to-purple-500 flex items-center justify-center font-bold text-sm">
                      {getInitial(selectedConversation.user)}
                    </div>
                    <div>
                      <h2 className="font-bold text-white">{getDisplayName(selectedConversation.user)}</h2>
                      <p className="text-xs text-gray-400">Active now</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20">
                      <Phone size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20">
                      <Video size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-nepal-900/40">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex flex-col ${msg.senderId === currentUserId ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl ${
                              msg.senderId === currentUserId
                                ? "bg-nepal-accent text-white"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <p className="text-xs text-gray-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {msg.senderId === currentUserId && (
                              <div className="ml-1">
                                {msg.read ? (
                                  <CheckCheck size={12} className="text-nepal-accent" />
                                ) : (
                                  <Check size={12} className="text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="bg-white/10 px-4 py-2 rounded-2xl">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10 bg-nepal-900/80 backdrop-blur">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-full glass-panel bg-white/5 border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nepal-accent"
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                      className="glass-button w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
                <div className="text-center">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
