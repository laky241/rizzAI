// ============================================================
//  ReplyAI — Popup Script
//  Handles: platform detection, conversation reading,
//  AI reply generation, UI state management, settings
// ============================================================

// ---------- Constants ----------

const PLATFORM_CONFIG = {
  "web.whatsapp.com": {
    name: "WhatsApp Web",
    color: "#25d366",
  },
  "www.instagram.com": {
    name: "Instagram DMs",
    color: "#e1306c",
  },
  "hinge.co": {
    name: "Hinge",
    color: "#e83e5a",
  },
  "www.hinge.co": {
    name: "Hinge",
    color: "#e83e5a",
  },
};

const FREE_DAILY_LIMIT = 10;
const STORAGE_KEYS = {
  usageDate: "replyai_usage_date",
  usageCount: "replyai_usage_count",
  settings: "replyai_settings",
};

// ---------- State ----------

let currentTone = "casual";
let currentLength = "medium";
let currentReplies = [];
let isGenerating = false;

// ---------- DOM References ----------

const $ = (id) => document.getElementById(id);

const UI = {
  platformBar: $("platformBar"),
  platformDot: $("platformDot"),
  platformName: $("platformName"),
  generateBtn: $("generateBtn"),
  generateBtnText: $("generateBtn")?.querySelector(".generate-btn-text"),
  loadingState: $("loadingState"),
  errorState: $("errorState"),
  errorText: $("errorText"),
  retryBtn: $("retryBtn"),
  repliesSection: $("repliesSection"),
  repliesList: $("repliesList"),
  emptyState: $("emptyState"),
  regenerateBtn: $("regenerateBtn"),
  settingsBtn: $("settingsBtn"),
  settingsPanel: $("settingsPanel"),
  closeSettingsBtn: $("closeSettingsBtn"),
  saveSettingsBtn: $("saveSettingsBtn"),
  usageCount: $("usageCount"),
  usageBadge: $("usageBadge"),
  contextInput: $("contextInput"),
  userName: $("userName"),
  apiKey: $("apiKey"),
  toast: $("toast"),
  toastText: $("toastText"),
};

// ---------- Initialise ----------

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await checkAndResetUsage();
  await detectPlatform();
  bindEvents();
});

// ---------- Settings ----------

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.settings], (result) => {
      const settings = result[STORAGE_KEYS.settings] || {};
      if (settings.length) {
        currentLength = settings.length;
        document
          .querySelectorAll(".length-opt")
          .forEach((btn) => btn.classList.remove("active"));
        const activeBtn = document.querySelector(
          `.length-opt[data-length="${settings.length}"]`
        );
        if (activeBtn) activeBtn.classList.add("active");
      }
      if (settings.userName && UI.userName) {
        UI.userName.value = settings.userName;
      }
      if (settings.apiKey && UI.apiKey) {
        UI.apiKey.value = settings.apiKey;
      }
      resolve(settings);
    });
  });
}

function saveSettings() {
  const settings = {
    userName: UI.userName?.value?.trim() || "",
    apiKey: UI.apiKey?.value?.trim() || "",
    length: currentLength,
  };
  chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings }, () => {
    showToast("Settings saved ✓");
    hideSettings();
  });
}

// ---------- Usage Tracking ----------

async function checkAndResetUsage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.usageDate, STORAGE_KEYS.usageCount],
      (result) => {
        const today = new Date().toDateString();
        const storedDate = result[STORAGE_KEYS.usageDate];
        let count = result[STORAGE_KEYS.usageCount] || 0;

        // New day — reset
        if (storedDate !== today) {
          count = 0;
          chrome.storage.local.set({
            [STORAGE_KEYS.usageDate]: today,
            [STORAGE_KEYS.usageCount]: 0,
          });
        }

        updateUsageBadge(count);
        resolve(count);
      }
    );
  });
}

function updateUsageBadge(count) {
  const remaining = Math.max(0, FREE_DAILY_LIMIT - count);
  if (UI.usageCount) UI.usageCount.textContent = remaining;
}

