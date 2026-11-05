/** What a client needs to open a chat with the bill pre-typed. */
export type WhatsappShare = { phone: string; text: string };

// WhatsApp Web only works in one tab at a time, so every bill reuses this tab
// instead of piling up "WhatsApp is open in another window" tabs.
const TAB_NAME = "cracker-billing-whatsapp";

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Phones: wa.me opens the WhatsApp app. Computers: go straight to WhatsApp Web
 * (wa.me would show an extra "Continue to chat" page). Call in the browser only.
 */
export function whatsappChatUrl({ phone, text }: WhatsappShare) {
  const encoded = encodeURIComponent(text);
  return isMobile()
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
}

/** Opens (or reuses) the WhatsApp tab on the customer's chat. */
export function openWhatsappChat(share: WhatsappShare) {
  const tab = window.open(whatsappChatUrl(share), TAB_NAME);
  tab?.focus();
  return tab !== null;
}

/**
 * Opens the WhatsApp tab synchronously inside a click/submit handler, so the
 * browser allows it. Point it at the chat later with `sendTo`, once the bill
 * is saved.
 */
export function openPendingTab() {
  const tab = window.open("", TAB_NAME);
  if (!tab) return null;
  let isNew = false;
  try {
    // Same-origin only when the tab is new (about:blank); a reused tab is
    // already on WhatsApp and throws here, which is fine.
    isNew = tab.location.href === "about:blank";
    if (isNew) tab.document.body.textContent = "Opening WhatsApp…";
  } catch {
    // Reused tab on web.whatsapp.com.
  }
  return {
    sendTo(share: WhatsappShare) {
      if (tab.closed) return false;
      tab.location.href = whatsappChatUrl(share);
      tab.focus();
      return true;
    },
    close() {
      // Only close a tab this save created; never the user's WhatsApp tab.
      if (isNew) tab.close();
    },
  };
}
