document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('detected-name');
  const emailEl = document.getElementById('detected-email');
  const meetingStatusEl = document.getElementById('meeting-status');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  const profileView = document.getElementById('profile-view');
  const profileEdit = document.getElementById('profile-edit');
  const toggleEditBtn = document.getElementById('toggle-edit-btn');
  const inputName = document.getElementById('input-name');
  const inputEmail = document.getElementById('input-email');
  const saveProfileBtn = document.getElementById('btn-save-profile');
  const cancelProfileBtn = document.getElementById('btn-cancel-profile');

  // Server link controls
  const toggleServerBtn = document.getElementById('toggle-server-btn');
  const serverEdit = document.getElementById('server-edit');
  const serverStatus = document.getElementById('server-status');
  const inputServerUrl = document.getElementById('input-server-url');
  const saveServerBtn = document.getElementById('btn-save-server');
  const cancelServerBtn = document.getElementById('btn-cancel-server');

  const DEFAULT_WS = 'wss://julian-pottery-thou-cms.trycloudflare.com';

  chrome.storage?.local?.get(['binoServerUrl'], (res) => {
    if (res && res.binoServerUrl) {
      serverStatus.textContent = res.binoServerUrl.replace(/^wss?:\/\//, '');
      inputServerUrl.value = res.binoServerUrl;
    } else {
      serverStatus.textContent = DEFAULT_WS.replace(/^wss?:\/\//, '');
      inputServerUrl.value = DEFAULT_WS;
    }
  });

  toggleServerBtn?.addEventListener('click', () => {
    serverEdit.style.display = serverEdit.style.display === 'none' ? 'block' : 'none';
  });

  cancelServerBtn?.addEventListener('click', () => {
    serverEdit.style.display = 'none';
  });

  saveServerBtn?.addEventListener('click', () => {
    let raw = inputServerUrl.value.trim() || DEFAULT_WS;
    raw = raw.replace(/\/+$/, '');
    if (raw.startsWith('https://')) {
      raw = raw.replace(/^https:\/\//, 'wss://');
    } else if (raw.startsWith('http://')) {
      raw = raw.replace(/^http:\/\//, 'ws://');
    } else if (!raw.startsWith('ws://') && !raw.startsWith('wss://')) {
      if (raw.includes('localhost') || raw.includes('127.0.0.1')) {
        raw = 'ws://' + raw;
      } else {
        raw = 'wss://' + raw;
      }
    }
    chrome.storage?.local?.set({ binoServerUrl: raw }, () => {
      serverStatus.textContent = raw.replace(/^wss?:\/\//, '');
      serverEdit.style.display = 'none';
      chrome.runtime.sendMessage({ type: 'UPDATE_SERVER_URL', url: raw });
    });
  });

  let currentStudent = {
    name: 'Sharmel B. Lomigo',
    email: 'sharmellomigo05@gmail.com',
  };

  function renderProfile() {
    nameEl.textContent = currentStudent.name || 'Sharmel B. Lomigo';
    emailEl.textContent = currentStudent.email || 'sharmellomigo05@gmail.com';
    inputName.value = currentStudent.name || '';
    inputEmail.value = currentStudent.email || '';
  }

  // 1. Load saved profile
  chrome.storage?.local?.get(['binoProfile'], (res) => {
    if (res && res.binoProfile && res.binoProfile.name) {
      currentStudent = res.binoProfile;
      renderProfile();
    } else {
      renderProfile();
    }
  });

  // 2. Try to auto-detect from active Meet tab if possible
  chrome.tabs.query({ url: '*://meet.google.com/*' }, (tabs) => {
    if (tabs.length > 0) {
      const targetTab = tabs.find((t) => t.active) || tabs[0];
      chrome.scripting?.executeScript(
        {
          target: { tabId: targetTab.id },
          func: () => {
            // Check in-call
            const leaveBtn = document.querySelector('[jsname="CQylAd"]') || document.querySelector('button[aria-label*="Leave" i]');
            const pathname = window.location.pathname || '';
            const inCall = !!(leaveBtn && /[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(pathname));

            // Check self name
            let selfName = '';
            const selfEl = document.querySelector('[data-self-name]');
            if (selfEl) {
              const txt = selfEl.getAttribute('data-self-name') || selfEl.textContent?.trim();
              if (txt && !['You', '自分', '(You)', '(自分)'].includes(txt)) {
                selfName = txt;
              }
            }

            return { inCall, selfName };
          },
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            const data = results[0].result;
            if (data.inCall) {
              meetingStatusEl.textContent = 'Active Call (Connected)';
              meetingStatusEl.style.color = '#34D399';
            }
            if (data.selfName && (!currentStudent.name || currentStudent.name === 'Student Attendee')) {
              currentStudent.name = data.selfName;
              renderProfile();
            }
          }
        }
      );
    }
  });

  // 3. Edit / Switch Account Controls
  toggleEditBtn?.addEventListener('click', () => {
    profileView.style.display = 'none';
    profileEdit.style.display = 'block';
    toggleEditBtn.style.display = 'none';
  });

  cancelProfileBtn?.addEventListener('click', () => {
    profileEdit.style.display = 'none';
    profileView.style.display = 'block';
    toggleEditBtn.style.display = 'inline';
  });

  saveProfileBtn?.addEventListener('click', () => {
    const newName = inputName.value.trim() || 'Sharmel B. Lomigo';
    const newEmail = inputEmail.value.trim() || 'sharmellomigo05@gmail.com';

    currentStudent = { name: newName, email: newEmail };
    chrome.storage?.local?.set({ binoProfile: currentStudent });

    renderProfile();
    profileEdit.style.display = 'none';
    profileView.style.display = 'block';
    toggleEditBtn.style.display = 'inline';

    // Broadcast JOIN with new account to server
    const studentId = 'bino-' + newEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    chrome.runtime.sendMessage({
      type: 'STUDENT_JOIN',
      student: {
        id: studentId,
        name: newName,
        email: newEmail,
        status: 'active',
        wifiHealth: 'stable',
        engagement: 95,
        duration: '00:01:00',
        lastSeen: Date.now(),
      },
    });
  });

  // 4. Manual Status Simulation
  function triggerStatus(status, label) {
    const name = currentStudent.name || 'Sharmel B. Lomigo';
    const email = currentStudent.email || 'sharmellomigo05@gmail.com';
    const studentId = 'bino-' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    chrome.tabs.query({ url: '*://meet.google.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: 'SET_STATUS', status, label }).catch(() => {});
      });
    });

    chrome.runtime.sendMessage({
      type: 'STATUS_CHANGE',
      student: {
        id: studentId,
        name: name,
        email: email,
        status: status,
        wifiHealth: status === 'disconnected' ? 'poor' : status === 'unfocused' ? 'fair' : 'stable',
        engagement: status === 'active' ? 95 : status === 'unfocused' ? 60 : status === 'idle' ? 45 : 20,
        duration: '00:05:00',
        lastSeen: Date.now(),
        historyEntry: {
          time: timeStr,
          status: status,
          label: label || `Manual extension switch to ${status}`,
        },
      },
    });
  }

  document.getElementById('btn-status-active')?.addEventListener('click', () => {
    triggerStatus('active', 'Resumed focused activity');
  });

  document.getElementById('btn-status-unfocused')?.addEventListener('click', () => {
    triggerStatus('unfocused', 'Switched away from Meet');
  });

  document.getElementById('btn-status-idle')?.addEventListener('click', () => {
    triggerStatus('idle', 'Inactivity (>20s)');
  });

  document.getElementById('btn-status-disconnected')?.addEventListener('click', () => {
    triggerStatus('disconnected', 'Left meeting / disconnected');
  });

  openDashboardBtn?.addEventListener('click', () => {
    chrome.storage?.local?.get(['binoServerUrl'], (res) => {
      let targetUrl = 'http://localhost:3000';
      const custom = res?.binoServerUrl || DEFAULT_WS;
      if (custom.includes('trycloudflare.com')) {
        targetUrl = custom.replace(/^wss?:\/\//, 'https://');
      }
      chrome.tabs.create({ url: targetUrl });
    });
  });
});
