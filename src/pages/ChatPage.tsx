import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Plus, ChevronLeft, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import shellyHappy from "@/assets/shelly-happy.png";
import { useToast } from "@/hooks/use-toast";
import { ShellyStreamError, streamShellyResponse } from "@/lib/shelly-stream";
import { detectLanguage, type DetectedLanguage } from "@/lib/detect-language";

type Msg = { role: "user" | "assistant"; content: string };

type Session = {
  id: string;
  label: string;
  messages: Msg[];
  createdAt: number;
};

const STORAGE_KEY = "shelly-sessions";
const MEMORY_KEY = "shelly-memory";
const MAX_MESSAGES_PER_SESSION = 50;
const MAX_SESSIONS = 20;
const MEMORY_SUMMARY_LINES = 10;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const loadSessions = (): Session[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions: Session[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-MAX_SESSIONS)));
  } catch {}
};

const loadMemory = (): string => {
  try {
    return localStorage.getItem(MEMORY_KEY) || "";
  } catch {
    return "";
  }
};

const saveMemory = (memory: string) => {
  try {
    localStorage.setItem(MEMORY_KEY, memory);
  } catch {}
};

/** Build a brief memory summary from all past sessions (excluding current) */
const buildMemoryFromSessions = (sessions: Session[], currentId: string): string => {
  const pastSessions = sessions.filter((s) => s.id !== currentId && s.messages.length > 0);
  if (!pastSessions.length) return "";

  const snippets: string[] = [];
  // Take last few sessions, grab key user messages
  for (const session of pastSessions.slice(-5)) {
    const userMsgs = session.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content.slice(0, 200));
    const assistantSummary = session.messages
      .filter((m) => m.role === "assistant")
      .slice(-1)
      .map((m) => m.content.slice(0, 300));

    if (userMsgs.length) {
      snippets.push(
        `Session (${new Date(session.createdAt).toLocaleDateString()}): User discussed: ${userMsgs.slice(-3).join("; ")}${assistantSummary.length ? `. Your last response touched on: ${assistantSummary[0]}` : ""}`
      );
    }
  }

  return snippets.slice(-MEMORY_SUMMARY_LINES).join("\n");
};

const getSessionLabel = (messages: Msg[]): string => {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  return firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? "…" : "");
};

