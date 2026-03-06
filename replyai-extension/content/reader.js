// ============================================================
//  ReplyAI — Content Script (reader.js)
//  Injected into: WhatsApp Web, Instagram, Hinge
//  Job: Extract the current conversation text from the DOM
// ============================================================

(function () {
  "use strict";

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "READ_CONVERSATION") {
      try {
        const conversation = extractConversation();
        sendResponse({ conversation });
      } catch (err) {
        sendResponse({ error: err.message || "Failed to extract conversation" });
      }
      return true; // keep channel open for async
    }
  });

  // --------------------------------------------------------
  //  Main extraction dispatcher — routes to the right reader
  // --------------------------------------------------------

  function extractConversation() {
    const host = window.location.hostname;

    if (host === "web.whatsapp.com") {
      return readWhatsApp();
    }

    if (host === "www.instagram.com") {
      return readInstagram();
    }

    if (host === "hinge.co" || host === "www.hinge.co") {
      return readHinge();
    }

    throw new Error("Platform not supported on this page.");
  }

  // --------------------------------------------------------
  //  WhatsApp Web Reader
  //  Targets the main message list in the active chat panel
  // --------------------------------------------------------

  function readWhatsApp() {
    // The main chat container
    const chatPane = document.querySelector(
      "#main .copyable-area [data-tab='8'], #main .message-list-wrapper"
    );

    // Try different selectors — WhatsApp updates their DOM frequently
    const messageSelectors = [
      "[data-id] .copyable-text",
      "._akbu .copyable-text",
      ".message-in .copyable-text",
      ".message-out .copyable-text",
    ];

    let messages = [];

    // Find outgoing messages (from us)
    const outgoing = document.querySelectorAll(
      "[data-id] [class*='message-out'] .copyable-text, " +
        "div[class*='_akbu'][class*='message-out'] .copyable-text"
    );

    // Find incoming messages (from them)
    const incoming = document.querySelectorAll(
      "[data-id] [class*='message-in'] .copyable-text, " +
        "div[class*='_akbu'][class*='message-in'] .copyable-text"
    );

    // If the above doesn't work, grab all copyable-text in order
    if (outgoing.length === 0 && incoming.length === 0) {
      const allMessages = document.querySelectorAll(".copyable-text");
      if (allMessages.length === 0) {
        throw new Error(
          "No messages found. Please open a WhatsApp conversation."
        );
      }

      // Take last 20 messages
      const slice = Array.from(allMessages).slice(-20);
      messages = slice.map((el) => {
        const text = el.getAttribute("data-pre-plain-text") || "";
        const timeMatch = text.match(/\[(.*?)\]/);
        const nameMatch = text.match(/\] (.*?):/);
        const sender = nameMatch ? nameMatch[1] : "Unknown";
        const content = el.innerText?.trim() || "";
        return content ? `${sender}: ${content}` : null;
      }).filter(Boolean);
    } else {
      // We have split incoming/outgoing
      const allNodes = document.querySelectorAll(
        "[data-id]"
      );

      Array.from(allNodes)
        .slice(-25)
        .forEach((node) => {
          const isOut = node.querySelector("[class*='message-out']") ||
            node.closest("[class*='message-out']");
          const textEl = node.querySelector(".copyable-text");
          if (!textEl) return;

          const content = textEl.innerText?.trim();
          if (!content) return;

          const preText = textEl.getAttribute("data-pre-plain-text") || "";
          const nameMatch = preText.match(/\] (.*?):/);
          const sender = isOut ? "Me" : nameMatch ? nameMatch[1] : "Them";
          messages.push(`${sender}: ${content}`);
        });
    }

    if (messages.length === 0) {
      throw new Error(
        "Couldn't read messages. Make sure a conversation is open and try scrolling up a little."
      );
    }

    return messages.join("\n");
  }

  // --------------------------------------------------------
  //  Instagram DMs Reader
  //  Targets the message bubbles in the DM thread
  // --------------------------------------------------------

  function readInstagram() {
    // Instagram DM thread container
    // Their selectors change, so we try multiple
    const possibleContainers = [
      document.querySelector('div[role="listbox"]'),
      document.querySelector('section main div[role="list"]'),
      document.querySelector("div[class*='DirectThreadFeed']"),
    ];

    const container = possibleContainers.find(Boolean);

    // Get all text-containing message divs
    const messageItems = document.querySelectorAll(
      "div[role='listitem'], div[class*='DirectThreadMessage'], div[class*='messageItem']"
    );

    if (!messageItems || messageItems.length === 0) {
      throw new Error(
        "No Instagram DMs found. Please open a direct message thread."
      );
    }

    const messages = [];

    Array.from(messageItems)
      .slice(-20)
      .forEach((item) => {
        // Try to get the text content
        const textNodes = item.querySelectorAll(
          "div[dir='auto'], span[dir='auto']"
        );

        textNodes.forEach((node) => {
          const text = node.innerText?.trim();
          if (!text || text.length < 1) return;

          // Try to determine sender from aria-label or position
          const isOwnMessage =
            item.getAttribute("aria-label")?.includes("You") ||
            item.style.justifyContent === "flex-end" ||
            item.className.includes("_own") ||
            item.className.includes("outgoing");

          const sender = isOwnMessage ? "Me" : "Them";
          messages.push(`${sender}: ${text}`);
        });
      });

    if (messages.length === 0) {
      throw new Error(
        "Couldn't read messages. Make sure you have an Instagram DM thread open."
      );
    }

    return messages.join("\n");
  }

  // --------------------------------------------------------
  //  Hinge Reader
  //  Targets the chat bubbles in the Hinge web chat
  // --------------------------------------------------------

  function readHinge() {
    const chatMessages = document.querySelectorAll(
      "[class*='ChatMessage'], [class*='message'], [class*='bubble']"
    );

    if (!chatMessages || chatMessages.length === 0) {
      throw new Error(
        "No Hinge conversation found. Please open a match conversation."
      );
    }

    const messages = [];

    Array.from(chatMessages)
      .slice(-20)
      .forEach((el) => {
        const text = el.innerText?.trim();
        if (!text || text.length < 2) return;

        const isOwn =
          el.className.includes("own") ||
          el.className.includes("sent") ||
          el.className.includes("outgoing") ||
          el.getAttribute("data-sender") === "me";

        const sender = isOwn ? "Me" : "Them";
        messages.push(`${sender}: ${text}`);
      });

    if (messages.length === 0) {
      throw new Error(
        "Couldn't read the Hinge conversation. Please make sure a chat is open."
      );
    }

    return messages.join("\n");
  }
})();