async function incrementUsage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.usageCount],
      (result) => {
        const newCount = (result[STORAGE_KEYS.usageCount] || 0) + 1;
        chrome.storage.local.set({ [STORAGE_KEYS.usageCount]: newCount }, () => {
          updateUsageBadge(newCount);
          resolve(newCount);
        });
      }
    );
  });
}

async function getRemainingUsage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.usageCount, STORAGE_KEYS.usageDate],
      (result) => {
        const today = new Date().toDateString();
        const count =
          result[STORAGE_KEYS.usageDate] === today
            ? result[STORAGE_KEYS.usageCount] || 0
            : 0;
        resolve(Math.max(0, FREE_DAILY_LIMIT - count));
      }
    );
  });
}

// ---------- Platform Detection ----------

async function detectPlatform() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      setNoPlatform();
      return;
    }

    const url = new URL(tab.url);
    const hostname = url.hostname;
    const platform = PLATFORM_CONFIG[hostname];

    if (platform) {
      UI.platformDot.classList.add("active");
      UI.platformName.textContent = platform.name;
      UI.platformName.style.color = platform.color;
      // Hide empty state, show controls
      UI.emptyState.classList.add("hidden");
    } else {
      setNoPlatform();
    }
  } catch {
    setNoPlatform();
  }
}

function setNoPlatform() {
  UI.platformDot.classList.add("inactive");
  UI.platformName.textContent = "No supported chat detected";
  UI.emptyState.classList.remove("hidden");
  UI.generateBtn.disabled = true;
  UI.generateBtn.style.opacity = "0.45";
}

// ---------- Conversation Reading ----------

async function readConversation() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        reject(new Error("No active tab found"));
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "READ_CONVERSATION" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error("Cannot communicate with page. Please refresh."));
            return;
          }
          if (!response || response.error) {
            reject(new Error(response?.error || "Failed to read conversation"));
            return;
          }
          resolve(response.conversation);
        }
      );
    });
  });
}

// ---------- AI Reply Generation ----------

async function generateReplies(conversation) {
  // Get settings
  const settingsData = await new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.settings], (r) =>
      resolve(r[STORAGE_KEYS.settings] || {})
    );
  });

  const apiKey = settingsData.apiKey || "";
  const userName = settingsData.userName || "me";
  const extraContext = UI.contextInput?.value?.trim() || "";

  const prompt = buildPrompt(conversation, userName, extraContext);

  // Call the API through the background service worker
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "GENERATE_REPLIES",
        payload: { prompt, apiKey, tone: currentTone, length: currentLength },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error("Extension error. Please try again."));
          return;
        }
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.replies);
      }
    );
  });
}

function buildPrompt(conversation, userName, extraContext) {
  const lengthGuide = {
    short: "1-2 sentences max",
    medium: "2-4 sentences",
    long: "4-6 sentences, thoughtful and detailed",
  }[currentLength] || "2-4 sentences";

  const toneGuide = {
    casual: "casual, relaxed, like texting a friend",
    flirty: "playful, flirty, subtly charming without being creepy",
    professional: "clear, respectful, professional",
    funny: "funny, witty, light-hearted — maybe a joke or pun if it fits",
    direct: "direct and to the point, no fluff",
  }[currentTone] || "casual";

  return `You are a reply-suggestion assistant. A user named "${userName}" needs help replying to a conversation.

CONVERSATION (most recent messages at the bottom):
---
${conversation}
---

${extraContext ? `EXTRA CONTEXT FROM USER: ${extraContext}\n---` : ""}

Generate exactly 3 different reply options. Each reply should:
- Be written in the voice of "${userName}" (first person)
- Tone: ${toneGuide}
- Length: ${lengthGuide}
- Feel natural and human — NOT robotic or over-polished
- Vary meaningfully from each other (different angle, energy, or phrasing)
- Fit the context of the conversation naturally

Return your response as a JSON object ONLY. No explanation, no markdown, just this:
{
  "replies": [
    { "text": "reply one here", "label": "one-word vibe label" },
    { "text": "reply two here", "label": "one-word vibe label" },
    { "text": "reply three here", "label": "one-word vibe label" }
  ]
}`;
}

// ---------- Main Flow ----------

