"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCheck, CircleHelp, ImagePlus, MessageCircle, Paperclip, Send, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Message {
  id: string;
  body: string;
  screenshotPath?: string | null;
  senderRole: "USER" | "ADMIN";
  createdAt: string;
  sender: { username: string; role: string };
}

interface Conversation {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function SupportPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const response = await fetch("/api/support");
    const json = await response.json();
    if (json.success) {
      setConversations(json.data);
      setSelectedId((current) => current || json.data[0]?.id || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support")
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setConversations(json.data);
          setSelectedId(json.data[0]?.id || null);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const selected = conversations.find((conversation) => conversation.id === selectedId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages.length]);

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setScreenshot(file);
    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim() || (!selectedId && !subject.trim())) return;

    setSending(true);

    const formData = new FormData();
    if (selectedId) formData.append("conversationId", selectedId);
    if (!selectedId) formData.append("subject", subject.trim());
    formData.append("message", message.trim());
    if (screenshot) formData.append("screenshot", screenshot);

    const response = await fetch("/api/support", {
      method: "POST",
      body: formData,
    });
    const json = await response.json();
    if (json.success) {
      toast("Message sent to the support team", "success");
      setMessage("");
      setSubject("");
      setScreenshot(null);
      setScreenshotPreview(null);
      await loadConversations();
    } else {
      toast(json.error || "Could not send message", "error");
    }
    setSending(false);
  };

  const formatDate = (date: string) => new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

  const clearAttachment = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Direct support</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Help Center</h1>
          <p className="mt-1 text-sm text-slate-500">A private conversation with the SellerPro support team.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" /> Available to help
        </div>
      </div>

      <div className="grid min-h-[680px] overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-900/10 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-blue-100 bg-slate-50/80 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Conversations</p>
              <p className="mt-0.5 text-xs text-slate-500">Your support history</p>
            </div>
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="max-h-52 space-y-2 overflow-y-auto p-3 lg:max-h-[calc(680px-73px)]">
            {loading ? <p className="p-3 text-sm text-slate-500">Loading conversations...</p> : conversations.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-500">No conversations yet.</div>
            ) : conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-2xl border p-3 text-left transition-all ${selectedId === conversation.id ? "border-blue-300 bg-white shadow-sm" : "border-transparent hover:border-blue-100 hover:bg-white"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{conversation.subject}</p>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${conversation.status === "OPEN" ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{conversation.messages.length} messages · {conversation.status.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[600px] flex-col bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_26rem),#f8fbff]">
          <header className="flex items-center gap-3 border-b border-blue-100 bg-white/80 px-5 py-4 backdrop-blur sm:px-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-[#0b1f3a] text-white shadow-lg shadow-blue-600/20"><CircleHelp className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">Help Center</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online support channel</p>
            </div>
            {selected && <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 sm:inline">{selected.status}</span>}
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-7">
            {selected ? (
              <>
                <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-500 shadow-sm"><CheckCheck className="h-3.5 w-3.5 text-blue-500" /> Conversation started {formatDate(selected.createdAt)}</div>
                {selected.messages.map((item) => {
                  const isUser = item.senderRole === "USER";
                  return (
                    <div key={item.id} className={`flex animate-[fade-in_180ms_ease-out] ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] sm:max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-4 py-3 shadow-sm ${isUser ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-blue-100 bg-white text-slate-800"}`}>
                          <p className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${isUser ? "text-blue-100" : "text-blue-600"}`}>{isUser ? "You" : "Help Center"}</p>
                          <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
                          {item.screenshotPath && <img src={item.screenshotPath} alt="Attached support image" className="mt-3 max-h-72 w-full rounded-xl border border-white/20 object-cover" />}
                        </div>
                        <p className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400 ${isUser ? "justify-end" : ""}`}>{formatDate(item.createdAt)} {isUser && <CheckCheck className="h-3 w-3 text-blue-500" />}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20"><MessageCircle className="h-8 w-8" /></div>
                <h2 className="text-xl font-bold text-slate-900">Welcome to Help Center</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">How can we help you today? Start a private conversation with our support team.</p>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-blue-100 bg-white p-4 sm:p-5">
            {!selected && <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={150} placeholder="Conversation subject" className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15" required />}
            {screenshotPreview && (
              <div className="relative mb-3 w-fit rounded-xl border border-blue-100 bg-blue-50 p-1.5">
                <img src={screenshotPreview} alt="Attachment preview" className="h-20 w-28 rounded-lg object-cover" />
                <button type="button" onClick={clearAttachment} aria-label="Remove attachment" className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white shadow"><X className="h-3 w-3" /></button>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
              <label className="cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600" title="Attach image">
                <Paperclip className="h-5 w-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
              </label>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message..." rows={1} maxLength={5000} className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0" required />
              <button type="submit" disabled={sending} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-slate-400"><ImagePlus className="h-3.5 w-3.5" /> You can attach an image to explain the issue.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
