// client/src/pages/ChatAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Mic, MicOff, Send, Scale, Loader,
  CheckCircle, Star, Mail, RefreshCw, Sparkles,
  ChevronRight, AlertCircle, FileText
} from 'lucide-react';
import axios from 'axios';

// ─── Constants ─────────────────────────────────────────────────────────────────
const BOT = 'bot';
const USER = 'user';

const CATEGORY_META = {
  family:   { icon: '👨‍👩‍👧', label: 'Family Law',    bg: '#dc2626' },
  property: { icon: '🏠', label: 'Property Law',   bg: '#d97706' },
  criminal: { icon: '⚖️', label: 'Criminal Law',   bg: '#7c2d12' },
  business: { icon: '💼', label: 'Business Law',   bg: '#1d4ed8' },
  labor:    { icon: '👷', label: 'Labour Law',     bg: '#166534' },
  consumer: { icon: '🛒', label: 'Consumer Law',   bg: '#7c3aed' },
  civil:    { icon: '📋', label: 'Civil Law',      bg: '#374151' },
  other:    { icon: '🔍', label: 'General',        bg: '#57534e' },
};

const QUICK_STARTS = [
  { text: 'My landlord is not returning my security deposit', category: 'property' },
  { text: 'I need help with divorce proceedings', category: 'family' },
  { text: 'My employer has not paid my salary for 3 months', category: 'labor' },
  { text: 'FIR has been filed against me and I need bail', category: 'criminal' },
  { text: 'I bought a defective product and want a refund', category: 'consumer' },
  { text: 'I have a money recovery dispute with someone', category: 'civil' },
];

