import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Briefcase, Star, MessageCircle, ArrowLeft, Filter, SlidersHorizontal, Scale, Phone } from 'lucide-react';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';

export default function FindLawyer() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        specialization: '',
        location: ''
    });

    // Parse query params from dashboard search
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const search = queryParams.get('search');
        const spec = queryParams.get('specialization');
        const loc = queryParams.get('location');

        if (search) setSearchTerm(search);
        if (spec) setFilters(prev => ({ ...prev, specialization: spec }));
        if (loc) setFilters(prev => ({ ...prev, location: loc }));

        fetchProfile();
    }, [location]);

    useEffect(() => {
        fetchLawyers();
    }, [searchTerm, filters]);

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

    const fetchLawyers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/lawyers', {
                params: {
                    name: searchTerm,
                    specialization: filters.specialization,
                    location: filters.location
                }
            });
            setLawyers(response.data);
        } catch (error) {
            console.error('Error fetching lawyers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#faf7f0]">
            <Navbar user={user} onLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-widest hover:text-[#4a3728] transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <h1 className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                            Find the Right <span className="text-[#4a3728]">Advocate</span>
                        </h1>
                        <p className="text-[#8d6e63] mt-2 font-medium italic">Search through our network of verified legal professionals.</p>
                    </div>

                    <div className="flex bg-white rounded-lg shadow-sm border border-[#8d6e63]/10 p-1">
                        <button className="px-6 py-2.5 bg-[#4a3728] text-white rounded-md text-xs font-black uppercase tracking-widest shadow-lg">Grid View</button>
                        <button className="px-6 py-2.5 text-stone-400 rounded-md text-xs font-black uppercase tracking-widest hover:text-[#4a3728]">List View</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-[#8d6e63]/10 p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#4a3728]/5 rounded-full -mr-12 -mt-12"></div>

                            <div className="flex items-center gap-2 mb-6 relative">
                                <SlidersHorizontal className="w-4 h-4 text-[#4a3728]" />
                                <h2 className="font-black text-xs uppercase tracking-[0.2em] text-[#1a1a1a]">Refine Search</h2>
                            </div>

                            <div className="space-y-6 relative">
                                <div>
                                    <label className="block text-[10px] font-black text-[#8d6e63] uppercase tracking-widest mb-2.5">Lawyer Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search by name..."
                                            className="w-full px-4 py-3 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-lg focus:ring-2 focus:ring-[#4a3728]/10 focus:border-[#4a3728] outline-none text-sm transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d6e63]/40" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#8d6e63] uppercase tracking-widest mb-2.5">Specialization</label>
                                    <select
                                        className="w-full px-4 py-3 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-lg outline-none text-sm font-bold text-gray-700 focus:border-[#4a3728] transition-all cursor-pointer appearance-none"
                                        value={filters.specialization}
                                        onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                                    >
                                        <option value="">All Practices</option>
                                        <option value="Criminal">Criminal Law</option>
                                        <option value="Civil">Civil Law</option>
                                        <option value="Family">Family Law</option>
                                        <option value="Property">Property Law</option>
                                        <option value="Corporate">Corporate Law</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#8d6e63] uppercase tracking-widest mb-2.5">Location</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="City or State..."
                                            className="w-full px-4 py-3 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-lg focus:ring-2 focus:ring-[#4a3728]/10 focus:border-[#4a3728] outline-none text-sm transition-all"
                                            value={filters.location}
                                            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                        />
                                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d6e63]/40" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilters({ specialization: '', location: '' });
                                    }}
                                    className="w-full py-3 text-[10px] font-black text-[#8d6e63] uppercase tracking-widest hover:text-[#4a3728] transition-colors border border-transparent hover:border-[#4a3728]/20 rounded-lg"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="bg-[#4a3728] rounded-xl p-6 text-white shadow-xl shadow-[#4a3728]/20 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <Scale className="w-10 h-10 text-white/20 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Need direct help?</h3>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed">Let our AI assistant find the best legal expert for your specific case automatically.</p>
                            <button className="w-full py-3 bg-white text-[#4a3728] rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[#faf7f0] transition-colors shadow-lg active:scale-95">
                                Start Assistant
                            </button>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white rounded-xl h-64 border border-[#8d6e63]/10 animate-pulse"></div>
                                ))}
                            </div>
                        ) : lawyers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {lawyers.map((lawyer) => (
                                    <div key={lawyer._id} className="bg-white rounded-xl border border-[#8d6e63]/10 hover:border-[#4a3728]/30 hover:shadow-2xl hover:shadow-stone-200/50 transition-all group overflow-hidden flex flex-col">
                                        <div className="p-6 flex-1">
                                            <div className="flex gap-4 mb-4">
                                                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#4a3728] rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-500">
                                                    {lawyer.profilePicture ? (
                                                        <img src={lawyer.profilePicture} alt={lawyer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={`https://www.gravatar.com/avatar/${lawyer._id}?d=identicon`} alt={lawyer.name} className="w-full h-full" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-black text-stone-800 text-lg group-hover:text-[#4a3728] transition-colors">
                                                            Adv. {lawyer.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg font-black text-[10px]">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            4.9
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                                            <MapPin className="w-3 h-3 text-[#8d6e63]" />
                                                            {lawyer.location || 'New Delhi, India'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                                            <Briefcase className="w-3 h-3 text-[#8d6e63]" />
                                                            {lawyer.yearsOfExperience || '10'} Years Experience
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-stone-50">
                                                <p className="text-[10px] font-black text-[#8d6e63] uppercase tracking-widest mb-2">Practice Areas</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(lawyer.specializations?.length > 0 ? lawyer.specializations : ['General Law']).map((spec, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-[#faf7f0] text-[#4a3728] rounded-full text-[10px] font-bold border border-[#8d6e63]/10">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex border-t border-[#8d6e63]/10 bg-[#faf7f0]/20 divide-x divide-[#8d6e63]/10">
                                            <button
                                                onClick={() => navigate(`/lawyer/${lawyer._id}`)}
                                                className="flex-1 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest hover:bg-white hover:text-[#1a1a1a] transition-all"
                                            >
                                                View Profile
                                            </button>
                                            <button
                                                className="flex-1 py-4 text-[10px] font-black text-[#4a3728] uppercase tracking-widest hover:bg-[#4a3728] hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Consult Now
                                            </button>
                                            <a
                                                href={`tel:${lawyer.phone || '9876543210'}`}
                                                className="flex-1 py-4 text-[10px] font-black text-[#8d6e63] uppercase tracking-widest hover:bg-white hover:text-[#4a3728] transition-all flex items-center justify-center gap-2 border-l border-[#8d6e63]/10"
                                            >
                                                <Phone className="w-4 h-4" />
                                                Call
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-20 text-center border border-[#8d6e63]/10">
                                <Search className="w-16 h-16 text-[#8d6e63]/20 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-stone-800 mb-2">No advocates found</h3>
                                <p className="text-[#8d6e63] max-w-sm mx-auto font-medium italic mb-8">
                                    We couldn't find any lawyers matching your current search criteria. Try adjusting your filters.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilters({ specialization: '', location: '' });
                                    }}
                                    className="px-8 py-3 bg-[#4a3728] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 shadow-xl shadow-[#4a3728]/10 transition-all"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
