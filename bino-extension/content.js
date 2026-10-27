/**
 * Bino Chrome Extension - Google Meet Content Script
 *
 * Telemetry Monitor:
 * - Activates only when user is actively inside a live meeting call
 * - Tracks tab focus (active / unfocused), idle activity (>20s), Wi-Fi, and duration
 * - Supports instructor ping alert banner
 * - Protected against extension context invalidation
 */

(function () {
  if (window.__binoInitialized) return;
  window.__binoInitialized = true;

  console.log('[Bino] Google Meet Telemetry Content Script initialized.');

  // Guard against extension reloads
  function isExtensionAlive() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  }

  let currentProfile = {
    name: 'Sharmel B. Lomigo',
    email: 'sharmellomigo05@gmail.com',
  };

  let isInsideActiveCall = false;
  let currentState = 'active'; // 'active' | 'idle' | 'unfocused' | 'disconnected'
  let sessionStartTime = null;
  let lastActivityTime = Date.now();
  let activeSeconds = 0;
  let totalSessionSeconds = 0;
  let wifiHealth = 'stable';
  let idleTimer = null;
  let pollInterval = null;

  // Safe storage sync
  function syncProfileFromStorage() {
    if (!isExtensionAlive()) return;
    try {
      chrome.storage?.local?.get(['binoProfile'], (res) => {
        if (!isExtensionAlive() || chrome.runtime?.lastError) return;
        if (res && res.binoProfile && res.binoProfile.name) {
          currentProfile = res.binoProfile;
        }
      });
    } catch (e) {
      // Context invalidated
    }
  }
  syncProfileFromStorage();

  // 1. Meeting Code Verification
  function getMeetingCode() {
    const pathname = window.location.pathname || '';
    const match = pathname.match(/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    return match ? match[1].toLowerCase() : null;
  }

  // 2. Strict Live Call Verification
  function isUserInLiveCall() {
    const code = getMeetingCode();
    if (!code) return false;

    const leaveBtn =
      document.querySelector('[jsname="CQylAd"]') ||
      document.querySelector('button[aria-label*="Leave" i]') ||
      document.querySelector('button[aria-label*="退出" i]') ||
      document.querySelector('button[aria-label*="終了" i]') ||
      document.querySelector('button[data-tooltip*="Leave" i]');

    return !!leaveBtn;
  }

  // 3. Wi-Fi Assessment
  function assessWifiHealth() {
    if (navigator.connection) {
      const conn = navigator.connection;
      if (conn.rtt > 350 || conn.downlink < 1.0) return 'poor';
      if (conn.rtt > 150 || conn.downlink < 3.0) return 'fair';
    }
    return 'stable';
  }

  // 4. Telemetry Calculations
  function calculateEngagement() {
    if (!sessionStartTime) return 95;
    totalSessionSeconds = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));
    if (currentState === 'active') activeSeconds += 2;
    const ratio = Math.min(100, Math.round((activeSeconds / totalSessionSeconds) * 100));
    return Math.max(30, ratio);
  }

  function getDurationString() {
    if (!sessionStartTime) return '00:00:00';
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  function sendTelemetry(eventType, extraData = {}) {
    if (!isExtensionAlive()) return;

    const studentId = 'bino-' + (currentProfile.email || 'sharmellomigo05@gmail.com').toLowerCase().replace(/[^a-z0-9]/g, '_');

    const payload = {
      type: eventType,
      student: {
        id: studentId,
        name: currentProfile.name || 'Sharmel B. Lomigo',
        email: currentProfile.email || 'sharmellomigo05@gmail.com',
        status: currentState,
        wifiHealth: assessWifiHealth(),
        engagement: calculateEngagement(),
        duration: getDurationString(),
        lastSeen: Date.now(),
        ...extraData,
      },
    };

    try {
      chrome.runtime.sendMessage(payload, () => {
        if (!isExtensionAlive() || chrome.runtime?.lastError) {}
      });
    } catch (e) {}
  }

  function updateStatus(newStatus, reason = '') {
    if (!isInsideActiveCall || currentState === newStatus) return;
    const oldStatus = currentState;
    currentState = newStatus;

    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    sendTelemetry('STATUS_CHANGE', {
      historyEntry: {
        time: timeStr,
        status: newStatus,
        label: reason || `Status changed to ${newStatus}`,
      },
    });
  }

  // 5. Evaluate Meeting State
  function evaluateMeetingState() {
    if (!isExtensionAlive()) {
      if (pollInterval) clearInterval(pollInterval);
      if (idleTimer) clearInterval(idleTimer);
      return;
    }

    syncProfileFromStorage();
    const inCallNow = isUserInLiveCall();

    // Transition: Entered Meeting Call
    if (inCallNow && !isInsideActiveCall) {
      isInsideActiveCall = true;
      sessionStartTime = Date.now();
      lastActivityTime = Date.now();
      currentState = 'active';

      console.log(`[Bino] >>> ENTERED LIVE MEETING: ${currentProfile.name}`);
      sendTelemetry('STUDENT_JOIN', {
        status: 'active',
        wifiHealth: assessWifiHealth(),
        engagement: 95,
        duration: '00:00:01',
      });
    }

    // Transition: Left Meeting Call
    else if (!inCallNow && isInsideActiveCall) {
      isInsideActiveCall = false;
      console.log(`[Bino] <<< EXITED LIVE MEETING: ${currentProfile.name}`);
      sendTelemetry('STUDENT_LEAVE', { status: 'disconnected' });
      sessionStartTime = null;
    }
  }

  // 6. Tab Visibility Listeners
  document.addEventListener('visibilitychange', () => {
    if (!isInsideActiveCall) return;
    if (document.hidden) {
      updateStatus('unfocused', 'Google Meet tab minimized or hidden');
    } else {
      updateStatus('active', 'Returned focus to Google Meet');
      lastActivityTime = Date.now();
    }
  });

  window.addEventListener('blur', () => {
    if (!isInsideActiveCall) return;
    updateStatus('unfocused', 'Window lost focus');
  });

  window.addEventListener('focus', () => {
    if (!isInsideActiveCall) return;
    updateStatus('active', 'Regained active focus on Google Meet');
    lastActivityTime = Date.now();
  });

  // 7. Idle Detection
  function recordUserActivity() {
    lastActivityTime = Date.now();
    if (isInsideActiveCall && currentState === 'idle') {
      updateStatus('active', 'User interaction detected');
    }
  }

  ['pointermove', 'keydown', 'scroll', 'click'].forEach((evt) => {
    window.addEventListener(evt, recordUserActivity, { passive: true });
  });

  idleTimer = setInterval(() => {
    if (!isExtensionAlive()) {
      clearInterval(idleTimer);
      return;
    }
    if (isInsideActiveCall && currentState !== 'unfocused') {
      const idleSeconds = (Date.now() - lastActivityTime) / 1000;
      if (idleSeconds >= 20 && currentState !== 'idle') {
        updateStatus('idle', 'No interaction for >20 seconds');
      }
    }
  }, 3000);

  // 8. Heartbeat
  pollInterval = setInterval(() => {
    if (!isExtensionAlive()) {
      clearInterval(pollInterval);
      return;
    }
    evaluateMeetingState();
    if (isInsideActiveCall) {
      sendTelemetry('HEARTBEAT');
    }
  }, 2000);

  // 9. Navigation & Leave Listeners
  // Immediate capture on Leave Call button click
  document.addEventListener(
    'click',
    (e) => {
      const leaveBtn = e.target.closest(
        '[jsname="CQylAd"], button[aria-label*="Leave" i], button[aria-label*="退出" i], button[aria-label*="終了" i], button[data-tooltip*="Leave" i]'
      );
      if (leaveBtn) {
        console.log('[Bino] Leave Call button clicked by user.');
        isInsideActiveCall = false;
        currentState = 'disconnected';
        sendTelemetry('STUDENT_LEAVE', {
          status: 'disconnected',
          historyEntry: {
            time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
            status: 'disconnected',
            label: 'User clicked Leave Call',
          },
        });
      }
    },
    true
  );

  window.addEventListener('popstate', evaluateMeetingState);
  const origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    setTimeout(evaluateMeetingState, 100);
  };
  const origReplace = history.replaceState;
  history.replaceState = function () {
    origReplace.apply(this, arguments);
    setTimeout(evaluateMeetingState, 100);
  };

  window.addEventListener('beforeunload', () => {
    if (isInsideActiveCall && isExtensionAlive()) {
      sendTelemetry('STUDENT_LEAVE', { status: 'disconnected' });
    }
  });

  // 10. Messages from Extension
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'SET_STATUS') {
        updateStatus(request.status, request.label || 'Manual status change');
        sendResponse({ success: true });
        return true;
      }

      if (request.type === 'PING_ALERT' && isInsideActiveCall) {
        showPingBanner();
        sendResponse({ success: true });
        return true;
      }
    });
  }

  function showPingBanner() {
    const existing = document.getElementById('bino-ping-alert');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'bino-ping-alert';
    banner.style.cssText =
      'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:9999999;background:#7A3A65;border:2px solid #34D399;border-radius:16px;padding:14px 24px;color:#FFFFFF;font-family:Inter,-apple-system,sans-serif;box-shadow:0 12px 36px rgba(0,0,0,0.5);display:flex;align-items:center;gap:14px;';

    banner.innerHTML = `
      <div style="background:#88A4A7;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;">🦖</div>
      <div>
        <div style="font-weight:800;font-size:16px;color:#FFFFFF;letter-spacing:0.5px;">Attention</div>
      </div>
      <button id="bino-ping-ack" style="margin-left:14px;background:#88A4A7;border:none;color:#FFFFFF;border-radius:10px;padding:7px 14px;cursor:pointer;font-weight:700;font-size:13px;">I'm Here</button>
    `;

    document.body.appendChild(banner);
    document.getElementById('bino-ping-ack').onclick = () => {
      banner.remove();
      recordUserActivity();
      updateStatus('active', 'Ping acknowledged');
    };
    setTimeout(() => banner.remove(), 10000);
  }

  evaluateMeetingState();
})();
