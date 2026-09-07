"use client";

import { FormEvent, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Message {
  id: string;
  body: string;
  senderRole: "USER" | "ADMIN";
  createdAt: string;
  readByAdmin: boolean;
  sender: { username: string; role: string };
}

interface Conversation {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  updatedAt: string;
  user: { username: string; email: string; mobile: string };
  messages: Message[];
}

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    const response = await fetch("/api/admin/support");
    const json = await response.json();
    if (json.success) {
      setConversations(json.data);
      setSelectedId((current) => current || json.data[0]?.id || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/support")
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

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;

    setSending(true);
    const response = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected.id, message: reply }),
    });
    const json = await response.json();
    if (json.success) {
      toast("Reply sent to the user", "success");
      setReply("");
      await loadConversations();
    } else {
      toast(json.error || "Could not send reply", "error");
    }
    setSending(false);
  };

  const updateStatus = async () => {
    if (!selected) return;
    const status = selected.status === "OPEN" ? "CLOSED" : "OPEN";
    const response = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected.id, status }),
    });
    const json = await response.json();
    if (json.success) {
      toast(json.data.message, "success");
      await loadConversations();
    } else toast(json.error || "Could not update conversation", "error");
  };

  const formatDate = (date: string) => new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Problems</h1>
        <p className="text-slate-500 mt-1">Review user problems and reply as a support agent.</p>
      </div>

      <div className="grid lg:grid-cols-[330px_1fr] gap-6">
        <Card title="User requests">
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : conversations.length === 0 ? (
            <p className="text-sm text-slate-500">No user messages yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const latest = conversation.messages[conversation.messages.length - 1];
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedId === conversation.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-sm truncate">{conversation.subject}</p>
                      <span className={`text-[10px] font-semibold ${conversation.status === "OPEN" ? "text-emerald-600" : "text-slate-400"}`}>{conversation.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{conversation.user.username} · {formatDate(conversation.updatedAt)}</p>
                    <p className="text-xs text-slate-400 truncate mt-1">{latest?.body}</p>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title={selected ? selected.subject : "Select a user request"}>
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{selected.user.username}</p>
                  <p className="text-slate-500">{selected.user.email} · {selected.user.mobile}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={updateStatus}>
                  {selected.status === "OPEN" ? "Close problem" : "Reopen problem"}
                </Button>
              </div>
              <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                {selected.messages.map((item) => (
                  <div key={item.id} className={`flex ${item.senderRole === "ADMIN" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${item.senderRole === "ADMIN" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                      <p className="text-xs font-semibold mb-1">{item.senderRole === "ADMIN" ? "You" : selected.user.username}</p>
                      <p className="text-sm whitespace-pre-wrap">{item.body}</p>
                      <p className={`text-[11px] mt-2 ${item.senderRole === "ADMIN" ? "text-emerald-100" : "text-slate-400"}`}>{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="space-y-3 border-t pt-4">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a reply to this user..."
                  rows={4}
                  maxLength={5000}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                  required
                />
                <Button type="submit" loading={sending}>Reply to user</Button>
              </form>
            </div>
          ) : <p className="text-sm text-slate-500">Choose a request to view its messages.</p>}
        </Card>
      </div>
    </div>
  );
}
