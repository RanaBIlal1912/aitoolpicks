"use client";

import { useState, type FormEvent } from "react";
import { SITE } from "@/lib/site";

const TOPICS = ["Question or feedback", "Report a mistake", "Suggest a tool to cover", "Partnership or press"];

/**
 * A static site has no server to receive form posts, so this form prepares your message and sends it
 * the only two ways we can honestly offer: by email (if a public address is configured) or as a GitHub issue.
 */
export default function ContactForm() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const email = SITE.contactEmail;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError("Please write at least a short sentence so we can help.");
      return;
    }
    setError("");
    const subject = `[${SITE.name}] ${topic}`;
    const body = `${message.trim()}\n\n${name.trim() ? `— ${name.trim()}` : ""}`;
    const url = email
      ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `${SITE.repo}/issues/new?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (email) window.location.href = url;
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={submit} noValidate className="glass rounded-[26px] p-6 md:p-8" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="text-xl font-bold text-white">
        Send us a message
      </h2>
      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor="c-topic" className="mb-1.5 block text-sm font-semibold text-soft">
            Topic
          </label>
          <select id="c-topic" className="cur !w-full" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold text-soft">
            Your name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-white focus:border-violet focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="c-msg" className="mb-1.5 block text-sm font-semibold text-soft">
            Message
          </label>
          <textarea
            id="c-msg"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "c-err" : undefined}
            className="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-white focus:border-violet focus:outline-none"
          />
          {error && (
            <p id="c-err" role="alert" className="mt-2 text-sm text-amber">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary">
          {email ? "Open in your email app" : "Continue on GitHub"}
        </button>
        <p className="max-w-md text-sm text-muted">
          {email
            ? "This opens your email app with the message ready to send."
            : "This opens a new public GitHub issue with your message filled in. Do not include private details such as passwords or payment information."}
        </p>
      </div>
    </form>
  );
}
