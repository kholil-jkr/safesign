"use client";

// SafeSign — AI consultation chat (Brief §4.3, §4.4, §6.2, §6.3).
// - Appears below the analysis results
// - Sends contract + prior analysis + recent history (capped) to the API
// - Quick-reply chips translated per UI language
// - Layer 1 client-side off-topic filter: API is never called on match
// - Session turn cap (8) with a friendly redirect to real resources
// - Chat state lives in this component only — no persistence, no database

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isOffTopic } from "@/lib/safesign/filter";
import { format, type Dictionary } from "@/lib/safesign/i18n";
import type { AnalysisResult, ChatMessage, LangCode } from "@/lib/safesign/types";

const MAX_TURNS = 8;

interface ChatBoxProps {
  contractText: string;
  analysis: AnalysisResult;
  lang: LangCode;
  dict: Dictionary;
  onErrorToast?: (message: string) => void;
}

export function ChatBox({ contractText, analysis, lang, dict, onErrorToast }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: dict.chatIntro },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const limitReached = turnsUsed >= MAX_TURNS;
  const turnsLeft = Math.max(0, MAX_TURNS - turnsUsed);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading, errorMsg]);

  // Reset intro message if the UI language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: dict.chatIntro }];
      }
      return prev;
    });
  }, [dict]);

  async function callChatApi(text: string) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/safesign/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          analysis,
          history: messages.slice(-12),
          message: text,
          lang,
          turnsUsed,
        }),
      });
      const data = (await res.json()) as { ok: boolean; reply?: string; error?: string };

      if (res.status === 429 || data.error === "TURN_LIMIT") {
        setTurnsUsed(MAX_TURNS);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: dict.chatLimitReached },
        ]);
        return;
      }
      if (!data.ok || !data.reply) {
        throw new Error(data.error || "UPSTREAM");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      setTurnsUsed((t) => t + 1);
    } catch {
      setErrorMsg(dict.errorGeneric);
      onErrorToast?.(dict.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(rawText?: string) {
    if (loading || limitReached) return;
    const text = (rawText ?? input).trim();
    if (!text) return;

    // Layer 1: client-side off-topic filter — no API call on match (Brief §4.4)
    if (isOffTopic(text)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: dict.offTopicMessage },
      ]);
      setInput("");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    await callChatApi(text);
  }

  async function handleRetry() {
    // Retry the most recent user message (it stays in the transcript)
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    await callChatApi(lastUser.content);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MessageCircle className="h-5 w-5 text-teal-700" aria-hidden="true" />
            {dict.chatTitle}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{dict.chatSubtitle}</p>
        </div>
        {!limitReached ? (
          <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            {format(dict.chatTurnsLeft, turnsLeft)}
          </span>
        ) : null}
      </div>

      {/* Messages */}
      <div
        className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-slate-50/70 p-3 sm:p-4"
        aria-live="polite"
      >
        {messages.map((m, i) => {
          const isLastOffTopic =
            m.role === "assistant" &&
            m.content === dict.offTopicMessage &&
            messages[i - 1]?.role === "user";
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-ee-md bg-teal-700 px-4 py-2.5 text-base leading-relaxed text-white"
                    : `max-w-[90%] rounded-2xl rounded-es-md border bg-white px-4 py-2.5 text-base leading-relaxed text-slate-800 ${
                        isLastOffTopic ? "border-slate-300 border-dashed" : "border-slate-200"
                      }`
                }
              >
                {isLastOffTopic ? (
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    SafeSign
                  </span>
                ) : null}
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          );
        })}

        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-es-md border border-slate-200 bg-white px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" />
            </div>
          </div>
        ) : null}

        {errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p>{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={loading}
              className="mt-2 h-9 rounded-lg border-red-300 text-red-800 hover:bg-red-100"
            >
              {dict.tryAgain}
            </Button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {/* Quick-reply chips (Brief §4.3) */}
      {!limitReached ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {dict.quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => handleSend(q)}
              className="min-h-[44px] rounded-full border border-teal-200 bg-teal-50 px-4 text-sm font-medium text-teal-900 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {/* Input */}
      {limitReached ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50 p-4 text-base leading-relaxed text-amber-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p>{dict.chatLimitReached}</p>
        </div>
      ) : (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dict.chatPlaceholder}
            disabled={loading}
            maxLength={2000}
            aria-label={dict.chatPlaceholder}
            className="h-12 flex-1 rounded-xl border-slate-300 bg-white text-base shadow-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={dict.chatSend}
            className="h-12 rounded-xl bg-teal-700 px-5 text-base font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{dict.chatSend}</span>
          </Button>
        </form>
      )}
    </section>
  );
}
