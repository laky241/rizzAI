# ReplyAI — Chrome Extension

> Context-aware AI reply suggestions, living right inside your conversations.

---

## What It Does

ReplyAI sits in your Chrome toolbar and reads the conversation you have open — WhatsApp Web, Instagram DMs, Hinge — then suggests 3 smart replies in whatever tone you want. One click to copy, then send.

No switching to ChatGPT. No copy-pasting. Just open the extension and hit Generate.

---

## Supported Platforms

| Platform | Status |
|---|---|
| WhatsApp Web | ✅ Fully supported |
| Instagram DMs | ✅ Supported |
| Hinge Web | ✅ Supported |
| Telegram Web | 🔜 Coming soon |
| LinkedIn Messages | 🔜 Coming soon |

---

## How to Load the Extension (Development Mode)

1. Open Chrome and go to `chrome://extensions`
2. Toggle on **Developer mode** (top right corner)
3. Click **Load unpacked**
4. Select the `replyai-extension` folder
5. Pin the ReplyAI extension to your toolbar

That's it. Open WhatsApp Web, start a conversation, and click the ReplyAI icon.

---

## Getting Your API Key

ReplyAI uses the Claude API (by Anthropic) to generate replies.

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Go to **API Keys** → Create a new key
4. Open ReplyAI → Settings → paste your key

Free daily limit: **10 replies/day** (resets at midnight).
With your own API key: **unlimited**.

---

## Project Structure

```
replyai-extension/
├── manifest.json              # Extension config, permissions, entry points
│
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Full design system (dark theme)
│   └── popup.js               # All popup logic, state management
│
├── content/
│   └── reader.js              # Injected into WhatsApp/IG/Hinge — reads DOM
│
├── background/
│   └── service_worker.js      # Handles Claude API calls
│
└── assets/
    └── icons/                 # Extension icons (16, 32, 48, 128px)
```

---

## Tech Stack

- **Manifest V3** Chrome Extension
- **Vanilla JS** — no framework needed for an extension popup
- **Claude API** (`claude-opus-4`) for reply generation
- **Chrome Storage API** for settings and usage tracking
- **Clipboard API** for one-tap copy

---

## Week 1 Roadmap

- [x] Day 1-2: Extension shell + UI + WhatsApp Web reader
- [ ] Day 3: Instagram + Hinge readers, full API integration
- [ ] Day 4: Tone customisation + reply length settings
- [ ] Day 5: Polish UI, test across all platforms
- [ ] Day 6: Usage analytics + freemium limit enforcement
- [ ] Day 7: Submit to Chrome Web Store

---

## Future (Post-MVP)

- **Android App** — Floating overlay using Accessibility API
- **Style Learning** — AI learns how you text and mirrors your voice
- **ReplyScore** — Rates how your reply will land before you send it
- **Dating Mode** — Hinge/Bumble-specific conversation starters
- **Team/B2B Plan** — For sales reps, support agents, recruiters

---

## License

MIT — build on it, ship it, make money.
