import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Send, Globe, Volume2, Loader, Bot, User as UserIcon } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import nlpProcessor from '../utils/nlpProcessor';
import api from '../utils/axiosConfig';

export default function VoiceAssistantModal({ isOpen, onClose, onSubmitIssue }) {
    const {
        language,
        languages,
        changeLanguage,
        isListening,
        transcript,
        setTranscript,
        startListening,
        stopListening,
        speak,
    } = useAccessibility();

    // ── Tab: 'chat' (new chatbot) | 'submit' (original submit-issue flow) ──
    const [activeTab, setActiveTab]         = useState('chat');

    // ── Chat tab state ──
    const [chatHistory, setChatHistory]     = useState([]);
    const [chatInput, setChatInput]         = useState('');
    const [isSending, setIsSending]         = useState(false);
    const messagesEndRef                    = useRef(null);

    // ── Submit tab state (original) ──
    const [inputMethod, setInputMethod]     = useState('voice');
    const [issueDescription, setIssueDescription] = useState('');
    const [nlpAnalysis, setNlpAnalysis]     = useState(null);
    const [isAnalyzing, setIsAnalyzing]     = useState(false);

    // ── Sync voice transcript into whichever tab is active ──
    useEffect(() => {
        if (!transcript) return;
        if (activeTab === 'chat') {
            setChatInput(transcript);
        } else {
            setIssueDescription(transcript);
            analyzeText(transcript);
        }
    }, [transcript, activeTab]);

    // ── Auto-scroll chat ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // ────────────────────── CHAT TAB HANDLERS ────────────────────────────────

    const sendChatMessage = async (text) => {
        const trimmed = (text || '').trim();
        if (!trimmed || isSending) return;

        const userMsg = { role: 'user', content: trimmed };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');
        setTranscript('');
        setIsSending(true);

        try {
            const historyForServer = [...chatHistory, userMsg].map(m => ({
                role: m.role,
                content: m.content,
            }));

            const res = await api.post('/api/voice/chat', {
                message: trimmed,
                history: historyForServer,
                language,
            });

            if (res.data.success) {
                setChatHistory(prev => [...prev, { role: 'bot', content: res.data.response }]);
                speak(res.data.response.replace(/[*⚠️💡🔹]/g, ''));
            }
        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => [
                ...prev,
                { role: 'bot', content: 'Sorry, something went wrong. Please try again.' },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleChatSubmit = (e) => {
        if (e) e.preventDefault();
        sendChatMessage(chatInput);
    };

    const renderChatBubble = (msg, index) => {
        const isBot = msg.role === 'bot';
        const lines = msg.content.split('\n');

        return (
            <div key={index} className={`flex items-start gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-600' : 'bg-indigo-500'}`}>
                    {isBot ? <Bot className="w-4 h-4 text-white" /> : <UserIcon className="w-4 h-4 text-white" />}
                </div>
                <div className={`max-w-[85%] ${isBot ? 'items-start' : 'items-end'} flex flex-col`}>
                    <div className={`px-3 py-2 rounded-xl shadow-sm ${
                        isBot
                            ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none'
                    }`}>
                        {lines.map((line, i) => {
                            const boldMatch = line.match(/^\*\*(.+)\*\*$/);
                            if (boldMatch) return <p key={i} className="text-xs font-bold mb-0.5">{boldMatch[1]}</p>;
                            if (/^\s+\d+\./.test(line)) return <p key={i} className="text-xs ml-1">{line.trim()}</p>;
                            if (!line.trim()) return <div key={i} className="h-0.5" />;
                            return <p key={i} className="text-xs leading-relaxed">{line}</p>;
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // ────────────────────── SUBMIT TAB HANDLERS (original logic) ──────────────

    const analyzeText = (text) => {
        if (!text || text.length < 10) return;
        setIsAnalyzing(true);
        setTimeout(() => {
            const analysis = nlpProcessor.processVoiceQuery(text, language);
            setNlpAnalysis(analysis);
            setIsAnalyzing(false);
            if (analysis.detectedCategory && analysis.detectedCategory !== 'other') {
                const categoryNames = {
                    family: language === 'ta' ? 'குடும்ப சட்டம்' : 'Family Law',
                    property: language === 'ta' ? 'சொத்து சట்டம்' : 'Property Law',
                    criminal: language === 'ta' ? 'குற்றவியல் சட்டம்' : 'Criminal Law',
                    business: language === 'ta' ? 'வணிக சட்டம்' : 'Business Law',
                    civil: language === 'ta' ? 'சிவில் சட்டம்' : 'Civil Law',
                    labor: language === 'ta' ? 'தொழிலாள் சட்டம்' : 'Labor Law',
                    consumer: language === 'ta' ? 'நுகர்வור் சட்டம்' : 'Consumer Law',
                };
                const message = language === 'ta'
                    ? `இதி ${categoryNames[analysis.detectedCategory]} தொடர்பான பிரச்சினை என்று தெரிகிறது`
                    : `This appears to be a ${categoryNames[analysis.detectedCategory]} issue`;
                speak(message);
            }
        }, 500);
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
            speak(language === 'ta' ? 'உங்கள் சट்ட பிரச்சினையை கூறுங்கள்' : 'Please describe your legal issue');
        }
    };

    const handleSubmitIssue = () => {
        if (!issueDescription || issueDescription.trim().length < 20) {
            const message = language === 'ta'
                ? 'தயவுசெய்து உங்கள் பிரச்சினையை விரிவாக விவரிக்கவும்'
                : 'Please provide more details about your issue';
            speak(message);
            alert(message);
            return;
        }

        const submissionData = {
            description: issueDescription,
            detectedCategory: nlpAnalysis?.detectedCategory || 'other',
            priority: nlpAnalysis?.urgencyLevel || 'normal',
            submissionMethod: inputMethod,
            voiceTranscript: inputMethod === 'voice' ? issueDescription : null,
            nlpAnalysis,
            language,
        };

        onSubmitIssue(submissionData);
        speak(language === 'ta' ? 'உங்கள் பிரச்சினை சமர்ப்பிக்கப்பட்டது' : 'Your issue has been submitted');
        onClose();
    };

    const handleLanguageSwitch = () => {
        changeLanguage(language === 'en' ? 'ta' : 'en');
    };

    // ── Don't render if closed ──
    if (!isOpen) return null;

    // ── Labels ──
    const caseTypeLabels = {
        en: { family:'Family Law', property:'Property Law', criminal:'Criminal Law', business:'Business Law', civil:'Civil Law', labor:'Labor Law', consumer:'Consumer Law', other:'Other' },
        ta: { family:'குடும்ப சட்டம்', property:'சொத்து சட்டம்', criminal:'குற்றவியல் சட்டம்', business:'வணிக சட்டம்', civil:'சிவில் சட்டம்', labor:'தொழிலாள் சட்டம்', consumer:'நுகர்வור் சட்டம்', other:'மற்றவை' },
    };
    const priorityLabels = {
        en: { high: 'High Priority', normal: 'Normal Priority', low: 'Low Priority' },
        ta: { high: 'அதிக முன்னுரிமை', normal: 'சாதארண முன்னுரிமை', low: 'குறைந்த முன்னுரிமை' },
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {language === 'ta' ? 'குரல் உதவி' : 'Voice Assistant'}
                            </h2>
                            <p className="text-xs text-blue-100">
                                {language === 'ta' ? 'உங்கள் சட்ட பிரச்சினையை விவரிக்கவும்' : 'Describe your legal issue'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={handleLanguageSwitch} className="p-2 hover:bg-white/20 rounded-full transition-colors" title={language === 'ta' ? 'ஆங்கிலம்' : 'தமிழ்'}>
                            <Globe className="w-4 h-4 text-white" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* ── Tab switcher ── */}
                <div className="flex bg-gray-100 p-1 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        💬 {language === 'ta' ? 'சட்ట உரையாடி' : 'Legal Chat'}
                    </button>
                    <button
                        onClick={() => setActiveTab('submit')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'submit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        📋 {language === 'ta' ? 'விஷயம் சமர்ப்பிடுகிறேன்' : 'Submit Issue'}
                    </button>
                </div>

                {/* ── Body (scrollable) ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* ════════════ CHAT TAB ════════════ */}
                    {activeTab === 'chat' && (
                        <div className="flex flex-col p-4 gap-4" style={{ minHeight: '300px' }}>
                            {/* Empty state */}
                            {chatHistory.length === 0 && (
                                <div className="text-center py-6">
                                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bot className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {language === 'ta' ? 'ஒரு சட்ட கேள்வி கேளுங்கள்' : 'Ask a legal question'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {language === 'ta' ? 'உங்கள் குழப்பத்தை தெரிஞ்சுக்குங்க' : 'I\'ll help you understand your situation'}
                                    </p>
                                </div>
                            )}

                            {/* Bubbles */}
                            <div className="flex flex-col gap-3 flex-1">
                                {chatHistory.map((msg, i) => renderChatBubble(msg, i))}

                                {/* Typing indicator */}
                                {isSending && (
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none px-3 py-2 shadow-sm">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Mic button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={handleMicClick}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                        isListening
                                            ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    }`}
                                >
                                    {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                                </button>
                            </div>

                            {/* Text input + Send */}
                            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleChatSubmit(); } }}
                                    placeholder={language === 'ta' ? 'ஒரு கேள்வி கேளுங்க…' : 'Type a question…'}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isSending}
                                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
                                >
                                    {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ════════════ SUBMIT TAB (original UI, unchanged) ════════════ */}
                    {activeTab === 'submit' && (
                        <div className="p-6 space-y-5">
                            {/* Input method toggle */}
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                                <button onClick={() => setInputMethod('voice')} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${inputMethod === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                                    <Mic className="w-4 h-4 inline mr-1" />{language === 'ta' ? 'குரல்' : 'Voice'}
                                </button>
                                <button onClick={() => setInputMethod('text')} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${inputMethod === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                                    {language === 'ta' ? 'உரை' : 'Text'}
                                </button>
                            </div>

                            {/* Mic button (submit tab) */}
                            {inputMethod === 'voice' && (
                                <div className="text-center space-y-3">
                                    <button
                                        onClick={handleMicClick}
                                        className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
                                    >
                                        {isListening ? <MicOff className="w-9 h-9 text-white" /> : <Mic className="w-9 h-9 text-white" />}
                                    </button>
                                    <p className="text-xs font-medium text-gray-600">
                                        {isListening
                                            ? (language === 'ta' ? 'கேட்கிறது...' : 'Listening...')
                                            : (language === 'ta' ? 'மைக்ரோபோனை 클릭 செய்యுங்கள்' : 'Click microphone to speak')}
                                    </p>
                                    <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                        <span className="text-lg">{languages[language]?.flag}</span>
                                        <span className="text-xs font-medium text-gray-700">{languages[language]?.name}</span>
                                    </div>
                                </div>
                            )}

                            {/* Textarea */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {language === 'ta' ? 'பிரச்சினை விவரம்' : 'Issue Description'}
                                </label>
                                <textarea
                                    value={issueDescription}
                                    onChange={(e) => { setIssueDescription(e.target.value); setTranscript(e.target.value); analyzeText(e.target.value); }}
                                    placeholder={language === 'ta' ? 'உங்கள் சట்ட பிரச்சினையை இங்கே விவரிக்கவும்...' : 'Describe your legal issue here...'}
                                    className="w-full min-h-28 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                    rows={4}
                                    readOnly={inputMethod === 'voice' && isListening}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {issueDescription.length} {language === 'ta' ? 'எழுத்துக்கள்' : 'characters'} ({language === 'ta' ? 'குறைந்தப்பட்ட 20' : 'minimum 20'})
                                </p>
                            </div>

                            {/* NLP Analysis */}
                            {isAnalyzing && (
                                <div className="flex items-center justify-center gap-2 text-blue-600">
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-medium">{language === 'ta' ? 'பகுப்பாய்வு...' : 'Analyzing...'}</span>
                                </div>
                            )}

                            {nlpAnalysis && !isAnalyzing && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                                    <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-1">
                                        🤖 {language === 'ta' ? 'AI பகுப்பாய்வு' : 'AI Analysis'}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white rounded-lg p-2">
                                            <p className="text-gray-500 mb-0.5">{language === 'ta' ? 'வழக்க வகை' : 'Case Type'}</p>
                                            <p className="font-semibold text-gray-900">
                                                {caseTypeLabels[language]?.[nlpAnalysis.detectedCategory] || caseTypeLabels[language]?.other}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-2">
                                            <p className="text-gray-500 mb-0.5">{language === 'ta' ? 'முன்னுரிமை' : 'Priority'}</p>
                                            <p className="font-semibold text-gray-900">
                                                {priorityLabels[language]?.[nlpAnalysis.urgencyLevel]}
                                            </p>
                                        </div>
                                    </div>

                                    {nlpAnalysis.completenessAnalysis?.score < 75 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                            <p className="text-xs text-yellow-800 font-medium mb-1">
                                                {language === 'ta' ? 'மேலும் தகவல் தேவை:' : 'Additional information needed:'}
                                            </p>
                                            <ul className="text-xs text-yellow-700 space-y-0.5">
                                                {nlpAnalysis.completenessAnalysis.missingInfo.map((info, idx) => (
                                                    <li key={idx}>• {info}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSubmitIssue}
                                    disabled={!issueDescription || issueDescription.length < 20}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit Issue'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}