async function handleGenerate() {
  if (isGenerating) return;

  const remaining = await getRemainingUsage();
  if (remaining <= 0) {
    showError(
      "You've hit your free daily limit (10 replies). Add your API key in Settings for unlimited access."
    );
    return;
  }

  isGenerating = true;
  setLoadingState(true);
  hideError();
  hideReplies();

  try {
    const conversation = await readConversation();

    if (!conversation || conversation.trim().length < 5) {
      throw new Error(
        "Couldn't find any messages. Make sure a conversation is open."
      );
    }

    const replies = await generateReplies(conversation);
    await incrementUsage();
    currentReplies = replies;
    renderReplies(replies);
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    isGenerating = false;
    setLoadingState(false);
  }
}

// ---------- Render Replies ----------

function renderReplies(replies) {
  if (!replies || replies.length === 0) {
    showError("No replies were generated. Try again.");
    return;
  }

  UI.repliesList.innerHTML = "";

  replies.forEach((reply, index) => {
    const card = document.createElement("div");
    card.className = "reply-card";
    card.style.animationDelay = `${index * 0.08}s`;
    card.innerHTML = `
      <p class="reply-text">${escapeHtml(reply.text)}</p>
      <div class="reply-footer">
        <span class="reply-tone-tag">${escapeHtml(reply.label || currentTone)}</span>
        <span class="reply-copy-hint">Click to copy</span>
      </div>
    `;

    card.addEventListener("click", () => copyReply(card, reply.text));
    UI.repliesList.appendChild(card);

    // Staggered entrance
    card.style.opacity = "0";
    card.style.transform = "translateY(6px)";
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 80);
    });
  });

  UI.repliesSection.classList.remove("hidden");
}

function copyReply(card, text) {
  navigator.clipboard.writeText(text).then(() => {
    // Visual feedback on the card
    card.classList.add("copied");
    const hint = card.querySelector(".reply-copy-hint");
    if (hint) hint.textContent = "Copied!";

    showToast("Copied to clipboard ✓");

    setTimeout(() => {
      card.classList.remove("copied");
      if (hint) hint.textContent = "Click to copy";
    }, 2000);
  }).catch(() => {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("Copied!");
  });
}

// ---------- UI State Helpers ----------

function setLoadingState(active) {
  if (active) {
    UI.loadingState.classList.remove("hidden");
    UI.generateBtn.disabled = true;
    UI.generateBtn.style.opacity = "0.6";
    if (UI.generateBtnText) UI.generateBtnText.textContent = "Generating...";
  } else {
    UI.loadingState.classList.add("hidden");
    UI.generateBtn.disabled = false;
    UI.generateBtn.style.opacity = "1";
    if (UI.generateBtnText) UI.generateBtnText.textContent = "Generate Replies";
  }
}

function showError(message) {
  if (UI.errorText) UI.errorText.textContent = message;
  UI.errorState.classList.remove("hidden");
}

function hideError() {
  UI.errorState.classList.add("hidden");
}

function hideReplies() {
  UI.repliesSection.classList.add("hidden");
}

function showSettings() {
  UI.settingsPanel.classList.remove("hidden");
}

function hideSettings() {
  UI.settingsPanel.classList.add("hidden");
}

let toastTimer = null;

function showToast(message) {
  if (UI.toastText) UI.toastText.textContent = message;
  UI.toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    UI.toast.classList.add("hidden");
  }, 2000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ---------- Event Binding ----------

function bindEvents() {
  // Tone pills
  document.querySelectorAll(".tone-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tone-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentTone = pill.dataset.tone;
    });
  });

  // Length options (in settings)
  document.querySelectorAll(".length-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".length-opt").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentLength = btn.dataset.length;
    });
  });

  // Generate button
  UI.generateBtn?.addEventListener("click", handleGenerate);

  // Regenerate button
  UI.regenerateBtn?.addEventListener("click", handleGenerate);

  // Retry button
  UI.retryBtn?.addEventListener("click", () => {
    hideError();
    handleGenerate();
  });

  // Settings open/close
  UI.settingsBtn?.addEventListener("click", showSettings);
  UI.closeSettingsBtn?.addEventListener("click", hideSettings);

  // Save settings
  UI.saveSettingsBtn?.addEventListener("click", saveSettings);
}
