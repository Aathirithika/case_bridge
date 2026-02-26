import React from 'react';
import { Scale } from 'lucide-react';

export default function SiteFooter() {
    return (
        <footer className="bg-white py-12 border-t border-[#8d6e63]/10">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2 grayscale brightness-50 opacity-50">
                    <Scale className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-[0.2em]">CaseBridge</span>
                </div>
                <div className="flex gap-10 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    <a href="#" className="hover:text-[#4a3728] transition-colors">Career</a>
                    <a href="#" className="hover:text-[#4a3728] transition-colors">Press</a>
                    <a href="#" className="hover:text-[#4a3728] transition-colors">Trust Center</a>
                    <a href="#" className="hover:text-[#4a3728] transition-colors">Social Impact</a>
                </div>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">© 2026 CASEBRIDGE LEGAL</p>
            </div>
        </footer>
    );
}
