import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale,
    LogOut,
    User,
    FileText,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    Briefcase,
    AlertCircle,
    X,
    Download,
    File,
    ChevronRight,
    Star,
    MessageCircle
} from 'lucide-react';
import api from '../utils/axiosConfig';
import ChatMessaging from '../components/ChatMessaging';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

export default function LawyerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState([]);
    const [statistics, setStatistics] = useState({
        totalCases: 0,
        activeCases: 0,
        completedCases: 0,
        totalClients: 0,
        pendingRequests: 0
    });
    const [selectedCase, setSelectedCase] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [loadingRemark, setLoadingRemark] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // pending, active, all
    const [showChat, setShowChat] = useState(false);
    const [selectedCaseForChat, setSelectedCaseForChat] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (user) {
            fetchCases();
        }
    }, [user]);

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

            if (response.data.role !== 'lawyer') {
                navigate('/client-dashboard');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/api/cases', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCases(response.data.cases);
            const stats = response.data.statistics;
            setStatistics({
                ...stats,
                pendingRequests: response.data.cases.filter(c => c.status === 'submitted').length
            });
        } catch (error) {
            console.error('Error fetching cases:', error);
        }
    };

    const updateCaseStatus = async (caseId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(
                `/api/cases/${caseId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchCases();

            if (selectedCase && selectedCase._id === caseId) {
                const updatedCase = { ...selectedCase, status: newStatus };
                setSelectedCase(updatedCase);
            }

            alert(`Case status updated to ${newStatus.replace('_', ' ')}!`);
        } catch (error) {
            console.error('Error updating case status:', error);
            alert('Failed to update case status');
        }
    };

    const addRemark = async () => {
        if (!remarkText.trim()) return;

        setLoadingRemark(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.post(
                `/api/cases/${selectedCase._id}/remarks`,
                { text: remarkText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSelectedCase(response.data.case);
            setRemarkText('');
            setCases(cases.map(c => c._id === response.data.case._id ? response.data.case : c));
        } catch (error) {
            console.error('Error adding remark:', error);
            alert('Failed to add remark');
        } finally {
            setLoadingRemark(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getStatusBadge = (status) => {
        const styles = {
            submitted: 'bg-stone-100 text-stone-700',
            under_review: 'bg-amber-100 text-amber-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            closed: 'bg-green-100 text-green-700',
        };

        const labels = {
            submitted: 'New Request',
            under_review: 'Under Review',
            in_progress: 'In Progress',
            closed: 'Closed',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-stone-600 bg-stone-100';
        }
    };

    const getFilteredCases = () => {
        switch (activeTab) {
            case 'pending':
                return cases.filter(c => c.status === 'submitted');
            case 'active':
                return cases.filter(c => c.status === 'under_review' || c.status === 'in_progress');
            case 'all':
                return cases;
            default:
                return cases;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
                <div className="text-center">
                    <Scale className="w-16 h-16 text-amber-700 animate-pulse mx-auto mb-4" />
                    <p className="text-stone-600 text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf7f0]">
            <Navbar user={user} onLogout={handleLogout} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Banner */}
                <div className="mb-8 bg-gradient-to-r from-[#4a3728] to-[#2d2926] rounded-3xl p-8 text-[#faf7f0] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <h2 className="text-3xl font-black mb-2 relative z-10 tracking-tight">Welcome back, Advocate {user?.name}!</h2>
                    <p className="text-[#faf7f0]/80 relative z-10 font-medium italic">
                        {statistics.pendingRequests > 0
                            ? `You have ${statistics.pendingRequests} new case ${statistics.pendingRequests === 1 ? 'request' : 'requests'} waiting for your review.`
                            : "All caught up! No pending requests at the moment."}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-stone-500">Pending</span>
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-3xl font-bold text-stone-900">{statistics.pendingRequests}</p>
                        <p className="text-xs text-stone-500 mt-1">New requests</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-stone-500">Active Cases</span>
                            <Briefcase className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-stone-900">{statistics.activeCases}</p>
                        <p className="text-xs text-stone-500 mt-1">In progress</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-stone-500">Clients</span>
                            <Users className="w-5 h-5 text-stone-600" />
                        </div>
                        <p className="text-3xl font-bold text-stone-900">{statistics.totalClients}</p>
                        <p className="text-xs text-stone-500 mt-1">Total clients</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-stone-500">Completed</span>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-stone-900">{statistics.completedCases}</p>
                        <p className="text-xs text-stone-500 mt-1">Cases closed</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 bg-white rounded-2xl p-2 shadow-sm border border-amber-100">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'pending'
                            ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-lg'
                            : 'text-stone-600 hover:bg-amber-50'
                            }`}
                    >
                        Pending ({statistics.pendingRequests})
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'active'
                            ? 'bg-gradient-to-r from-stone-600 to-stone-800 text-white shadow-lg'
                            : 'text-stone-600 hover:bg-amber-50'
                            }`}
                    >
                        Active ({statistics.activeCases})
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'all'
                            ? 'bg-gradient-to-r from-amber-800 to-stone-900 text-white shadow-lg'
                            : 'text-stone-600 hover:bg-amber-50'
                            }`}
                    >
                        All Cases ({statistics.totalCases})
                    </button>
                </div>

                {/* Cases List */}
                <div className="space-y-4">
                    {getFilteredCases().length > 0 ? (
                        getFilteredCases().map((caseItem) => (
                            <div
                                key={caseItem._id}
                                onClick={() => setSelectedCase(caseItem)}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                                                {caseItem.title}
                                            </h3>
                                            {getStatusBadge(caseItem.status)}
                                            {caseItem.priority === 'high' && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                    HIGH PRIORITY
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-stone-600 mb-3 line-clamp-2">{caseItem.description}</p>
                                        <div className="flex items-center gap-6 text-sm text-stone-500">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                {caseItem.caseNumber}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {caseItem.client?.name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {caseItem.caseType}
                                            </span>
                                            {caseItem.documents && caseItem.documents.length > 0 && (
                                                <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                                    <File className="w-4 h-4 text-amber-700" />
                                                    <span className="text-amber-700 font-semibold">{caseItem.documents.length} files</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-stone-400 group-hover:text-amber-700 transition-colors flex-shrink-0 ml-4" />
                                </div>

                                {/* Quick Actions for Pending Cases */}
                                {caseItem.status === 'submitted' && (
                                    <div className="mt-4 pt-4 border-t border-amber-100 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateCaseStatus(caseItem._id, 'under_review');
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-md"
                                        >
                                            Accept Case
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateCaseStatus(caseItem._id, 'closed');
                                            }}
                                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-all"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCaseForChat(caseItem);
                                                setShowChat(true);
                                            }}
                                            className="ml-auto px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Message
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-amber-100">
                            <Briefcase className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                            <p className="text-stone-500 text-lg mb-2">No {activeTab} cases</p>
                            <p className="text-stone-400 text-sm">
                                {activeTab === 'pending' ? 'No new requests at the moment' : 'Cases will appear here'}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <SiteFooter />

            {/* Case Detail Modal */}
            {selectedCase && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-amber-200 px-8 py-6 flex items-center justify-between rounded-t-3xl">
                            <div>
                                <h2 className="text-2xl font-bold text-stone-900">Case Details</h2>
                                <p className="text-sm text-stone-500 mt-1">{selectedCase.caseNumber}</p>
                            </div>
                            <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-amber-50 rounded-full transition-colors">
                                <X className="w-6 h-6 text-stone-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Case Info */}
                            <div className="bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-stone-900">{selectedCase.title}</h3>
                                    {getStatusBadge(selectedCase.status)}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <span className="font-semibold text-stone-700">Case Type:</span>
                                        <p className="text-stone-600">{selectedCase.caseType}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-stone-700">Priority:</span>
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedCase.priority)}`}>
                                            {selectedCase.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-stone-700">Client:</span>
                                        <p className="text-stone-600">{selectedCase.client?.name}</p>
                                        <p className="text-xs text-stone-500">{selectedCase.client?.email}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-stone-700">Submitted:</span>
                                        <p className="text-stone-600">{new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold text-stone-700">Description:</span>
                                    <p className="text-stone-600 mt-2">{selectedCase.description}</p>
                                </div>
                            </div>

                            {/* Documents Section */}
                            {selectedCase.documents && selectedCase.documents.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                                        <File className="w-5 h-5 text-amber-700" />
                                        Uploaded Documents ({selectedCase.documents.length})
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedCase.documents.map((doc, index) => (
                                            <div key={index} className="border border-amber-200 rounded-xl p-4 hover:border-amber-500 transition-colors bg-white">
                                                {doc.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <div>
                                                        <img
                                                            src={doc.fileUrl}
                                                            alt={doc.fileName}
                                                            className="w-full h-40 object-cover rounded-lg mb-3"
                                                        />
                                                        <p className="text-sm font-medium text-stone-700 truncate">{doc.fileName}</p>
                                                        <a
                                                            href={doc.fileUrl}
                                                            download={doc.fileName}
                                                            className="text-sm text-amber-700 hover:underline flex items-center gap-1 mt-2"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <File className="w-7 h-7 text-amber-700" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-stone-900 truncate">{doc.fileName}</p>
                                                            <a
                                                                href={doc.fileUrl}
                                                                download={doc.fileName}
                                                                className="text-sm text-amber-700 hover:underline flex items-center gap-1 mt-2"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Update */}
                            <div className="border-t border-amber-200 pt-6">
                                <h4 className="font-bold text-stone-900 mb-3">Update Case Status</h4>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => updateCaseStatus(selectedCase._id, 'submitted')}
                                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        New Request
                                    </button>
                                    <button
                                        onClick={() => updateCaseStatus(selectedCase._id, 'under_review')}
                                        className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Under Review
                                    </button>
                                    <button
                                        onClick={() => updateCaseStatus(selectedCase._id, 'in_progress')}
                                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        In Progress
                                    </button>
                                    <button
                                        onClick={() => updateCaseStatus(selectedCase._id, 'closed')}
                                        className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Close Case
                                    </button>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="border-t border-amber-200 pt-6">
                                <h4 className="font-bold text-stone-900 mb-3">Case Notes & Communication</h4>
                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                    {selectedCase.remarks && selectedCase.remarks.length > 0 ? (
                                        selectedCase.remarks.map((remark, index) => (
                                            <div key={index} className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                <p className="text-sm text-stone-700">{remark.text}</p>
                                                <p className="text-xs text-stone-500 mt-2">
                                                    {new Date(remark.addedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-stone-500 italic">No notes yet</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={remarkText}
                                        onChange={(e) => setRemarkText(e.target.value)}
                                        placeholder="Add a note or update..."
                                        className="flex-1 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button
                                        onClick={addRemark}
                                        disabled={loadingRemark || !remarkText.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg"
                                    >
                                        {loadingRemark ? 'Adding...' : 'Add Note'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Messaging Modal */}
            {showChat && selectedCaseForChat && (
                <ChatMessaging
                    caseId={selectedCaseForChat._id}
                    currentUser={user}
                    recipientUser={selectedCaseForChat.client}
                    isOpen={showChat}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
}