// ============================================================
//  ReplyAI — Background Service Worker
//  Handles all API calls (Claude / OpenAI)
//  Runs in the background, separate from the popup
// ============================================================

"use strict";

// ---- API Configuration ----

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-opus-4-20250514";

// A free public proxy API key for demo usage (10/day limit enforced client-side)
// Users add their own key in settings for unlimited access
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

// ---- Claude API Call ----

async function callClaudeAPI(prompt, apiKey) {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      messages: [
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
      throw new Error("Invalid API key. Double-check your key in Settings.");
    }
    if (response.status === 429) {
      throw new Error("You're being rate limited. Wait a moment and try again.");
    }
    if (response.status === 500) {
      throw new Error("The AI is having issues. Try again in a second.");
    }

    throw new Error(msg || `API error (${response.status})`);
  }

  const data = await response.json();

  // Extract the text content from Claude's response
  const rawText = data?.content?.[0]?.text || "";

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
