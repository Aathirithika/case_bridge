import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Search,
    ChevronRight,
    Clock,
    Scale,
    User,
    Briefcase,
    ArrowLeft,
    MoreVertical,
    Paperclip,
    Send
} from 'lucide-react';
import api from '../utils/axiosConfig';
import ChatMessaging from '../components/ChatMessaging';

export default function Messages() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await api.get('/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
            fetchCasesAndUnread();
        } catch (error) {
            console.error('Error fetching profile:', error);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchCasesAndUnread = async () => {
        try {
            const token = localStorage.getItem('token');
            const [casesRes, unreadRes] = await Promise.all([
                api.get('/api/cases', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/api/messages/unread', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            // Only show cases that have both a client and a lawyer (assigned cases)
            const activeCases = casesRes.data.cases.filter(c => c.client && c.lawyer);
            setCases(activeCases);

            const counts = {};
            unreadRes.data.unreadCounts.forEach(item => {
                counts[item.caseId] = item.unreadCount;
            });
            setUnreadCounts(counts);

            // Auto-select first case if available
            if (activeCases.length > 0 && !selectedCase) {
                setSelectedCase(activeCases[0]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const filteredCases = cases.filter(c => {
        const otherPartyName = user?.role === 'client' ? c.lawyer?.name : c.client?.name;
        return (
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            otherPartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <Scale className="w-12 h-12 text-amber-700 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-amber-50 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar */}
            <div className={`w-full md:w-96 bg-white border-r border-amber-200 flex flex-col transition-all ${selectedCase && 'hidden md:flex'}`}>
                <div className="p-6 border-b border-amber-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Messages</h1>
                        </div>
                        <button
                            onClick={() => navigate(user?.role === 'lawyer' ? '/lawyer-dashboard' : '/client-dashboard')}
                            className="p-2 hover:bg-amber-50 rounded-full transition-colors text-stone-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-11 pr-4 py-3 bg-amber-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm group-hover:bg-amber-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredCases.length > 0 ? (
                        <div className="divide-y divide-amber-50">
                            {filteredCases.map((c) => {
                                const isSelected = selectedCase?._id === c._id;
                                const otherParty = user?.role === 'client' ? c.lawyer : c.client;
                                const unreadCount = unreadCounts[c._id] || 0;

                                return (
                                    <div
                                        key={c._id}
                                        onClick={() => setSelectedCase(c)}
                                        className={`p-5 cursor-pointer transition-all hover:bg-amber-50/50 group relative ${isSelected ? 'bg-amber-50 border-l-4 border-amber-700' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="relative">
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-stone-500 font-bold text-lg group-hover:scale-105 transition-transform ${isSelected ? 'from-amber-100 to-amber-200 text-amber-700' : ''}`}>
                                                    {otherParty?.name?.charAt(0)}
                                                </div>
                                                {unreadCount > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                                        {unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-amber-900' : 'text-stone-900'}`}>
                                                        {user?.role === 'client' ? 'Advoc. ' : ''}{otherParty?.name}
                                                    </h3>
                                                    <span className="text-[10px] text-stone-400 whitespace-nowrap font-medium uppercase tracking-wider">
                                                        {c.caseNumber}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 font-semibold mb-1 truncate">
                                                    {c.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-stone-400">
                                                    <Briefcase className="w-3 h-3" />
                                                    <span>{c.caseType}</span>
                                                    <span className="text-amber-200">|</span>
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-amber-400' : ''}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-amber-50/50 flex-1 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <MessageCircle className="w-8 h-8 text-stone-300" />
                            </div>
                            <p className="text-stone-900 font-bold mb-1 text-sm">No conversations yet</p>
                            <p className="text-stone-500 text-xs mb-6 max-w-[200px] mx-auto">Start a consultation with a lawyer to begin chatting.</p>
                            <button
                                onClick={() => navigate('/client-dashboard')}
                                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-100 hover:scale-[1.02] transition-transform active:scale-95"
                            >
                                Start the Conversation
                            </button>
                        </div>
                    )}
                </div>

                {/* User Profile Mini Tab */}
                <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                        {user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{user?.name}</p>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{user?.role}</p>
                    </div>
                    <button onClick={() => navigate('/login')} className="p-2 hover:bg-amber-200 rounded-lg transition-colors text-stone-400">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white relative ${!selectedCase && 'hidden md:flex'}`}>
                {selectedCase ? (
                    <div className="flex flex-col h-full relative">
                        {/* Mobile Header Back Button */}
                        <div className="md:hidden p-4 border-b border-amber-100 flex items-center gap-4">
                            <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-amber-50 rounded-full">
                                <ArrowLeft className="w-5 h-5 text-stone-600" />
                            </button>
                            <div>
                                <h3 className="font-bold text-stone-900 text-sm">
                                    {user?.role === 'client' ? 'Advoc. ' : ''}{user?.role === 'client' ? selectedCase.lawyer?.name : selectedCase.client?.name}
                                </h3>
                                <p className="text-[10px] text-amber-700 font-bold uppercase">{selectedCase.caseNumber}</p>
                            </div>
                        </div>

                        {/* We reuse the ChatMessaging logic but we need it to fit the full container */}
                        {/* I will modify ChatMessaging to support a 'standalone' mode or just wrap it correctly here */}
                        <div className="flex-1 overflow-hidden relative">
                            <ChatMessaging
                                caseId={selectedCase._id}
                                currentUser={user}
                                recipientUser={user.role === 'client' ? selectedCase.lawyer : selectedCase.client}
                                isOpen={true}
                                onClose={() => setSelectedCase(null)}
                                hideHeader={true} // New prop I'll add
                                standalone={true} // New prop I'll add
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-amber-50/50">
                        <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-100">
                            <MessageCircle className="w-12 h-12 text-amber-700" />
                        </div>
                        <h2 className="text-2xl font-black text-stone-900 mb-2">Select a Conversation</h2>
                        <p className="text-stone-500 text-center max-w-sm font-medium">
                            Choose a lawyer or client from the sidebar to start discussing your case details in real-time.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