export default function ChatAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const [caseSummary, setCaseSummary] = useState(null);
  const [caseSubmitted, setCaseSubmitted] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [phase, setPhase] = useState('greeting');
  const [chatHistory, setChatHistory] = useState([]);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState('');

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message on mount
  useEffect(() => {
    setTimeout(() => {
      pushBot(
        "Namaste! 🙏 I'm your CaseBridge legal assistant, powered by AI.\n\nTell me your legal issue in your own words, or pick a common situation below to get started quickly.",
        'greeting'
      );
    }, 300);

    // If navigated from voice assistant with a transcript
    if (location.state?.transcript) {
      setTimeout(() => startChat(location.state.transcript), 1200);
    }
  }, []);

  // ─── Message helpers ────────────────────────────────────────────────────────
  const pushBot = (text, type = 'text', extra = {}) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), role: BOT, text, type, ...extra, ts: new Date() },
    ]);
  };

  const pushUser = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), role: USER, text, ts: new Date() },
    ]);
  };

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  // ─── Start chat ─────────────────────────────────────────────────────────────
  const startChat = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushUser(trimmed);
    setInputText('');
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/chat/start', { message: trimmed, language: 'en' }, { headers: authHeader() });
      const { reply, question, sessionData: sd, category: cat } = res.data;

      setSessionData(sd);
      setCategory(cat);
      setPhase('questions');
      setChatHistory([{ role: 'user', content: trimmed }, { role: 'assistant', content: reply }]);

      pushBot(reply, 'text', { category: cat });
      setTimeout(() => pushBot(question.text, 'question', { options: question.options, qIndex: question.index, qTotal: question.total }), 700);
    } catch (err) {
      setError('Connection failed. Make sure the server is running.');
      pushBot("I'm having trouble connecting right now. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Handle option selection ─────────────────────────────────────────────────
  const selectOption = async (option) => {
    if (isLoading || isComplete) return;
    pushUser(option);
    setIsLoading(true);

    try {
      const res = await axios.post('/api/chat/answer', { answer: option, sessionData }, { headers: authHeader() });
      const { ack, question, sessionData: newSd, isComplete: done, summary, lawyers: lwyrs, caseSummary: cs } = res.data;

      setSessionData(newSd);
      setChatHistory((h) => [...h, { role: 'user', content: option }, { role: 'assistant', content: ack }]);

      if (ack) pushBot(ack, 'text');

      if (done) {
        setIsComplete(true);
        setPhase('complete');
        setLawyers(lwyrs || []);
        setCaseSummary(cs);
        setTimeout(() => pushBot(summary, 'summary'), 400);
        setTimeout(() => pushBot('', 'lawyers', { lawyerList: lwyrs || [], caseSum: cs }), 1000);
      } else {
        setTimeout(() => pushBot(question.text, 'question', { options: question.options, qIndex: question.index, qTotal: question.total }), 500);
      }
    } catch (err) {
      pushBot("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Free-text send ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    if (phase === 'greeting') { await startChat(text); return; }

    pushUser(text);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await axios.post(
        '/api/chat/freetext',
        { message: text, history: chatHistory, category: sessionData?.category || 'other', language: 'en' },
        { headers: authHeader() }
      );
      setChatHistory((h) => [...h, { role: 'user', content: text }, { role: 'assistant', content: res.data.reply }]);
      pushBot(res.data.reply);
    } catch {
      pushBot("I'm having trouble answering that right now. Please try rephrasing.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Submit case ─────────────────────────────────────────────────────────────
  const submitCase = async () => {
    if (!caseSummary || caseSubmitted) return;
    setIsLoading(true);
    try {
      const res = await axios.post(
        '/api/chat/submit-case',
        { caseSummary, selectedLawyerId },
        { headers: authHeader() }
      );
      setCaseSubmitted(true);
      setSubmittedCase(res.data.case);
      setPhase('submitted');
      pushBot('', 'success', { caseData: res.data.case, selectedLawyerId });
    } catch {
      pushBot("Failed to submit your case. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Voice ──────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribeAudio(new Blob(audioChunksRef.current, { type: mimeType }), mimeType);
      };
      mr.start(250);
      setIsRecording(true);
      setRecordingSecs(0);
      timerRef.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone permission in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const transcribeAudio = async (blob, mimeType) => {
    setIsTranscribing(true);
    try {
      const fd = new FormData();
      fd.append('audio', blob, `rec.${mimeType.includes('webm') ? 'webm' : 'ogg'}`);
      fd.append('language', 'en');
      const res = await axios.post('/api/cases/transcribe', fd, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      if (res.data.transcript) setInputText(res.data.transcript);
    } catch {
      setError('Voice transcription failed. Please type your query instead.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionData(null);
    setIsComplete(false);
    setLawyers([]);
    setSelectedLawyerId(null);
    setCaseSummary(null);
    setCaseSubmitted(false);
    setSubmittedCase(null);
    setPhase('greeting');
    setChatHistory([]);
    setCategory(null);
    setError('');
    setTimeout(() => pushBot(
      "Namaste! 🙏 I'm your CaseBridge legal assistant. How can I help you today?",
      'greeting'
    ), 200);
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  const BotAvatar = () => (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #b45309, #292524)' }}>
      <Scale className="w-4 h-4 text-white" />
    </div>
  );

  const UserAvatar = () => (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-stone-700 text-white text-xs font-bold">
      U
    </div>
  );

  const ProgressDots = ({ current, total }) => (
    <div className="flex items-center gap-1.5 mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= current ? 'bg-amber-500 w-6' : 'bg-stone-200 w-4'}`} />
      ))}
      <span className="text-xs text-stone-400 ml-1">{current + 1}/{total}</span>
    </div>
  );

  // ─── Message renderers ───────────────────────────────────────────────────────
  const renderMessage = (msg) => {
    const isBot = msg.role === BOT;

    // ── Greeting with quick starts
    if (msg.type === 'greeting' && isBot) {
      return (
        <div key={msg.id} className="flex gap-3 mb-5" style={{ animation: 'fadeUp 0.4s ease' }}>
          <BotAvatar />
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-stone-100 mb-3">
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
            </div>
            <div className="space-y-2">
              {QUICK_STARTS.map((qs, i) => (
                <button key={i} onClick={() => startChat(qs.text)}
                  className="w-full text-left px-4 py-3 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl text-sm text-stone-700 transition-all duration-200 flex items-center gap-3 group shadow-sm">
                  <span className="text-xl flex-shrink-0">{CATEGORY_META[qs.category]?.icon}</span>
                  <span className="flex-1">{qs.text}</span>
                  <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── Guided question with option buttons
    if (msg.type === 'question' && isBot) {
      return (
        <div key={msg.id} className="flex gap-3 mb-5" style={{ animation: 'fadeUp 0.4s ease' }}>
          <BotAvatar />
          <div className="flex-1 max-w-md">
            <ProgressDots current={msg.qIndex} total={msg.qTotal} />
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-stone-100 mb-3">
              <p className="text-stone-800 text-sm font-medium leading-relaxed">{msg.text}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(msg.options || []).map((opt, i) => (
                <button key={i} onClick={() => selectOption(opt)} disabled={isLoading}
                  className="w-full text-left px-4 py-3 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-400 rounded-xl text-sm text-stone-700 transition-all duration-150 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── AI summary card after all questions
    if (msg.type === 'summary' && isBot) {
      return (
        <div key={msg.id} className="flex gap-3 mb-4" style={{ animation: 'fadeUp 0.4s ease' }}>
          <BotAvatar />
          <div className="max-w-md bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">AI Legal Analysis</span>
            </div>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
          </div>
        </div>
      );
    }

    // ── Lawyer recommendation cards
    if (msg.type === 'lawyers' && isBot) {
      return (
        <div key={msg.id} className="flex gap-3 mb-4" style={{ animation: 'fadeUp 0.4s ease' }}>
          <BotAvatar />
          <div className="flex-1 max-w-md">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-stone-800 mb-1">Matched Lawyers for Your Case</p>
              <p className="text-xs text-stone-400 mb-4">Select a lawyer then submit your case</p>

              {(msg.lawyerList || []).length > 0 ? (
                <div className="space-y-3 mb-4">
                  {(msg.lawyerList || []).map((l) => (
                    <button key={l._id} onClick={() => setSelectedLawyerId(l._id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedLawyerId === l._id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-stone-100 hover:border-amber-200 bg-stone-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: 'linear-gradient(135deg, #b45309, #292524)' }}>
                          {l.name?.charAt(0) || 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate">{l.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-stone-500">{(l.rating || 4.5).toFixed(1)} · {l.reviewCount || 0} reviews</span>
                          </div>
                        </div>
                        {selectedLawyerId === l._id && <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(l.specializations || []).slice(0, 3).map((s, i) => (
                          <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 mt-1 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />{l.email}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 mb-4">No specialist lawyers registered yet — a lawyer will be assigned after submission.</p>
              )}

              <button onClick={submitCase} disabled={isLoading || caseSubmitted}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: caseSubmitted ? '#6b7280' : 'linear-gradient(135deg, #b45309, #78350f)' }}>
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {caseSubmitted ? 'Case Submitted' : selectedLawyerId ? 'Submit Case & Connect with Lawyer' : 'Submit Case'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── Success card
    if (msg.type === 'success' && isBot) {
      return (
        <div key={msg.id} className="flex gap-3 mb-4" style={{ animation: 'fadeUp 0.4s ease' }}>
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-green-500">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div className="max-w-md bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-green-800 mb-1">Case Submitted Successfully!</p>
            {msg.caseData && (
              <div className="bg-white rounded-lg px-3 py-2 mb-3 border border-green-100">
                <p className="text-xs text-stone-500">Case Number</p>
                <p className="text-sm font-bold text-stone-800">{msg.caseData.caseNumber}</p>
              </div>
            )}
            <p className="text-sm text-green-700 mb-3">
              {msg.selectedLawyerId
                ? 'Your selected lawyer has been notified and will contact you soon.'
                : 'A suitable lawyer will be assigned to your case shortly.'}
            </p>
            <button onClick={() => navigate('/client-dashboard')}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              View on Dashboard
            </button>
          </div>
        </div>
      );
    }

    // ── Default bot message
    if (isBot) {
      return (
        <div key={msg.id} className="flex gap-3 mb-4" style={{ animation: 'fadeUp 0.4s ease' }}>
          <BotAvatar />
          <div className="max-w-md bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
            {msg.category && CATEGORY_META[msg.category] && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: CATEGORY_META[msg.category].bg }}>
                {CATEGORY_META[msg.category].icon} {CATEGORY_META[msg.category].label}
              </span>
            )}
          </div>
        </div>
      );
    }

    // ── User message
    return (
      <div key={msg.id} className="flex gap-3 mb-4 justify-end" style={{ animation: 'fadeUp 0.3s ease' }}>
        <div className="max-w-sm rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-white text-sm leading-relaxed"
          style={{ background: 'linear-gradient(135deg, #92400e, #1c1917)' }}>
          {msg.text}
        </div>
        <UserAvatar />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen" style={{ background: '#f6f4f0', fontFamily: "'Lora', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 2px; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b border-stone-200"
        style={{ background: '#1c1917', color: 'white' }}>
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #d97706, #92400e)' }}>
          <Scale className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-white text-base">CaseBridge AI</h1>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ animation: 'pulse 2s infinite' }} />
              Online
            </span>
          </div>
          <p className="text-xs text-stone-400 truncate">
            {phase === 'greeting' && 'Legal Assistant · Powered by Ollama AI + Whisper'}
            {phase === 'questions' && `${CATEGORY_META[category]?.icon || '⚖️'} ${CATEGORY_META[category]?.label || 'Legal'} · Gathering your case details`}
            {phase === 'complete' && '✅ Analysis complete · Select a lawyer & submit'}
            {phase === 'submitted' && '🎉 Case submitted — check your dashboard'}
          </p>
        </div>

        <button onClick={resetChat} title="New conversation"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4 text-stone-400" />
        </button>
      </header>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(180,83,9,0.04) 0%, transparent 60%), radial-gradient(circle at 75% 75%, rgba(120,113,108,0.04) 0%, transparent 60%)' }}>
        <div className="max-w-xl mx-auto">

          {messages.map(renderMessage)}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-4" style={{ animation: 'fadeUp 0.3s ease' }}>
              <BotAvatar />
              <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <div key={delay} className="w-2 h-2 rounded-full bg-amber-400"
                      style={{ animation: `bounce 1s ${delay}ms infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      {phase !== 'submitted' && (
        <div className="flex-shrink-0 border-t border-stone-200 px-4 py-3 bg-white">
          <div className="max-w-xl mx-auto">
            {/* Recording status */}
            {isRecording && (
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500" style={{ animation: 'pulse 1s infinite' }} />
                <span className="text-xs text-red-600 font-medium">Recording {fmtTime(recordingSecs)} — click mic to stop</span>
              </div>
            )}
            {isTranscribing && (
              <div className="flex items-center gap-2 mb-2">
                <Loader className="w-3 h-3 text-amber-600 animate-spin" />
                <span className="text-xs text-amber-600 font-medium">Whisper is transcribing your voice...</span>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Mic button */}
              <button onClick={isRecording ? stopRecording : startRecording} disabled={isTranscribing}
                className={`p-3 rounded-xl transition-all flex-shrink-0 ${isRecording ? 'bg-red-500 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'} disabled:opacity-40`}
                style={isRecording ? { animation: 'pulse 1.5s infinite' } : {}}>
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text input */}
              <textarea ref={inputRef} value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKey} disabled={isLoading || isRecording || isTranscribing} rows={1}
                placeholder={
                  phase === 'greeting' ? 'Describe your legal issue in your own words...' :
                  phase === 'questions' ? 'Type your own answer, or click an option above...' :
                  'Ask anything about your case...'
                }
                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 resize-none disabled:opacity-40"
                style={{ maxHeight: 120, overflowY: 'auto', focusRingColor: '#d97706' }}
              />

              {/* Send button */}
              <button onClick={handleSend} disabled={!inputText.trim() || isLoading || isRecording}
                className="p-3 rounded-xl text-white transition-all flex-shrink-0 disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #b45309, #78350f)' }}>
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-center text-xs text-stone-400 mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by Ollama AI + Whisper · Not a substitute for professional legal advice
            </p>
          </div>
        </div>
      )}
    </div>
  );
}