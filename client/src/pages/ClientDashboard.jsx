import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale,
    LogOut,
    User,
    MessageCircle,
    FileText,
    Search,
    Briefcase,
    Star,
    TrendingUp,
    Clock,
    CheckCircle,
    X,
    Upload,
    File,
    Trash2
} from 'lucide-react';
import api from '../utils/axiosConfig';
import VoiceAssistantModal from '../components/VoiceAssistantModal';
import ChatMessaging from '../components/ChatMessaging';
import Navbar from '../components/Navbar';
import SearchConsole from '../components/SearchConsole';
import LawyerShowcase from '../components/LawyerShowcase';

export default function ClientDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lawyers, setLawyers] = useState([]);
    const [cases, setCases] = useState([]);
    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
    const [recommendedLawyers, setRecommendedLawyers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [showHireModal, setShowHireModal] = useState(false);
    const [hireData, setHireData] = useState({
        title: '',
        caseType: 'Criminal Law',
        description: '',
        priority: 'medium'
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [showChat, setShowChat] = useState(false);
    const [selectedCaseForChat, setSelectedCaseForChat] = useState(null);
    const [showQuickChatLawyer, setShowQuickChatLawyer] = useState(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, active, pending, closed
    const [dashboardTab, setDashboardTab] = useState('home'); // home, consultations, profile
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        location: ''
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const caseTypeMapping = {
        'family': 'Family Law',
        'property': 'Property Law',
        'criminal': 'Criminal Law',
        'business': 'Corporate Law',
        'civil': 'Civil Law',
        'labor': 'Labour Law',
        'consumer': 'Consumer Law',
        'other': 'Other',
        'General Consultation': 'General Consultation'
    };
    const [quickChatData, setQuickChatData] = useState({
        title: 'Initial Consultation',
        description: 'I would like to start a conversation regarding legal advice.',
        caseType: 'General Consultation'
    });

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchLawyers();
            fetchMyCases();
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
            setProfileData({
                name: response.data.name,
                email: response.data.email,
                phone: response.data.phone || '',
                location: response.data.location || ''
            });

            if (response.data.role !== 'client') {
                navigate('/lawyer-dashboard');
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

    const fetchMyCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/api/cases', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const myCases = response.data.cases;
            setCases(myCases);

            // Fetch recommendations separately from the new endpoint, now case-aware
            const latestCase = myCases[0];
            const recResponse = await api.get('/api/lawyers/recommendations', {
                params: latestCase ? { caseId: latestCase._id } : {},
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecommendedLawyers(recResponse.data);
        } catch (error) {
            console.error('Error fetching cases:', error);
        }
    };

    const fetchLawyers = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch all lawyers for general use
            const response = await api.get('/api/lawyers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLawyers(response.data);
        } catch (error) {
            console.error('Error fetching lawyers:', error);
        }
    };

    const getRecommendations = (issueType) => {
        const filtered = lawyers.filter(l =>
            l.specializations?.some(s => s.toLowerCase().includes(issueType.toLowerCase())) ||
            issueType.toLowerCase().includes(l.specializations?.[0]?.toLowerCase())
        );

        const sorted = (filtered.length > 0 ? filtered : lawyers)
            .sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));

        setRecommendedLawyers(sorted.slice(0, 3));
    };

    const handleVoiceIssueSubmission = async (submissionData) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            // Find best lawyer immediately instead of waiting for state update
            const issueType = submissionData.detectedCategory;
            const filtered = lawyers.filter(l =>
                l.specializations?.some(s => s.toLowerCase().includes(issueType.toLowerCase())) ||
                issueType.toLowerCase().includes(l.specializations?.[0]?.toLowerCase())
            );
            const sorted = (filtered.length > 0 ? filtered : lawyers)
                .sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
            const bestLawyer = sorted[0];

            const response = await api.post('/api/cases', {
                title: submissionData.detectedCategory.toUpperCase() + ": " + submissionData.description.substring(0, 30) + "...",
                description: submissionData.description,
                caseType: caseTypeMapping[submissionData.detectedCategory] || 'Other',
                priority: submissionData.priority,
                clientId: user._id,
                lawyerId: bestLawyer?._id,
                submissionMethod: 'voice',
                voiceTranscript: submissionData.description,
                nlpAnalysis: submissionData.nlpAnalysis
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Issue submitted! We've recommended ${bestLawyer?.name} for your case.`);
            fetchMyCases();
        } catch (error) {
            console.error('Error submitting voice request:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit request via voice.';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isDocument = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max

            if (!isValidSize) {
                alert(`${file.name} is too large. Max size is 5MB.`);
                return false;
            }
            if (!isImage && !isDocument) {
                alert(`${file.name} is not a supported file type.`);
                return false;
            }
            return true;
        });

        // Convert to base64 for storage
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedFiles(prev => [...prev, {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: reader.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.put('/api/auth/profile', profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleSubmitIssue = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            // Auto-assign to recommended lawyer based on case type
            getRecommendations(issueData.caseType);
            const assignedLawyer = recommendedLawyers.find(l =>
                l.specializations?.some(s => s.toLowerCase().includes(issueData.caseType.toLowerCase()))
            ) || lawyers[0];

            const casePayload = {
                ...issueData,
                clientId: user._id,
                lawyerId: assignedLawyer?._id,
                submissionMethod: 'form',
                documents: uploadedFiles.map(f => ({
                    fileName: f.name,
                    fileType: f.type,
                    fileSize: f.size,
                    fileData: f.data
                }))
            };

            await api.post('/api/cases', casePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Issue submitted successfully!');
            setShowIssueModal(false);
            setIssueData({ title: '', caseType: 'Criminal Law', description: '', priority: 'medium' });
            setUploadedFiles([]);
            fetchMyCases();
        } catch (error) {
            console.error('Error submitting issue:', error);
            alert(error.response?.data?.message || 'Failed to submit issue.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleHireLawyer = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await api.post('/api/cases', {
                ...hireData,
                clientId: user._id,
                lawyerId: selectedLawyer._id,
                submissionMethod: 'form',
                documents: uploadedFiles.map(f => ({
                    fileName: f.name,
                    fileType: f.type,
                    fileSize: f.size,
                    fileData: f.data
                }))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Case submitted successfully!');
            setShowHireModal(false);
            setHireData({ title: '', caseType: 'Criminal Law', description: '', priority: 'medium' });
            setUploadedFiles([]);
            fetchMyCases();
        } catch (error) {
            console.error('Error submitting case:', error);
            alert(error.response?.data?.message || 'Failed to submit case.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickChat = (lawyer) => {
        // Check if there's an existing active case with this lawyer
        const existingCase = cases.find(c =>
            c.lawyer?._id === lawyer._id &&
            ['submitted', 'under_review', 'in_progress'].includes(c.status)
        );

        if (existingCase) {
            setSelectedCaseForChat(existingCase);
            setShowChat(true);
        } else {
            // No existing case, show modal to start one
            setQuickChatLawyer(lawyer);
            setShowQuickChatModal(true);
        }
    };

    const startConsultation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/api/cases', {
                ...quickChatData,
                clientId: user._id,
                lawyerId: quickChatLawyer._id,
                submissionMethod: 'form',
                priority: 'medium'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // The backend returns the new case
            const newCase = response.data.case;

            // Re-fetch cases to update the list
            await fetchMyCases();

            // Close quick chat modal and open actual chat
            setShowQuickChatModal(false);
            setSelectedCaseForChat(newCase);
            setShowChat(true);
        } finally {
            setSubmitting(false);
        }
    };

    const getFilteredCases = () => {
        if (activeTab === 'all') return cases;
        if (activeTab === 'active') return cases.filter(c => c.status === 'under_review' || c.status === 'in_progress');
        if (activeTab === 'pending') return cases.filter(c => c.status === 'submitted');
        if (activeTab === 'closed') return cases.filter(c => c.status === 'closed');
        return cases;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'submitted': return 'text-stone-600 bg-stone-100';
            case 'under_review': return 'text-amber-600 bg-amber-100';
            case 'in_progress': return 'text-yellow-600 bg-yellow-100';
            case 'closed': return 'text-green-600 bg-green-100';
            default: return 'text-stone-600 bg-stone-100';
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

            {/* Dashboard Sidebar/Tabs */}
            <div className="bg-white border-b border-amber-100 flex items-center px-6 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setDashboardTab('home')}
                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${dashboardTab === 'home' ? 'border-[#4a3728] text-[#4a3728]' : 'border-transparent text-stone-400'}`}
                >
                    Dashboard Home
                </button>
                <button
                    onClick={() => setDashboardTab('consultations')}
                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${dashboardTab === 'consultations' ? 'border-[#4a3728] text-[#4a3728]' : 'border-transparent text-stone-400'}`}
                >
                    My Consultations
                </button>
                <button
                    onClick={() => setDashboardTab('profile')}
                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${dashboardTab === 'profile' ? 'border-[#4a3728] text-[#4a3728]' : 'border-transparent text-stone-400'}`}
                >
                    Profile Settings
                </button>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {dashboardTab === 'home' && (
                    <>
                        {/* Hero Section */}
                        <div className="relative mb-12 -mx-6 md:-mx-12 lg:-mx-20">
                            <div className="bg-gradient-to-br from-[#4a3728] to-[#2d2926] min-h-[400px] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden relative">
                                {/* Decorative background elements */}
                                <div className="absolute top-0 left-0 w-full h-full opacity-5">
                                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]"></div>
                                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#faf7f0] rounded-full blur-[150px]"></div>
                                </div>

                                <div className="relative z-10 max-w-4xl mx-auto">
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#faf7f0] mb-6 leading-[1.1] tracking-tight">
                                        Free Legal Advice Online<br />
                                        <span className="text-[#8d6e63]">From Top Rated Lawyers</span>
                                    </h2>
                                    <p className="text-lg md:text-xl text-[#faf7f0]/80 mb-10 font-medium">
                                        Choose from over 15,000 lawyers across 1000+ cities in India.<br />
                                        <span className="text-[#faf7f0]/50 text-sm mt-4 block italic font-serif">"Your Secure Bridge to Justice — CaseBridge"</span>
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <button
                                            onClick={() => setShowHireModal(true)}
                                            className="w-full sm:w-auto px-10 py-4 bg-[#1a1a1a] text-[#faf7f0] border border-black rounded-md font-extrabold text-sm uppercase tracking-[0.15em] hover:bg-black transition-all shadow-2xl active:scale-95"
                                        >
                                            Talk to a Lawyer
                                        </button>
                                        <button
                                            onClick={() => setShowVoiceAssistant(true)}
                                            className="w-full sm:w-auto px-10 py-4 bg-transparent border-2 border-[#faf7f0]/30 text-[#faf7f0] rounded-md font-extrabold text-sm uppercase tracking-[0.15em] hover:bg-white/5 transition-all active:scale-95"
                                        >
                                            Ask a Free Question
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Integrated Search Console */}
                            <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
                                <SearchConsole
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onSearch={(query) => {
                                        const params = new URLSearchParams();
                                        if (searchTerm) params.append('search', searchTerm);
                                        if (query?.specialization) params.append('specialization', query.specialization);
                                        if (query?.location) params.append('location', query.location);
                                        navigate(`/find-lawyer?${params.toString()}`);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Integrated Lawyer Showcase */}
                        <LawyerShowcase
                            lawyers={recommendedLawyers}
                            onConsult={handleQuickChat}
                            onViewProfile={(id) => navigate(`/lawyer/${id}`)}
                        />
                    </>
                )}

                {dashboardTab === 'consultations' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">My Consultations</h2>
                            <p className="text-[#8d6e63] font-medium italic mt-1">Track and manage your legal conversations and cases.</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <button
                                onClick={() => setActiveTab(activeTab === 'active' ? 'all' : 'active')}
                                className={`bg-white rounded-lg p-6 shadow-sm border transition-all text-left flex items-center justify-between group ${activeTab === 'active' ? 'border-[#4a3728] ring-1 ring-[#4a3728]' : 'border-[#8d6e63]/10 hover:border-[#8d6e63]/30'}`}
                            >
                                <div>
                                    <p className="text-[11px] font-black text-[#8d6e63] uppercase tracking-widest mb-1">Active</p>
                                    <p className="text-3xl font-black text-[#1a1a1a]">{cases.filter(c => c.status === 'under_review' || c.status === 'in_progress').length}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'active' ? 'bg-[#faf7f0] text-[#4a3728]' : 'bg-gray-50 text-gray-400'}`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab(activeTab === 'pending' ? 'all' : 'pending')}
                                className={`bg-white rounded-lg p-6 shadow-sm border transition-all text-left flex items-center justify-between group ${activeTab === 'pending' ? 'border-[#8d6e63] ring-1 ring-[#8d6e63]' : 'border-[#8d6e63]/10 hover:border-[#8d6e63]/30'}`}
                            >
                                <div>
                                    <p className="text-[11px] font-black text-[#8d6e63] uppercase tracking-widest mb-1">Pending</p>
                                    <p className="text-3xl font-black text-[#1a1a1a]">{cases.filter(c => c.status === 'submitted').length}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'pending' ? 'bg-[#fdfbf7] text-[#8d6e63]' : 'bg-gray-50 text-gray-400'}`}>
                                    <Clock className="w-6 h-6" />
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab(activeTab === 'closed' ? 'all' : 'closed')}
                                className={`bg-white rounded-lg p-6 shadow-sm border transition-all text-left flex items-center justify-between group ${activeTab === 'closed' ? 'border-[#1a1a1a] ring-1 ring-[#1a1a1a]' : 'border-[#8d6e63]/10 hover:border-[#8d6e63]/30'}`}
                            >
                                <div>
                                    <p className="text-[11px] font-black text-[#8d6e63] uppercase tracking-widest mb-1">Resolved</p>
                                    <p className="text-3xl font-black text-[#1a1a1a]">{cases.filter(c => c.status === 'closed').length}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'closed' ? 'bg-gray-50 text-[#1a1a1a]' : 'bg-gray-50 text-gray-400'}`}>
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </button>
                        </div>

                        {/* Cases List */}
                        {getFilteredCases().length > 0 ? (
                            <div className="bg-white rounded-md shadow-sm border border-[#8d6e63]/20 divide-y divide-[#8d6e63]/10 overflow-hidden">
                                {getFilteredCases().map((c) => (
                                    <div key={c._id} className="p-6 hover:bg-[#faf7f0]/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-[#1a1a1a] text-lg">{c.title}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getStatusColor(c.status)}`}>
                                                    {c.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Advocate: <span className="font-bold text-[#8d6e63]">Adv. {c.lawyer?.name}</span> • Ref: {c.caseNumber}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {c.priority === 'high' && (
                                                <span className="px-3 py-1 bg-red-50 text-red-600 text-[11px] font-bold uppercase rounded-md tracking-wider border border-red-100">
                                                    High Priority
                                                </span>
                                            )}
                                            {c.lawyer && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCaseForChat(c);
                                                        setShowChat(true);
                                                    }}
                                                    className="px-6 py-2.5 bg-[#4a3728] hover:bg-[#1a1a1a] text-[#faf7f0] rounded-md text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    Chat
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/50 rounded-md p-16 text-center border border-dashed border-[#8d6e63]/30">
                                <FileText className="w-12 h-12 text-[#8d6e63]/20 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-[#1a1a1a]">No consultations found</h3>
                                <p className="text-[#8d6e63] text-sm italic font-medium">Start a new request from the home tab.</p>
                            </div>
                        )}
                    </div>
                )}

                {dashboardTab === 'profile' && (
                    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">Profile Settings</h2>
                            <p className="text-[#8d6e63] font-medium italic mt-1">Manage your account information and preferences.</p>
                        </div>

                        <div className="bg-white rounded-xl border border-[#8d6e63]/10 shadow-sm overflow-hidden">
                            <div className="p-8">
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-[#8d6e63] uppercase tracking-widest mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-lg focus:border-[#4a3728] outline-none transition-all font-medium"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-[#8d6e63] uppercase tracking-widest mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-50 border border-[#8d6e63]/10 rounded-lg text-stone-400 cursor-not-allowed font-medium"
                                                value={profileData.email}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-[#8d6e63] uppercase tracking-widest mb-2">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="w-full px-4 py-3 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-lg focus:border-[#4a3728] outline-none transition-all font-medium"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                placeholder="e.g. +91 98765 43210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-[#8d6e63] uppercase tracking-widest mb-2">Location</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-lg focus:border-[#4a3728] outline-none transition-all font-medium"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                                placeholder="e.g. Chennai, Tamil Nadu"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#faf7f0]">
                                        <button
                                            type="submit"
                                            disabled={updatingProfile}
                                            className="px-10 py-4 bg-[#4a3728] text-[#faf7f0] rounded-md font-black text-xs uppercase tracking-widest hover:bg-[#1a1a1a] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {updatingProfile ? 'Saving Changes...' : 'Update Profile'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Voice Assistant Button */}
            <button
                onClick={() => setShowVoiceAssistant(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-amber-700 to-stone-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group"
            >
                <MessageCircle className="w-8 h-8" />
                <div className="absolute right-full mr-4 bg-stone-900 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Voice Assistant
                </div>
            </button >

            {/* Voice Assistant Modal */}
            < VoiceAssistantModal
                isOpen={showVoiceAssistant}
                onClose={() => setShowVoiceAssistant(false)}
                onSubmitIssue={handleVoiceIssueSubmission}
            />

            {/* Chat Messaging Modal */}
            {
                showChat && selectedCaseForChat && (
                    <ChatMessaging
                        caseId={selectedCaseForChat._id}
                        currentUser={user}
                        recipientUser={selectedCaseForChat.lawyer}
                        isOpen={showChat}
                        onClose={() => setShowChat(false)}
                    />
                )
            }

            {/* Hire Lawyer Modal */}
            {
                showHireModal && selectedLawyer && (
                    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-stone-100">
                            <div className="bg-amber-50 px-8 py-6 border-b border-amber-100 flex items-center justify-between">
                                <div>
                                    <h1 className="text-xs font-black text-amber-700 uppercase tracking-[0.2em] mb-1">Legal Consultation</h1>
                                    <h2 className="text-xl font-bold text-stone-800">Submit Your Case</h2>
                                </div>
                                <button onClick={() => setShowHireModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-stone-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-12 h-12 bg-white rounded-md shadow-sm overflow-hidden flex-shrink-0">
                                        <img src={`https://i.pravatar.cc/100?u=${selectedLawyer._id}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Assigned Advocate</p>
                                        <p className="text-md font-bold text-gray-800">Advocate {selectedLawyer.name}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleHireLawyer} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Case Title</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Brief description of your issue"
                                            className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            value={hireData.title}
                                            onChange={(e) => setHireData({ ...hireData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Case Type</label>
                                            <select
                                                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                value={hireData.caseType}
                                                onChange={(e) => setHireData({ ...hireData, caseType: e.target.value })}
                                            >
                                                <option>Criminal Law</option>
                                                <option>Civil Law</option>
                                                <option>Family Law</option>
                                                <option>Property Law</option>
                                                <option>Corporate Law</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                                            <select
                                                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                value={hireData.priority}
                                                onChange={(e) => setHireData({ ...hireData, priority: e.target.value })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                        <textarea
                                            required
                                            rows="4"
                                            placeholder="Provide detailed information about your case..."
                                            className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                            value={hireData.description}
                                            onChange={(e) => setHireData({ ...hireData, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* File Upload Section */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Upload Documents/Images</label>
                                        <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 hover:border-amber-500 transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf,.doc,.docx"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                                <p className="text-sm font-medium text-gray-700">Click to upload files</p>
                                                <p className="text-xs text-gray-500 mt-1">Images, PDF, Word (Max 5MB each)</p>
                                            </label>
                                        </div>

                                        {/* Uploaded Files Preview */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <div className="flex items-center gap-3">
                                                            {file.type.startsWith('image/') ? (
                                                                <div className="w-12 h-12 rounded overflow-hidden bg-gray-200">
                                                                    <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded bg-amber-100 flex items-center justify-center">
                                                                    <File className="w-6 h-6 text-amber-700" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowHireModal(false)}
                                            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-[2] py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Case'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Start Consultation Modal */}
            {
                showQuickChatModal && quickChatLawyer && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-gradient-to-r from-amber-700 to-stone-700 px-6 py-4 text-white flex items-center justify-between">
                                <h3 className="text-xl font-bold">Start Conversation</h3>
                                <button onClick={() => setShowQuickChatModal(false)} className="p-2 hover:bg-white/20 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={startConsultation} className="p-6 space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-2">
                                    <div className="w-12 h-12 bg-amber-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                        {quickChatLawyer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-amber-700 font-bold uppercase tracking-wider">Messaging</p>
                                        <h4 className="font-bold text-stone-900 text-lg">Advoc. {quickChatLawyer.name}</h4>
                                    </div>
                                </div>

                                <p className="text-sm text-stone-500 italic">
                                    To start a secure conversation, we'll create a consultation request for you.
                                </p>

                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-2">Consultation Topic</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={quickChatData.title}
                                        onChange={(e) => setQuickChatData({ ...quickChatData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-2">Initial Message / Context</label>
                                    <textarea
                                        required
                                        rows="3"
                                        className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                        value={quickChatData.description}
                                        onChange={(e) => setQuickChatData({ ...quickChatData, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickChatModal(false)}
                                        className="flex-1 py-3 border-2 border-stone-100 rounded-xl font-bold text-stone-500 hover:bg-amber-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {submitting ? 'Starting...' : 'Start Chat'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}