/**
 * Bino Chrome Extension - Background Service Worker (Manifest V3)
 * Maintains resilient WebSocket link with ws://localhost:3000
 * Auto-injects telemetry script into open Google Meet tabs and relays telemetry
 */

const DEFAULT_WS_URL = 'wss://julian-pottery-thou-cms.trycloudflare.com';
let WS_URL = DEFAULT_WS_URL;
let socket = null;
let isConnecting = false;
let messageQueue = [];

// Load custom server URL if configured
chrome.storage?.local?.get(['binoServerUrl'], (res) => {
  if (res && res.binoServerUrl) {
    WS_URL = res.binoServerUrl;
  }
  connectWebSocket();
});

// Auto-inject content.js into open Google Meet tabs
function injectIntoMeetTabs() {
  chrome.tabs?.query({ url: '*://meet.google.com/*' }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    tabs.forEach((tab) => {
      chrome.scripting?.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      }).catch((err) => {
        // Tab might be restricted or loading
      });
    });
  });
}

// Inject on startup and install
injectIntoMeetTabs();
chrome.runtime.onInstalled?.addListener(() => {
  injectIntoMeetTabs();
});

// Auto-inject when a Meet tab finishes loading or navigating
chrome.tabs.onUpdated?.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('meet.google.com')) {
    chrome.scripting?.executeScript({
      target: { tabId: tabId },
      files: ['content.js'],
    }).catch(() => {});
  }
});

// Immediate disconnection detection when Meet tab is closed
chrome.tabs.onRemoved?.addListener((tabId, removeInfo) => {
  chrome.tabs.query({ url: '*://meet.google.com/*' }, (tabs) => {
    // If no active meeting calls remain, send STUDENT_LEAVE
    const hasLiveCalls = tabs && tabs.some((t) => t.url && /[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(t.url));
    if (!hasLiveCalls) {
      chrome.storage?.local?.get(['binoProfile'], (res) => {
        const profile = res?.binoProfile || { name: 'Sharmel B. Lomigo', email: 'sharmellomigo05@gmail.com' };
        const studentId = 'bino-' + (profile.email || 'sharmellomigo05@gmail.com').toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: 'STUDENT_LEAVE',
              student: {
                id: studentId,
                name: profile.name,
                email: profile.email,
                status: 'disconnected',
              },
            })
          );
        }
      });
    }
  });
});

function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  isConnecting = true;
  console.log('[Bino Service Worker] Connecting to telemetry server:', WS_URL);

  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('[Bino Service Worker] WebSocket connected successfully.');
      isConnecting = false;

      // Register extension worker client
      socket.send(JSON.stringify({ type: 'EXTENSION_CONNECT' }));

      // Flush queued messages
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        socket.send(JSON.stringify(msg));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'PING_ALERT') {
          // 1. Native Chrome notification
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon128.png',
              title: 'Attention',
              message: 'Attention',
              priority: 2,
            });
          }

          // 2. Broadcast to Google Meet tabs
          chrome.tabs.query({ url: '*://meet.google.com/*' }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, {
                type: 'PING_ALERT',
                studentName: data.studentName,
              }).catch(() => {});
            });
          });
        }
      } catch (err) {
        console.error('[Bino Service Worker] Error parsing server message:', err);
      }
    };

    socket.onclose = () => {
      socket = null;
      isConnecting = false;
      setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = () => {
      socket = null;
      isConnecting = false;
    };
  } catch (err) {
    isConnecting = false;
    setTimeout(connectWebSocket, 3000);
  }
}

connectWebSocket();

// Listen for messages from content.js or popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === 'UPDATE_SERVER_URL' && message.url) {
    WS_URL = message.url;
    if (socket) {
      try { socket.close(); } catch (e) {}
      socket = null;
    }
    connectWebSocket();
    sendResponse({ success: true });
    return true;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    messageQueue.push(message);
    if (!isConnecting) {
      connectWebSocket();
    }
  }

  sendResponse({ received: true });
  return true;
});

// Periodic keep-alive
chrome.alarms?.create('binoKeepAlive', { periodInMinutes: 0.5 });
chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === 'binoKeepAlive') {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }
  }
});
