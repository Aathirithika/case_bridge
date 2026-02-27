import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scale, ArrowLeft, BookOpen, ShieldAlert, Gavel, FileText } from 'lucide-react';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';

export default function IPCSections() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSection, setSelectedSection] = useState(null);

    useEffect(() => {
        fetchProfile();
        fetchSections();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchSections();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await api.get('/api/auth/profile');
                setUser(response.data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchSections = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/ipc', {
                params: { query: searchTerm }
            });
            setSections(response.data);
            if (response.data.length > 0 && !selectedSection) {
                setSelectedSection(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching IPC sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Criminal': return <ShieldAlert className="w-4 h-4" />;
            case 'Family': return <BookOpen className="w-4 h-4" />;
            default: return <Scale className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#faf7f0]">
            <Navbar user={user} onLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-widest hover:text-[#4a3728] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                        Indian Penal <span className="text-[#4a3728]">Code</span>
                    </h1>
                    <p className="text-[#8d6e63] mt-2 font-medium italic">Comprehensive database of IPC sections and legal provisions.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
                    {/* Search and List */}
                    <div className="lg:col-span-1 flex flex-col bg-white rounded-3xl shadow-sm border border-[#8d6e63]/10 overflow-hidden">
                        <div className="p-6 border-b border-stone-50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search section or keyword..."
                                    className="w-full px-5 py-4 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-2xl focus:ring-2 focus:ring-[#4a3728]/10 focus:border-[#4a3728] outline-none text-sm transition-all pr-12"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8d6e63]/40" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
                            {loading && sections.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="p-6 animate-pulse">
                                        <div className="h-4 bg-stone-100 rounded w-1/4 mb-2"></div>
                                        <div className="h-3 bg-stone-50 rounded w-3/4"></div>
                                    </div>
                                ))
                            ) : sections.length > 0 ? (
                                sections.map((section) => (
                                    <button
                                        key={section._id}
                                        onClick={() => setSelectedSection(section)}
                                        className={`w-full p-6 text-left transition-all hover:bg-[#faf7f0]/50 ${selectedSection?._id === section._id ? 'bg-[#faf7f0] border-r-4 border-r-[#4a3728]' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-black text-[#4a3728] text-sm">Section {section.sectionNumber}</span>
                                            <span className="px-2 py-0.5 bg-white text-[9px] font-black uppercase tracking-widest text-[#8d6e63] border border-[#8d6e63]/10 rounded">
                                                {section.category}
                                            </span>
                                        </div>
                                        <p className="text-stone-800 font-bold text-sm line-clamp-1">{section.title}</p>
                                    </button>
                                ))
                            ) : (
                                <div className="p-12 text-center text-stone-400 font-medium italic text-sm">
                                    No sections found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Detail */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-[#8d6e63]/10 overflow-y-auto">
                        {selectedSection ? (
                            <div className="p-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-stone-50">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-[#faf7f0] rounded-2xl flex items-center justify-center text-[#4a3728] shadow-inner border border-[#8d6e63]/10">
                                            <Gavel className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-3xl font-black text-[#1a1a1a]">Section {selectedSection.sectionNumber}</h2>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#4a3728] text-white rounded-full text-[10px] font-black uppercase tracking-[0.1em]">
                                                    {getCategoryIcon(selectedSection.category)}
                                                    {selectedSection.category}
                                                </div>
                                            </div>
                                            <p className="text-xl font-bold text-[#8d6e63]">{selectedSection.title}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <FileText className="w-5 h-5 text-[#4a3728]" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1a1a1a]">Provision Description</h3>
                                        </div>
                                        <div className="bg-[#faf7f0]/50 rounded-2xl p-8 border border-[#8d6e63]/10">
                                            <p className="text-stone-700 leading-relaxed text-lg font-medium">
                                                {selectedSection.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShieldAlert className="w-5 h-5 text-amber-600" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1a1a1a]">Prescribed Punishment</h3>
                                        </div>
                                        <div className="bg-amber-50/50 rounded-2xl p-8 border border-amber-100">
                                            <p className="text-amber-900 leading-relaxed font-bold">
                                                {selectedSection.punishment}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-10 flex gap-4">
                                        <button className="flex-1 py-4 bg-[#faf7f0] text-[#4a3728] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#f3efdf] border border-[#8d6e63]/20 transition-all flex items-center justify-center gap-3">
                                            <BookOpen className="w-4 h-4" />
                                            Case Laws
                                        </button>
                                        <button className="flex-1 py-4 bg-[#4a3728] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 shadow-xl shadow-[#4a3728]/10 transition-all">
                                            Consult an Expert
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-20">
                                <Scale className="w-20 h-20 text-[#8d6e63]/10 mb-6" />
                                <h3 className="text-xl font-black text-stone-300">Select a section to view details</h3>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
