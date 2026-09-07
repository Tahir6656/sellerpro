"use client";

import { FormEvent, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Message {
  id: string;
  body: string;
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim() || (!selectedId && !subject.trim())) return;

    setSending(true);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId, subject, message }),
    });
    const json = await response.json();
    if (json.success) {
      toast("Message sent to the support team", "success");
      setMessage("");
      setSubject("");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contact us</h1>
        <p className="text-slate-500 mt-1">Talk to an agent about your account or any problem.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <Card title="Your requests">
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : conversations.length === 0 ? (
            <p className="text-sm text-slate-500">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedId === conversation.id ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:bg-slate-50"}`}
                >
                  <p className="font-medium text-sm truncate">{conversation.subject}</p>
                  <p className="text-xs text-slate-500 mt-1">{conversation.status} · {conversation.messages.length} messages</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title={selected ? selected.subject : "Talk to an agent"}>
          {selected ? (
            <div className="space-y-4">
              <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                {selected.messages.map((item) => (
                  <div key={item.id} className={`flex ${item.senderRole === "USER" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${item.senderRole === "USER" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                      <p className="text-xs font-semibold mb-1">{item.senderRole === "USER" ? "You" : "Support agent"}</p>
                      <p className="text-sm whitespace-pre-wrap">{item.body}</p>
                      <p className={`text-[11px] mt-2 ${item.senderRole === "USER" ? "text-blue-100" : "text-slate-400"}`}>{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="space-y-3 border-t pt-4">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a message to the support team..."
                  rows={4}
                  maxLength={5000}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  required
                />
                <Button type="submit" loading={sending}>Send message</Button>
              </form>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="space-y-4">
              <p className="text-sm text-slate-500">Start a conversation with a support agent.</p>
              <Input label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={150} placeholder="What do you need help with?" required />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe your problem..."
                rows={6}
                maxLength={5000}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                required
              />
              <Button type="submit" loading={sending}>Send to an agent</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
