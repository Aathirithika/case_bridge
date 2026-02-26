import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, LogOut, User, MessageCircle } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
    const navigate = useNavigate();

    return (
        <>
            {/* Top Bar */}
            <div className="bg-[#1a1a1a] border-b border-black/10 py-1.5 hidden md:block">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[11px] font-medium text-[#faf7f0]/70">
                    <div className="flex gap-6 uppercase tracking-wider">
                        <span className="cursor-pointer hover:text-white transition-colors">Digital Justice</span>
                        <span className="cursor-pointer hover:text-white transition-colors">Legal Aid</span>
                        <span className="cursor-pointer hover:text-white transition-colors">Resource Center</span>
                    </div>
                    <div className="flex gap-6 uppercase tracking-wider">
                        <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
                        <span className="cursor-pointer hover:text-white transition-colors">Contact Support</span>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <header className="bg-white border-b border-[#8d6e63]/10 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-10 h-10 bg-[#4a3728] rounded-lg flex items-center justify-center">
                                <Scale className="w-6 h-6 text-[#faf7f0]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight leading-none uppercase">
                                    CASE<span className="text-[#4a3728]">BRIDGE</span>
                                </h1>
                                <p className="text-[10px] text-[#8d6e63] font-bold uppercase tracking-[0.2em] mt-0.5">Your Trusted Legal Partner</p>
                            </div>
                        </div>

                        <nav className="hidden lg:flex items-center gap-8 text-[12px] font-extrabold text-stone-500 uppercase tracking-widest">
                            <a href="#" className="hover:text-[#4a3728] transition-colors">Find a Lawyer</a>
                            <a href="#" className="hover:text-[#4a3728] transition-colors">Legal Advice</a>
                            <a href="#" className="hover:text-[#4a3728] transition-colors">IPC Sections</a>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <button
                                    onClick={() => navigate('/messages')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#faf7f0] text-[#4a3728] hover:bg-[#f3efdf] rounded-lg transition-all text-xs font-bold uppercase tracking-wider border border-[#8d6e63]/20"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Messages
                                </button>
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-lg">
                                    <div className="p-1 bg-white rounded-full shadow-sm">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{user.name}</span>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-[11px] font-black text-stone-400 hover:text-[#4a3728] transition-colors uppercase tracking-[0.2em]"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/role-selection')}
                                    className="px-6 py-2.5 bg-[#4a3728] text-[#faf7f0] rounded-md hover:bg-[#3d2e22] transition-all font-black text-[11px] tracking-widest"
                                >
                                    GET STARTED
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
