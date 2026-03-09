<div align="center">

# RizzAI

**Context-aware reply suggestions, living inside your conversations.**

WhatsApp Web · Instagram DMs · Hinge · More coming

<br/>

![Version](https://img.shields.io/badge/version-1.0.0-c8ff57?style=flat-square&labelColor=0d0d0f)
![Manifest](https://img.shields.io/badge/manifest-v3-c8ff57?style=flat-square&labelColor=0d0d0f)
![License](https://img.shields.io/badge/license-MIT-c8ff57?style=flat-square&labelColor=0d0d0f)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-c8ff57?style=flat-square&labelColor=0d0d0f)

</div>

---

## The Problem

Every time you wanted help replying to a message, you had to switch to ChatGPT, paste the entire conversation, explain the context, copy the reply, then switch back. That's five steps for something that should take one click.

---

## What ReplyAI Does

ReplyAI is a Chrome extension that sits in your toolbar. Open any conversation on WhatsApp Web, Instagram DMs, or Hinge — it reads the chat directly from the page and generates 3 smart reply options in the tone you pick. Click to copy, then send.

No switching apps. No copy-pasting. Zero friction.

---

## Features

- **Reads conversations automatically** — no copy-paste, reads the page directly
- **Tone control** — Casual, Flirty, Professional, Funny, or Direct
- **Reply length** — Short, Medium, or Detailed
- **Extra context** — optionally add "we just matched" or "she's been cold lately"
- **One-click copy** — tap any suggestion to copy it instantly
- **Free tier** — 10 replies/day with no account needed. Add your own API key for unlimited.

---

## Supported Platforms

| Platform | Status |
|---|---|
| WhatsApp Web | ✅ Live |
| Instagram DMs | ✅ Live |
| Hinge Web | ✅ Live |
| Telegram Web | 🔜 In progress |
| LinkedIn Messages | 🔜 Planned |
| Twitter / X DMs | 🔜 Planned |

---

## Installation

### For Users — Chrome Web Store

> 🚀 **Chrome Web Store listing coming soon.**
>
> Once live, installation will be one click — no setup, no terminal, no developer mode needed.
> **Star this repo** to get notified when it drops.

---

### For Developers — Run Locally
```bash
git clone https://github.com/YOUR_USERNAME/replyai-extension.git
```

1. Open Chrome and go to `chrome://extensions`
2. Toggle on **Developer mode** (top right)
3. Click **Load unpacked** → select the cloned folder
4. Pin the ReplyAI icon to your toolbar

> This is for local development and testing only. End users will install through the Chrome Web Store.

---

### Get a Free API Key

ReplyAI runs on [Groq](https://console.groq.com) — free, no credit card, 14,400 requests/day.

1. Sign up at [console.groq.com](https://console.groq.com)
2. Go to **API Keys** → create a new key
3. Open ReplyAI → click ⚙️ Settings → paste your key → Save

---

## How It Works
```
You open a conversation
        ↓
ReplyAI reads the chat DOM (no clipboard needed)
        ↓
Sends last 20 messages + your tone to Groq API
        ↓
AI returns 3 contextual reply suggestions
        ↓
Click one to copy → paste → send
```

Conversations are never stored. Everything goes directly from your browser to Groq and is discarded immediately.

---

## Project Structure
```
replyai-extension/
├── manifest.json              # Extension config, permissions (MV3)
├── popup/
│   ├── popup.html             # Extension popup markup
│   ├── popup.css              # Design system — dark theme, CSS variables
│   └── popup.js               # UI logic, state, settings, clipboard
├── content/
│   └── reader.js              # Injected into chat pages, reads the DOM
├── background/
│   └── service_worker.js      # Groq API calls, background context
└── assets/
    └── icons/                 # Extension icons (16, 32, 48, 128px)
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | Chrome Manifest V3, Vanilla JS |
| AI | Groq API — llama-3.3-70b |
| Storage | Chrome Storage API |
| Styling | Pure CSS, no framework |

No React, no bundler, no build step. Clone and load — that's it.

---

## Privacy

- Conversations are **never stored** anywhere
- API calls go directly from your browser to Groq
- Your API key lives in Chrome's local encrypted storage
- No analytics, no tracking, no account required

---

## Roadmap

**v1.1** — Telegram Web + LinkedIn support, keyboard shortcut (`Ctrl+Shift+R`), regenerate individual replies

**v1.2** — Style learning (AI mirrors how you personally text), ReplyScore, dating mode for Hinge/Bumble

**v2.0** — Android app with floating overlay, freemium paywall, B2B team plan

---

## Contributing

PRs are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

---

## License

MIT — use it, build on it, ship it.

---

<div align="center">
Built with focus. No fluff.
</div>
```

---

Now your full file structure should be:
```
replyai-extension/
├── manifest.json
├── README.md
├── .gitignore
├── CONTRIBUTING.md
├── CHANGELOG.md
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── reader.js
├── background/
│   └── service_worker.js
└── assets/
    └── icons/
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