const ChatPage = () => {
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded[loaded.length - 1].id : "";
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [detectedLang, setDetectedLang] = useState<DetectedLanguage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Health check the chat API on mount
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!apiBaseUrl || !publishableKey) {
      setApiStatus("offline");
      return;
    }
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/functions/v1/panda-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
      signal: controller.signal,
    })
      .then((res) => {
        if (res.ok || res.status === 429 || res.status === 402) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
          toast({
            variant: "destructive",
            title: "Chat service unavailable",
            description: `Shelly's API responded with status ${res.status}.`,
          });
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setApiStatus("offline");
        toast({
          variant: "destructive",
          title: "Chat service unreachable",
          description: "Could not connect to Shelly. Please check your connection.",
        });
      });
    return () => controller.abort();
  }, [toast]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

  // Auto-create first session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      const newSession: Session = {
        id: generateId(),
        label: "New conversation",
        messages: [],
        createdAt: Date.now(),
      };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    }
  }, [sessions.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Re-detect language whenever the latest user message changes
  useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    setDetectedLang(lastUser ? detectLanguage(lastUser.content) : null);
  }, [messages]);

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const updateSessionMessages = useCallback(
    (updater: (prev: Msg[]) => Msg[]) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const updated = updater(s.messages);
          return { ...s, messages: updated, label: getSessionLabel(updated) };
        })
      );
    },
    [activeSessionId]
  );

  const createNewSession = () => {
    // Save memory from current sessions before creating new
    const memory = buildMemoryFromSessions(sessions, "");
    if (memory) saveMemory(memory);

    const newSession: Session = {
      id: generateId(),
      label: "New conversation",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setShowSidebar(false);
  };

  const switchSession = (id: string) => {
    setActiveSessionId(id);
    setShowSidebar(false);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: Session = {
          id: generateId(),
          label: "New conversation",
          messages: [],
          createdAt: Date.now(),
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) {
        setActiveSessionId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };

    updateSessionMessages((prev) => [...prev, userMsg].slice(-MAX_MESSAGES_PER_SESSION));
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    // Build memory context for cross-session continuity
    const memoryContext = buildMemoryFromSessions(sessions, activeSessionId);
    const savedMemory = loadMemory();
    const combinedMemory = [savedMemory, memoryContext].filter(Boolean).join("\n");

    // Prepare messages with memory prefix
    const currentMessages = [...messages, userMsg].slice(-MAX_MESSAGES_PER_SESSION);
    const messagesWithMemory: Msg[] = combinedMemory
      ? [
          {
            role: "user" as const,
            content: `[MEMORY CONTEXT - Previous sessions summary, use to give personalized support]\n${combinedMemory}\n[END MEMORY CONTEXT]`,
          },
          { role: "assistant" as const, content: "Thank you, I'll keep our previous conversations in mind to support you better. 🐚" },
          ...currentMessages,
        ]
      : currentMessages;

    const lang = detectLanguage(userMsg.content);
    setDetectedLang(lang);

    try {
      await streamShellyResponse({
        messages: messagesWithMemory,
        languageHint: lang?.hint,
        onDelta: (content) => {
          assistantSoFar += content;
          const snapshot = assistantSoFar;
          updateSessionMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
            }
            return [...prev, { role: "assistant", content: snapshot }];
          });
        },
      });

      if (!assistantSoFar.trim()) {
        throw new ShellyStreamError("Shelly could not finish the reply.");
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof ShellyStreamError ? e.message : "Could not reach Shelly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-5xl flex-1 px-2 py-3 sm:px-4 sm:py-6 gap-0 sm:gap-4">
        {/* Session sidebar - mobile overlay / desktop inline */}
        <div
          className={`${
            showSidebar ? "fixed inset-0 z-50 flex" : "hidden"
          } sm:relative sm:flex sm:z-auto`}
        >
          {/* Overlay backdrop on mobile */}
          {showSidebar && (
            <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={() => setShowSidebar(false)} />
          )}
          <div className="relative z-10 flex w-64 shrink-0 flex-col rounded-2xl border border-border bg-card p-3 shadow-lg sm:shadow-none sm:w-56 h-full sm:h-auto max-h-[80vh] sm:max-h-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Sessions</span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 sm:hidden" onClick={() => setShowSidebar(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={createNewSession}
              variant="outline"
              size="sm"
              className="mb-3 w-full justify-start gap-2 rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> New Session
            </Button>
            <div className="flex-1 overflow-y-auto space-y-1">
              {[...sessions].reverse().map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer text-xs transition-colors ${
                    session.id === activeSessionId
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => switchSession(session.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{session.label}</span>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="text-muted-foreground hover:text-destructive text-[10px] shrink-0 ml-1"
                      title="Delete session"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3 sm:mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:hidden shrink-0"
              onClick={() => setShowSidebar(true)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <img src={shellyHappy} alt="Shelly" className="h-9 w-9 sm:h-11 sm:w-11" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground sm:text-lg">Shelly Chat</h1>
                <span
                  title={
                    apiStatus === "online"
                      ? "Chat service online"
                      : apiStatus === "offline"
                        ? "Chat service unreachable"
                        : "Checking chat service…"
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    apiStatus === "online"
                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : apiStatus === "offline"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      apiStatus === "online"
                        ? "bg-green-500"
                        : apiStatus === "offline"
                          ? "bg-destructive"
                          : "bg-muted-foreground animate-pulse"
                    }`}
                  />
                  {apiStatus === "online" ? "Online" : apiStatus === "offline" ? "Offline" : "Checking"}
                </span>
                {detectedLang && (
                  <span
                    title={`Detected language for your last message: ${detectedLang.label}. Shelly will reply in ${detectedLang.label}.`}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {detectedLang.flag && <span aria-hidden>{detectedLang.flag}</span>}
                    {detectedLang.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground sm:text-xs truncate">
                Support for emotions, stress & wellbeing
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  onClick={() => {
                    updateSessionMessages(() => []);
                    toast({ title: "Chat cleared", description: "All messages in this session have been deleted." });
                  }}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear Chat
                </Button>
              )}
              <Button
                onClick={createNewSession}
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> New Session
              </Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card/40 p-3 pr-2 sm:mb-4 sm:p-4"
            style={{ maxHeight: "calc(100dvh - 260px)" }}
          >
            {messages.length === 0 && (
              <div className="space-y-4 py-12 text-center sm:py-16">
                <img src={shellyHappy} alt="Shelly" className="mx-auto w-20 sm:w-24" />
                <p className="mx-auto max-w-md text-sm leading-7 text-muted-foreground">
                  Hi, I&apos;m Shelly 🐚 — tell me what you&apos;re feeling, what&apos;s weighing on you, or where you need support today.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[80%] sm:px-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card text-card-foreground shadow-sm border border-border rounded-bl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none break-words text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-card rounded-2xl px-4 py-2.5 border border-border shadow-sm">
                  <span className="animate-pulse text-muted-foreground text-sm">Shelly is thinking…</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Shelly about stress, emotions, or self-care…"
              className="h-11 rounded-full px-4 text-sm sm:text-base"
              disabled={isLoading}
            />
            <Button onClick={send} disabled={isLoading} size="icon" className="h-11 w-11 rounded-full shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChatPage;
