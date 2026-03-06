// ============================================================
//  ReplyAI — Background Service Worker
//  Handles all API calls (Claude / OpenAI)
//  Runs in the background, separate from the popup
// ============================================================

"use strict";

// ---- API Configuration ----

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Current recommended free model

const DEMO_API_KEY = ""; // Left empty intentionally — users add theirs in settings

// ---- Message Listener ----

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "GENERATE_REPLIES") {
    handleGenerateReplies(message.payload)
      .then((replies) => sendResponse({ replies }))
      .catch((err) => sendResponse({ error: err.message || "API request failed" }));

    return true; // Keep message channel open for async
  }
});

// ---- Main Generation Handler ----

async function handleGenerateReplies({ prompt, apiKey, tone, length }) {
  const key = apiKey || DEMO_API_KEY;

  if (!key) {
    throw new Error(
      "No API key found. Please add your Claude API key in Settings to generate replies."
    );
  }

  try {
    const replies = await callClaudeAPI(prompt, key);
    return replies;
  } catch (err) {
    // If Claude fails, surface a clean error
    throw new Error(err.message || "Failed to connect to the AI. Check your API key.");
  }
}

// ---- Groq API Call ----

async function callClaudeAPI(prompt, apiKey) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a reply suggestion assistant. Always respond with valid JSON only. No markdown, no explanation, just the JSON object.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.error?.message || "";

    if (response.status === 401) {
      throw new Error("Invalid API key. Double-check your Groq key in Settings.");
    }
    if (response.status === 429) {
      throw new Error("Rate limited. Wait a moment and try again.");
    }
    if (response.status === 500) {
      throw new Error("Groq is having issues. Try again in a second.");
    }

    throw new Error(msg || `API error (${response.status})`);
  }

  const data = await response.json();

  // Groq follows OpenAI format
  const rawText = data?.choices?.[0]?.message?.content || "";

  if (!rawText) {
    throw new Error("Empty response from AI. Please try again.");
  }

  return parseReplies(rawText);
}

// ---- Response Parser ----

function parseReplies(rawText) {
  // Strip any markdown code fences if Claude added them
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If JSON parsing fails, try to extract manually
    // This handles cases where the model adds a tiny bit of text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("Couldn't parse AI response. Please try again.");
      }
    } else {
      throw new Error("Unexpected AI response format. Please try again.");
    }
  }

  const replies = parsed?.replies;

  if (!Array.isArray(replies) || replies.length === 0) {
    throw new Error("No replies were returned. Please try again.");
  }

  // Validate and clean each reply
  return replies
    .filter((r) => r?.text && typeof r.text === "string")
    .map((r) => ({
      text: r.text.trim(),
      label: r.label?.trim() || "reply",
    }))
    .slice(0, 3); // Max 3 replies
}
