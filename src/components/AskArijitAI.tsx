import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { HiArrowUp, HiSparkles, HiXMark } from "react-icons/hi2";
import { config } from "../config";
import "./styles/AskArijitAI.css";

type MessageRole = "assistant" | "user";

interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  isWelcome?: boolean;
}

const quickQuestions = [
  "Who is Arijit?",
  "What projects has Arijit built?",
  "What Android skills does he have?",
  "What is his tech stack?",
  "How can I contact Arijit?",
];

const knownLinks = new Set([
  config.contact.github,
  config.contact.linkedin,
  config.contact.twitter,
  config.contact.facebook,
  config.contact.instagram,
  ...config.projects.map((project) => project.link).filter(Boolean),
  "/myworks",
  "#contact",
  `mailto:${config.contact.email}`,
]);

const welcomeMessage: ChatMessage = {
  id: 0,
  role: "assistant",
  isWelcome: true,
  content: "Hi! I’m Arijit’s portfolio AI assistant. Ask me about his work, skills, projects, or how to get in touch.",
};

function isSafePortfolioLink(url: string) {
  return knownLinks.has(url);
}

function MessageContent({ content }: { content: string }) {
  const markdownLink = /\[([^\]]+)\]\(([^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownLink.exec(content)) !== null) {
    if (match.index > lastIndex) nodes.push(content.slice(lastIndex, match.index));

    const [, label, url] = match;
    if (isSafePortfolioLink(url)) {
      const external = url.startsWith("http");
      nodes.push(
        <a
          key={`${url}-${match.index}`}
          href={url}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {label}
        </a>
      );
    } else {
      nodes.push(match[0]);
    }

    lastIndex = markdownLink.lastIndex;
  }

  if (lastIndex < content.length) nodes.push(content.slice(lastIndex));
  return <>{nodes}</>;
}

const AskArijitAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [isThinking, setIsThinking] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextMessageId = useRef(1);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const addMessage = (role: MessageRole, content: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: nextMessageId.current++, role, content },
    ]);
  };

  const sendMessage = async (messageToSend = draft) => {
    const message = messageToSend.trim();
    if (!message || isThinking) return;

    const conversation = messages
      .filter((chatMessage) => !chatMessage.isWelcome)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    addMessage("user", message);
    setDraft("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversation }),
      });
      const payload: unknown = await response.json();

      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        typeof (payload as { message?: unknown }).message !== "string"
      ) {
        throw new Error("Chat request failed");
      }

      addMessage("assistant", (payload as { message: string }).message);
    } catch {
      addMessage(
        "assistant",
        "Sorry, I’m having trouble connecting right now. You can still explore Arijit’s portfolio or contact him directly."
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <section className="ask-arijit-ai" aria-label="Ask Arijit AI assistant">
      {isOpen && (
        <div
          id="ask-arijit-ai-panel"
          className="ask-arijit-ai__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="ask-arijit-ai-title"
        >
          <header className="ask-arijit-ai__header">
            <div>
              <h2 id="ask-arijit-ai-title">
                <HiSparkles aria-hidden="true" /> Ask Arijit AI
              </h2>
              <p>Arijit’s personal portfolio assistant</p>
            </div>
            <button
              className="ask-arijit-ai__close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Ask Arijit AI"
            >
              <HiXMark aria-hidden="true" />
            </button>
          </header>

          <div className="ask-arijit-ai__messages" aria-live="polite" aria-label="Conversation">
            {messages.map((message) => (
              <article
                className={`ask-arijit-ai__message ask-arijit-ai__message--${message.role}`}
                key={message.id}
              >
                <span className="ask-arijit-ai__message-label">
                  {message.role === "assistant" ? "Arijit AI" : "You"}
                </span>
                <p>
                  <MessageContent content={message.content} />
                </p>
              </article>
            ))}

            {messages.length === 1 && !isThinking && (
              <div className="ask-arijit-ai__quick-questions" aria-label="Suggested questions">
                {quickQuestions.map((question) => (
                  <button key={question} type="button" onClick={() => void sendMessage(question)}>
                    {question}
                  </button>
                ))}
              </div>
            )}

            {isThinking && (
              <div className="ask-arijit-ai__thinking" role="status">
                Arijit AI is thinking<span aria-hidden="true"><i></i><i></i><i></i></span>
              </div>
            )}
          </div>

          <form className="ask-arijit-ai__form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              aria-label="Message Ask Arijit AI"
              maxLength={1200}
              rows={1}
              disabled={isThinking}
            />
            <button
              type="submit"
              disabled={isThinking || !draft.trim()}
              aria-label="Send message"
            >
              <HiArrowUp aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      <button
        className="ask-arijit-ai__trigger"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Open Ask Arijit AI"
        aria-expanded={isOpen}
        aria-controls="ask-arijit-ai-panel"
      >
        <HiSparkles aria-hidden="true" />
        <span>Ask Arijit AI</span>
      </button>
    </section>
  );
};

export default AskArijitAI;
