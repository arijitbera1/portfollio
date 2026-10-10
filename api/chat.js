import OpenAI from "openai";
import { portfolioKnowledge } from "./portfolioKnowledge.js";

const MAX_MESSAGE_LENGTH = 1200;
const MAX_CONVERSATION_MESSAGES = 8;
const MAX_REQUEST_BYTES = 16_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitEntries = new Map();

const systemInstructions = `You are Arijit AI, the personal AI assistant for Arijit Bera's developer portfolio.

Answer using ONLY the portfolio knowledge below. Be friendly, concise, professional, and helpful. Do not claim to be Arijit; you are Arijit's portfolio AI assistant.

Never invent projects, companies, employment, education, skills, achievements, availability, contact information, links, or experience. If information is not available, say so plainly and suggest a related question. Distinguish technologies explicitly listed in the portfolio from technologies that are not confirmed.

When giving a link, only use a URL or route explicitly included in the portfolio knowledge. You may use short Markdown links, but never output HTML. Keep normal answers concise unless the visitor asks for detail.

PORTFOLIO KNOWLEDGE:
${JSON.stringify(portfolioKnowledge)}`;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitEntries.get(ip);

  if (!entry || now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitEntries.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function sanitizeConversation(conversation) {
  if (!Array.isArray(conversation)) return [];

  return conversation
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .slice(-MAX_CONVERSATION_MESSAGES)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.length > 0);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return res.status(413).json({ error: "Request is too large" });
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Please send a message under 1,200 characters." });
  }

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: "Please wait a few minutes before sending another message." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "The assistant is not configured yet." });
  }

  const conversation = sanitizeConversation(req.body?.conversation);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: systemInstructions,
      input: [...conversation, { role: "user", content: message }],
      max_output_tokens: 350,
      store: false,
    });

    const answer = response.output_text?.trim();
    if (!answer) {
      return res.status(502).json({ error: "The assistant returned an empty response." });
    }

    return res.status(200).json({ message: answer });
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : 500;
    const safeStatus = status === 429 ? 429 : 502;
    return res.status(safeStatus).json({
      error:
        safeStatus === 429
          ? "The assistant is busy right now. Please try again shortly."
          : "The assistant is temporarily unavailable.",
    });
  }
}
