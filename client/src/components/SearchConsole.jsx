import React from 'react';
import { Search, Clock } from 'lucide-react';

export default function SearchConsole({ searchTerm, setSearchTerm, onSearch }) {
    return (
        <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col md:flex-row gap-4 items-end border border-[#8d6e63]/10">
            <div className="flex-1 w-full">
                <label className="block text-[10px] font-black text-[#8d6e63] uppercase tracking-widest mb-2.5 ml-1">Search for top-rated lawyers</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, specialization, or location..."
                        className="w-full px-5 py-4 bg-[#faf7f0]/30 border border-[#8d6e63]/20 rounded-lg focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d6e63]/50 w-4 h-4" />
                </div>
            </div>
            <div className="w-full md:w-48">
                <div className="relative">
                    <select className="w-full px-5 py-4 bg-[#faf7f0]/30 border border-[#8d6e63]/20 rounded-lg outline-none text-sm font-bold text-gray-700 appearance-none focus:border-[#4a3728] transition-all cursor-pointer">
                        <option>Select City</option>
                        <option>Delhi</option>
                        <option>Mumbai</option>
                        <option>Bangalore</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8d6e63]/50">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>
            </div>
            <div className="w-full md:w-64">
                <div className="relative">
                    <select className="w-full px-5 py-4 bg-[#faf7f0]/30 border border-[#8d6e63]/20 rounded-lg outline-none text-sm font-bold text-gray-700 appearance-none focus:border-[#4a3728] transition-all cursor-pointer">
                        <option>Select Practice Areas</option>
                        <option>Property Law</option>
                        <option>Family Law</option>
                        <option>Criminal Law</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8d6e63]/50">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>
            </div>
            <button
                onClick={onSearch}
                className="w-full md:w-auto px-10 py-4 bg-[#4a3728] hover:bg-[#3d2e22] text-[#faf7f0] rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#4a3728]/10 active:scale-95"
            >
                Search
            </button>
        </div>
    );
}
