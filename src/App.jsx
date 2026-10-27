import React, { useState, useEffect, useRef } from 'react';
import DinoMascot from './components/DinoMascot';
import MetricsRow from './components/MetricsRow';
import ControlsBar from './components/ControlsBar';
import RosterTable from './components/RosterTable';
import {
  Eye,
  Wifi,
  Search,
  UserCheck,
  Activity,
  AlertTriangle,
  Radio,
  LogOut,
  MoreHorizontal,
  Bell,
  Sparkles,
  X,
  Download,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';

// Sample participant dataset for live telemetry demo
const SAMPLE_STUDENTS = [
  {
    id: 'student-sophiam',
    name: 'Sophia Martinez',
    email: 'smartinez@gmail.com',
    status: 'active',
    duration: '00:42:15',
    wifiHealth: 'stable',
    engagement: 95,
    history: [
      { time: '10:02 AM', status: 'active', label: 'Joined Google Meet session' },
      { time: '10:20 AM', status: 'idle', label: 'Brief camera stillness' },
      { time: '10:25 AM', status: 'active', label: 'Participating in discussion' },
    ],
  },
  {
    id: 'student-alexanderc',
    name: 'Alexander Chen',
    email: 'alex.chen99@gmail.com',
    status: 'unfocused',
    duration: '00:38:40',
    wifiHealth: 'fair',
    engagement: 62,
    history: [
      { time: '10:05 AM', status: 'active', label: 'Entered meeting room' },
      { time: '10:15 AM', status: 'unfocused', label: 'Switched tabs / minimized Meet' },
      { time: '10:32 AM', status: 'idle', label: 'No keystrokes or mouse activity' },
      { time: '10:48 AM', status: 'unfocused', label: 'Switched away from Google Meet' },
    ],
  },
  {
    id: 'student-emilyw',
    name: 'Emily Watson',
    email: 'emily.watson.edu@gmail.com',
    status: 'idle',
    duration: '00:35:12',
    wifiHealth: 'stable',
    engagement: 48,
    history: [
      { time: '10:08 AM', status: 'active', label: 'Joined room' },
      { time: '10:22 AM', status: 'idle', label: 'Idle for > 20s without interaction' },
    ],
  },
  {
    id: 'student-marcusb',
    name: 'Marcus Brody',
    email: 'mbrody.dev@gmail.com',
    status: 'disconnected',
    duration: '00:18:22',
    wifiHealth: 'poor',
    engagement: 25,
    history: [
      { time: '10:01 AM', status: 'active', label: 'Joined class' },
      { time: '10:19 AM', status: 'disconnected', label: 'Heartbeat timeout / socket closed' },
    ],
  },
];

export default function App() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isMeetingEnded, setIsMeetingEnded] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const wsRef = useRef(null);

  // Live Timer for "Time in Meet: HH:MM:SS" (stops when meeting ends)
  useEffect(() => {
    if (isMeetingEnded) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isMeetingEnded]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((val) => String(val).padStart(2, '0'))
      .join(':');
  };

  // Connect to WebSocket backend server (ws://localhost:3000)
  useEffect(() => {
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      const wsUrl = isLocal ? `${protocol}//${host}:3000` : `${protocol}//${host}`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsWsConnected(true);
          socket.send(JSON.stringify({ type: 'DASHBOARD_CONNECT' }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ROSTER_SYNC') {
              setStudents(data.roster || []);
            } else if (data.type === 'STUDENT_EVENT') {
              setStudents((prev) => {
                const existingIndex = prev.findIndex((s) => s.id === data.student.id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = { ...updated[existingIndex], ...data.student };
                  return updated;
                } else {
                  return [...prev, data.student];
                }
              });
            } else if (data.type === 'NOTIFICATION') {
              setToastMessage({
                title: data.title,
                description: data.description,
              });
            }
          } catch (err) {
            console.error('Error handling WebSocket message:', err);
          }
        };

        socket.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = () => {
          setIsWsConnected(false);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  // Ping student action
  const handlePingStudent = (student) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'PING_STUDENT',
          studentId: student.id,
          studentName: student.name,
        })
      );
    }

    setToastMessage({
      title: `Ping Dispatched to ${student.name}`,
      description: `Attention prompt forwarded to student's Google Meet tab.`,
    });
  };

  // Testing helpers to simulate live attendees
  const handleInjectSample = () => {
    setStudents(SAMPLE_STUDENTS);
    setToastMessage({
      title: 'Sample Telemetry Injected',
      description: 'Loaded 4 mock participants with active, idle, unfocused, and disconnected states.',
    });
  };

  const handleResetEmpty = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'RESET_ROSTER' }));
    }
    setStudents([]);
    setSearchQuery('');
    setActiveFilter('all');
    setToastMessage({
      title: 'Reset to Empty State',
      description: 'Cleared waiting container and server roster before attendees join.',
    });
  };

  // CSV Report Generator
  const downloadCSVReport = () => {
    const headers = ['Student Name', 'Gmail', 'Final Status', 'Engagement %', 'Wi-Fi Health', 'Duration', 'Activity History'];
    const rows = students.map((s) => {
      const historyStr = (s.history || []).map((h) => `[${h.time}] ${h.status}: ${h.label}`).join('; ');
      return [
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${s.status || 'active'}"`,
        `"${s.engagement || 0}%"`,
        `"${s.wifiHealth || 'stable'}"`,
        `"${s.duration || '00:00:00'}"`,
        `"${historyStr.replace(/"/g, '""')}"`,
      ];
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US');
    const timeStr = now.toLocaleTimeString('en-US');

    const metaRows = [
      ['Project Bino - Google Meet Telemetry & Attendance Summary Report'],
      [`Date & Time:`, `"${dateStr} ${timeStr}"`],
      [`Total Meeting Duration:`, `"${formatTimer(secondsElapsed)}"`],
      [`Total Attendees Tracked:`, `"${students.length}"`],
      [`Active Attendees:`, `"${activeCount}"`],
      [`Flagged (Idle/Unfocused):`, `"${flaggedCount}"`],
      [`Disconnections:`, `"${dropsCount}"`],
      [`Average Focus Engagement:`, `"${totalEnrolled > 0 ? Math.round(students.reduce((acc, curr) => acc + (curr.engagement || 0), 0) / totalEnrolled) : 0}%"`],
      [],
      headers,
      ...rows,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + metaRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bino_Meeting_Summary_${now.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEndMeetAndSummary = () => {
    setIsMeetingEnded(true);
    setIsSummaryOpen(true);
    downloadCSVReport();
    setToastMessage({
      title: 'Meeting Concluded & Summary Downloaded',
      description: 'Downloaded attendance CSV and compiled AI focus telemetry report.',
    });
  };

  const handleStartNewMeeting = () => {
    handleResetEmpty();
    setSecondsElapsed(0);
    setIsMeetingEnded(false);
    setIsSummaryOpen(false);
  };

  // Metrics calculations
  const totalEnrolled = students.length;
  const presentCount = students.filter((s) => s.status !== 'disconnected').length;
  const activeCount = students.filter((s) => s.status === 'active').length;
  const flaggedCount = students.filter(
    (s) => s.status === 'idle' || s.status === 'unfocused'
  ).length;
  const dropsCount = students.filter((s) => s.status === 'disconnected').length;

  const counts = {
    all: students.length,
    active: activeCount,
    idle: students.filter((s) => s.status === 'idle').length,
    unfocused: students.filter((s) => s.status === 'unfocused').length,
    disconnected: dropsCount,
  };

  // Filter and search
  const filteredStudents = students.filter((student) => {
    if (activeFilter !== 'all' && student.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = student.name?.toLowerCase().includes(q);
      const matchEmail = student.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#3B5570] via-[#49676C] to-[#88A4A7] flex flex-col items-center justify-start p-4 md:p-6 font-sans">
      {/* Top Telemetry Link & Simulation Ribbon */}
      <div className="w-full max-w-[1440px] mb-3 flex items-center justify-between px-5 py-2.5 bg-[#3B5570]/70 backdrop-blur-md rounded-2xl border border-white/20 text-white text-[14px] select-none shadow-md">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              isWsConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="font-bold text-white tracking-wide">
            Project Bino Telemetry Pipeline
          </span>
          <span className="text-white/70">
            • {isWsConnected ? 'Server Connected (port 3000)' : 'Listening for Server...'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {students.length === 0 ? (
            <button
              onClick={handleInjectSample}
              className="px-3.5 py-1.5 bg-[#88A4A7] hover:bg-[#88A4A7]/90 active:scale-95 text-white font-bold text-[13px] rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              title="Preview populated data rows"
            >
              <PlusCircle size={15} />
              <span>Simulate Attendees Joining</span>
            </button>
          ) : (
            <button
              onClick={handleResetEmpty}
              className="px-3.5 py-1.5 bg-[#7A3A65] hover:bg-[#8E4877] active:scale-95 text-white font-bold text-[13px] rounded-xl border border-white/20 flex items-center gap-1.5 transition-all shadow-md"
              title="Return to clean empty state"
            >
              <RotateCcw size={15} />
              <span>Reset to Empty Waiting State</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 1440x900px Desktop UI Layout - Signature Soft Pink Gradient */}
      <div className="w-full max-w-[1440px] min-h-[900px] bg-gradient-to-br from-[#c8819c] to-[#E79DB0] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-[#8F84AE]/40 flex flex-col overflow-hidden relative">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 right-8 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
            <div className="bg-[#7A3A65] border-2 border-white/25 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white leading-tight">
                  {toastMessage.title}
                </p>
                <p className="text-[12px] text-white/80 mt-0.5">
                  {toastMessage.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Top Header Bar (Height 60px, px-8) */}
        <header className="h-[60px] flex items-center justify-between px-8 select-none border-b border-[#8F84AE]/25 bg-[#7A3A65]/25 backdrop-blur-sm">
          {/* Left: 36px Dino Mascot + "Bino" + LIVE badge */}
          <div className="flex items-center gap-3">
            <div className="drop-shadow-sm">
              <DinoMascot variant="active" size={36} />
            </div>
            <span className="text-[30px] font-extrabold text-white tracking-tight leading-none font-sans drop-shadow-sm">
              Bino
            </span>

            {/* LIVE / CONCLUDED Badge */}
            <div className={`flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full border shadow-inner ${
              isMeetingEnded
                ? 'bg-amber-900/60 border-amber-500/50 text-amber-300'
                : 'bg-[#3B5570]/70 border-[#88A4A7]/50 text-emerald-300'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                {!isMeetingEnded && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isMeetingEnded ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                }`} />
              </span>
              <span className="text-[14px] font-extrabold tracking-wider uppercase leading-none font-sans">
                {isMeetingEnded ? 'CONCLUDED' : 'LIVE'}
              </span>
            </div>
          </div>

          {/* Right: Meeting duration + Action button */}
          <div className="flex items-center gap-4">
            <div className="text-[20px] font-bold text-white tracking-wide drop-shadow-sm font-mono">
              Time in Meet: {formatTimer(secondsElapsed)}
            </div>

            <button
              onClick={handleEndMeetAndSummary}
              className="h-[44px] bg-[#7A3A65] hover:bg-[#8E4877] active:scale-[0.98] border border-[#8F84AE] text-[19px] font-bold text-white rounded-xl px-4 flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#8F84AE] cursor-pointer"
            >
              <LogOut size={20} className="text-[#8F84AE]" />
              <span>{isMeetingEnded ? 'View Summary & Export' : 'End Meet & Auto-Generate Summary'}</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col py-6 space-y-4">
          {/* 2. Summary Metrics Row (grid-cols-4 gap-4 px-8 mt-4) */}
          <MetricsRow
            presentCount={presentCount}
            totalEnrolled={totalEnrolled}
            activeCount={activeCount}
            flaggedCount={flaggedCount}
            dropsCount={dropsCount}
          />

          {/* 3. Controls Bar (flex px-8 mt-4) */}
          <ControlsBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />

          {/* 4. Live Roster Table Container (px-8 mt-4) */}
          <div className="flex-1 flex flex-col">
            <RosterTable
              students={filteredStudents}
              onPingStudent={handlePingStudent}
            />
          </div>
        </div>
      </div>

      {/* Auto-Generate Summary Modal */}
      {isSummaryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none p-4"
          onClick={() => setIsSummaryOpen(false)}
        >
          <div
            className="w-full max-w-[580px] bg-[#3B5570] border-2 border-white/25 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-[#49676C]/40">
              <div className="flex items-center gap-3">
                <DinoMascot variant="active" size={36} />
                <div>
                  <h3 className="text-[20px] font-extrabold text-white leading-none">
                    Meeting Summary Report
                  </h3>
                  <p className="text-[13px] text-white/70 mt-1">
                    Auto-generated by Project Bino Telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSummaryOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-white">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#49676C]/40 border border-white/15 rounded-xl p-3 text-center shadow-inner">
                  <span className="text-[12px] uppercase font-bold text-white/70">
                    Total Duration
                  </span>
                  <p className="text-[22px] font-extrabold text-white mt-1 font-mono">
                    {formatTimer(secondsElapsed)}
                  </p>
                </div>

                <div className="bg-[#49676C]/40 border border-white/15 rounded-xl p-3 text-center shadow-inner">
                  <span className="text-[12px] uppercase font-bold text-white/70">
                    Avg Engagement
                  </span>
                  <p className="text-[22px] font-extrabold text-emerald-300 mt-1">
                    {totalEnrolled > 0
                      ? Math.round(
                          students.reduce((acc, curr) => acc + (curr.engagement || 0), 0) /
                            totalEnrolled
                        )
                      : 0}
                    %
                  </p>
                </div>

                <div className="bg-[#49676C]/40 border border-white/15 rounded-xl p-3 text-center shadow-inner">
                  <span className="text-[12px] uppercase font-bold text-white/70">
                    Attendees
                  </span>
                  <p className="text-[22px] font-extrabold text-white mt-1">
                    {totalEnrolled}
                  </p>
                </div>
              </div>

              <div className="bg-[#7A3A65]/40 border border-white/15 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-[15px] mb-2">
                  <Sparkles size={18} />
                  <span>AI Focus & Telemetry Insights</span>
                </div>
                <p className="text-[14px] text-white/80 leading-relaxed font-medium">
                  {totalEnrolled === 0
                    ? 'Meeting concluded in waiting state. No student telemetry recorded.'
                    : `Tracked ${totalEnrolled} participants. ${activeCount} active participants logged. ${flaggedCount} attention drops flagged. Real-time Wi-Fi stability and activity logs archived.`}
                </p>
              </div>

              <div className="flex items-center justify-between text-[13px] px-1 text-white/80 font-medium">
                <span>Active: <strong className="text-white">{activeCount}</strong></span>
                <span>Flagged: <strong className="text-white">{flaggedCount}</strong></span>
                <span>Disconnections: <strong className="text-white">{dropsCount}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-[#49676C]/40 border-t border-white/20">
              <button
                onClick={handleStartNewMeeting}
                className="px-4 py-2 rounded-xl text-[14px] font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
                title="Clear current attendance and start tracking a new meeting"
              >
                <RotateCcw size={15} />
                <span>Start New Session</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSummaryOpen(false)}
                  className="px-4 py-2 rounded-xl text-[15px] font-bold text-white/70 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={downloadCSVReport}
                  className="px-5 py-2.5 rounded-xl text-[15px] font-bold bg-[#88A4A7] hover:bg-[#88A4A7]/90 active:scale-95 text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Download size={18} />
                  <span>Download CSV Summary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
