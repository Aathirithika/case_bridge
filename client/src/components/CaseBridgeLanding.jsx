import React, { useState, useEffect } from 'react';
import { Mic, UserCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import Navbar from './Navbar';
import SearchConsole from './SearchConsole';
import LawyerShowcase from './LawyerShowcase';
import SiteFooter from './SiteFooter';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function CaseBridgeLanding() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [lawyers, setLawyers] = useState([]);
    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLawyers();
    }, []);

    const fetchLawyers = async () => {
        try {
            const response = await api.get('/api/lawyers');
            setLawyers(response.data.slice(0, 3));
        } catch (error) {
            console.error('Error fetching lawyers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetStarted = () => {
        navigate('/role-selection');
    };

    const handleSearch = () => {
        alert("Search feature integrated! Login to access full search across 15,000+ lawyers.");
    };

    const handleConsult = (lawyer) => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#faf7f0] flex flex-col font-sans">
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-10">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#8d6e63] rounded-full blur-[120px]"></div>
                    <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#4a3728] rounded-full blur-[150px]"></div>
                </div>

                <div className="w-full max-w-7xl relative z-10">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4a3728]/5 border border-[#4a3728]/10 rounded-full mb-10">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-[#4a3728] uppercase tracking-[0.2em]">Next Generation Legal Tech</span>
                        </div>

                        <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] mb-8 leading-[1.05] tracking-tight">
                            Bridging The Gap To<br />
                            <span className="text-[#8d6e63]">Legal Excellence</span>
                        </h2>

                        <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-12 font-medium leading-relaxed italic">
                            "Your Secure Bridge to Justice — CaseBridge"<br className="hidden md:block" />
                            Professional legal support simplified for the modern era.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                            <button
                                onClick={handleGetStarted}
                                className="w-full sm:w-auto px-12 py-5 bg-[#4a3728] hover:bg-[#3d2e22] text-[#faf7f0] text-sm font-black uppercase tracking-[0.2em] rounded-md transition-all shadow-xl shadow-[#4a3728]/20 hover:-translate-y-1 active:scale-95 duration-300"
                            >
                                Get Started Now
                            </button>
                            <button
                                onClick={() => setShowVoiceAssistant(true)}
                                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-[#4a3728]/20 text-[#4a3728] rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-[#4a3728]/5 transition-all active:scale-95"
                            >
                                Ask a Question
                            </button>
                        </div>
                    </div>

                    {/* Integrated Search Console */}
                    <div className="max-w-5xl mx-auto mb-20 px-4">
                        <SearchConsole
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            onSearch={handleSearch}
                        />
                    </div>

                    {/* Integrated Lawyer Showcase */}
                    <LawyerShowcase
                        lawyers={lawyers}
                        onConsult={handleConsult}
                        onViewProfile={(id) => navigate(`/lawyer/${id}`)}
                    />

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        <div className="bg-white p-8 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col items-center text-center group hover:border-[#8d6e63]/30 transition-all duration-300">
                            <div className="w-14 h-14 bg-[#faf7f0] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Mic className="w-7 h-7 text-[#4a3728]" />
                            </div>
                            <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-widest mb-3">Voice Support</h3>
                            <p className="text-xs text-stone-500 font-medium leading-relaxed">Multilingual AI voice assistance for instant legal guidance.</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col items-center text-center group hover:border-[#8d6e63]/30 transition-all duration-300">
                            <div className="w-14 h-14 bg-[#faf7f0] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <UserCheck className="w-7 h-7 text-[#4a3728]" />
                            </div>
                            <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-widest mb-3">Vetted Experts</h3>
                            <p className="text-xs text-stone-500 font-medium leading-relaxed">Direct access to top-rated, verified legal professionals across India.</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col items-center text-center group hover:border-[#8d6e63]/30 transition-all duration-300">
                            <div className="w-14 h-14 bg-[#faf7f0] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Lock className="w-7 h-7 text-[#4a3728]" />
                            </div>
                            <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-widest mb-3">Confidential</h3>
                            <p className="text-xs text-stone-500 font-medium leading-relaxed">Bank-grade security ensures your legal matters remain private.</p>
                        </div>
                    </div>

                    {/* Social/Trust proof */}
                    <div className="flex items-center justify-center gap-3 py-10 border-t border-[#8d6e63]/10">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="lawyer" className="grayscale" />
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-[0.1em]">Joined by 15,000+ Legal Experts</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex text-amber-500">
                                    {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-[10px]">★</span>)}
                                </div>
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Trust Ranking #1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />

            <VoiceAssistantModal
                isOpen={showVoiceAssistant}
                onClose={() => setShowVoiceAssistant(false)}
                onSubmitIssue={() => navigate('/login')}
            />
        </div>
    );
}