/**
 * Project Bino - Real-Time Telemetry & Dashboard Server
 * Express + WebSocket Ingestion Pipeline running on port 3000
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Enable CORS for Chrome Extension communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve compiled React dashboard production assets
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// In-Memory Telemetry State
// Map<studentId, StudentData>
const roster = new Map();

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

// Broadcast to dashboard clients
function broadcastToDashboards(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isDashboard) {
      client.send(message);
    }
  });
}

// Broadcast to extension clients
function broadcastToExtensions(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isExtension) {
      client.send(message);
    }
  });
}

function getRosterArray() {
  return Array.from(roster.values());
}

// Sync entire roster with all connected dashboard clients
function syncRoster() {
  broadcastToDashboards({
    type: 'ROSTER_SYNC',
    roster: getRosterArray(),
  });
}

// Real-Time Disconnection Watchdog (6 seconds after heartbeats stop)
setInterval(() => {
  const now = Date.now();
  let changed = false;

  roster.forEach((student, id) => {
    if (student.status !== 'disconnected' && now - student.lastSeen > 6000) {
      student.status = 'disconnected';
      student.wifiHealth = 'poor';
      if (!student.history) student.history = [];
      student.history.push({
        time: formatTime(),
        status: 'disconnected',
        label: 'Heartbeat timeout / Left call',
      });
      changed = true;
      console.log(`[Bino Watchdog] Student ${student.name} marked DISCONNECTED (heartbeat lapsed).`);
    }
  });

  if (changed) {
    syncRoster();
  }
}, 2000);

// WebSocket Ingestion & PubSub
wss.on('connection', (ws) => {
  ws.isDashboard = false;
  ws.isExtension = false;

  console.log('[Bino WebSocket] New client connected.');

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);

      // Client Handshakes
      if (data.type === 'DASHBOARD_CONNECT') {
        ws.isDashboard = true;
        console.log('[Bino WebSocket] Dashboard client registered.');
        ws.send(JSON.stringify({ type: 'ROSTER_SYNC', roster: getRosterArray() }));
        return;
      }

      if (data.type === 'RESET_ROSTER') {
        console.log('[Bino WebSocket] Clearing roster upon request.');
        roster.clear();
        syncRoster();
        return;
      }

      if (data.type === 'EXTENSION_CONNECT') {
        ws.isExtension = true;
        console.log('[Bino WebSocket] Chrome Extension worker registered.');
        return;
      }

      // Instructor Ping dispatched from Dashboard
      if (data.type === 'PING_STUDENT') {
        console.log(`[Bino Ping] Dispatched ping to student: ${data.studentName} (${data.studentId})`);
        broadcastToExtensions({
          type: 'PING_ALERT',
          studentId: data.studentId,
          studentName: data.studentName,
        });
        return;
      }

      // Student Telemetry Events from Extension
      if (data.type === 'STUDENT_JOIN' || data.type === 'HEARTBEAT' || data.type === 'STATUS_CHANGE') {
        const studentInfo = data.student;
        if (!studentInfo || !studentInfo.id) return;

        let existing = roster.get(studentInfo.id);

        if (!existing) {
          existing = {
            id: studentInfo.id,
            name: studentInfo.name || 'Student Attendee',
            email: studentInfo.email || 'attendee@gmail.com',
            status: studentInfo.status || 'active',
            wifiHealth: studentInfo.wifiHealth || 'stable',
            engagement: studentInfo.engagement || 95,
            duration: studentInfo.duration || '00:00:01',
            lastSeen: Date.now(),
            history: [
              {
                time: formatTime(),
                status: studentInfo.status || 'active',
                label: 'Entered Google Meet session',
              },
            ],
          };
          roster.set(studentInfo.id, existing);
          console.log(`[Bino Telemetry] Student JOINED: ${existing.name} (${existing.email})`);
        } else {
          // Update telemetry attributes
          existing.name = studentInfo.name || existing.name;
          existing.email = studentInfo.email || existing.email;
          existing.duration = studentInfo.duration || existing.duration;
          existing.wifiHealth = studentInfo.wifiHealth || existing.wifiHealth;
          existing.engagement = studentInfo.engagement || existing.engagement;
          existing.lastSeen = Date.now();

          // Handle status update
          if (studentInfo.status && studentInfo.status !== existing.status) {
            existing.status = studentInfo.status;
            const historyEntry = studentInfo.historyEntry || {
              time: formatTime(),
              status: studentInfo.status,
              label: `Status morphed to ${studentInfo.status}`,
            };
            existing.history.push(historyEntry);
            console.log(`[Bino Telemetry] Status morph: ${existing.name} -> ${existing.status}`);
          }
        }

        syncRoster();
      }

      if (data.type === 'STUDENT_LEAVE') {
        const studentInfo = data.student;
        if (studentInfo && roster.has(studentInfo.id)) {
          const student = roster.get(studentInfo.id);
          student.status = 'disconnected';
          student.history.push({
            time: formatTime(),
            status: 'disconnected',
            label: 'Exited Google Meet call',
          });
          console.log(`[Bino Telemetry] Student LEFT call: ${student.name}`);
          syncRoster();
        }
      }
    } catch (err) {
      console.error('[Bino WebSocket] Error handling message:', err);
    }
  });

  ws.on('close', () => {
    // Client disconnected
  });
});

// REST API Endpoints
app.get('/api/roster', (req, res) => {
  res.json({
    success: true,
    count: roster.size,
    roster: getRosterArray(),
  });
});

// Manual telemetry injection endpoint (for curl / testing)
app.post('/api/telemetry', (req, res) => {
  const { id, name, email, status, wifiHealth, engagement, duration } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing student id' });

  let existing = roster.get(id);
  if (!existing) {
    existing = {
      id,
      name: name || 'Student Attendee',
      email: email || 'attendee@gmail.com',
      status: status || 'active',
      wifiHealth: wifiHealth || 'stable',
      engagement: engagement || 90,
      duration: duration || '00:05:00',
      lastSeen: Date.now(),
      history: [{ time: formatTime(), status: status || 'active', label: 'Telemetry REST injection' }],
    };
    roster.set(id, existing);
  } else {
    if (status && status !== existing.status) {
      existing.history.push({
        time: formatTime(),
        status,
        label: `REST status updated to ${status}`,
      });
      existing.status = status;
    }
    if (name) existing.name = name;
    if (email) existing.email = email;
    if (wifiHealth) existing.wifiHealth = wifiHealth;
    if (engagement !== undefined) existing.engagement = engagement;
    if (duration) existing.duration = duration;
    existing.lastSeen = Date.now();
  }

  syncRoster();
  res.json({ success: true, student: existing });
});

// Reset endpoint
app.post('/api/reset', (req, res) => {
  roster.clear();
  syncRoster();
  res.json({ success: true, message: 'Roster cleared.' });
});

// Fallback all routes to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🦖 Project Bino Telemetry Server & Dashboard`);
  console.log(`  -----------------------------------------------------`);
  console.log(`  Dashboard URL : http://localhost:${PORT}`);
  console.log(`  WebSocket URL : ws://localhost:${PORT}`);
  console.log(`  Extension Dir : ${path.join(__dirname, 'bino-extension')}`);
  console.log(`=======================================================`);
});

