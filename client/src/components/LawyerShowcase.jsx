import React from 'react';
import { Star, Search, Briefcase, MessageCircle, Phone } from 'lucide-react';

export default function LawyerShowcase({ lawyers, onConsult, onViewProfile }) {
    if (!lawyers || lawyers.length === 0) return null;

    return (
        <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">
                        Top-rated lawyers in India
                    </h2>
                    <p className="text-[#8d6e63] text-sm mt-1 font-medium italic">Legal experts hand-picked for your specific needs</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lawyers.map((lawyer) => (
                    <div key={lawyer._id} className="bg-white rounded-md border border-[#8d6e63]/20 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex gap-5 mb-5">
                                <div className="w-24 h-24 bg-[#4a3728] rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#faf7f0] shadow-lg group-hover:scale-110 transition-transform">
                                    {lawyer.profilePicture ? (
                                        <img src={lawyer.profilePicture} alt={lawyer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={`https://www.gravatar.com/avatar/${lawyer._id}?d=identicon`} alt={lawyer.name} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[18px] font-black text-[#1a1a1a] mb-1 leading-tight group-hover:text-[#4a3728] transition-colors">
                                        Advocate {lawyer.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                        <div className="flex text-amber-500">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                        </div>
                                        <span className="text-[11px] font-black text-gray-700">4.7</span>
                                        <span className="text-[11px] font-medium text-gray-400">| 100+ cases</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                            <Search className="w-3.5 h-3.5 text-[#8d6e63]" />
                                            <span>{lawyer.location || 'New Delhi, Delhi'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                            <Briefcase className="w-3.5 h-3.5 text-[#8d6e63]" />
                                            <span>{lawyer.yearsOfExperience || '12'} yrs Experience</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-[#faf7f0]">
                                <p className="text-[10px] font-black text-[#8d6e63] uppercase tracking-[0.15em] mb-2">Specializations</p>
                                <p className="text-[12px] text-gray-700 font-medium line-clamp-1 italic">
                                    {lawyer.specializations?.join(', ') || 'Property Law, Civil Law, Family Law'}
                                </p>
                            </div>
                        </div>
                        <div className="border-t border-[#8d6e63]/10 flex divide-x divide-[#8d6e63]/10 bg-[#faf7f0]/10">
                            <button
                                onClick={() => onViewProfile(lawyer._id)}
                                className="flex-1 py-4 text-[11px] font-black text-gray-400 hover:text-[#1a1a1a] hover:bg-[#faf7f0] transition-all uppercase tracking-[0.2em]"
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => onConsult(lawyer)}
                                className="flex-1 py-4 text-[11px] font-black text-[#4a3728] hover:bg-[#faf7f0] transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Consult
                            </button>
                            <a
                                href={`tel:${lawyer.phone || '9876543210'}`}
                                className="flex-1 py-4 text-[11px] font-black text-[#8d6e63] hover:bg-[#faf7f0] transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 border-l border-[#8d6e63]/10"
                            >
                                <Phone className="w-4 h-4" />
                                Call
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
