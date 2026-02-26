import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail } from 'lucide-react';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', formData);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));

            // Redirect based on role
            if (response.data.role === 'lawyer') {
                navigate('/lawyer-dashboard');
            } else {
                navigate('/client-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf7f0] flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-5">
                    <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#8d6e63] rounded-full blur-[120px]"></div>
                    <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-[#4a3728] rounded-full blur-[120px]"></div>
                </div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-[#8d6e63]/10 overflow-hidden">
                        <div className="flex border-b border-stone-100">
                            <button
                                className="flex-1 py-5 font-black text-[11px] text-[#4a3728] border-b-2 border-[#4a3728] tracking-[0.2em]"
                            >
                                LOGIN
                            </button>
                            <button
                                onClick={() => navigate('/role-selection')}
                                className="flex-1 py-5 font-black text-[11px] text-stone-400 hover:text-stone-600 transition-colors tracking-[0.2em]"
                            >
                                REGISTER
                            </button>
                        </div>

                        <div className="p-10 text-center">
                            <div className="flex justify-center mb-8">
                                <div className="w-16 h-16 bg-[#faf7f0] rounded-2xl flex items-center justify-center border border-[#8d6e63]/10 shadow-inner">
                                    <Scale className="w-8 h-8 text-[#4a3728]" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-[#1a1a1a] mb-2 tracking-tight uppercase">
                                Welcome Back
                            </h2>
                            <p className="text-[#8d6e63] text-xs font-bold uppercase tracking-widest mb-10 italic">
                                Secure access to your legal portal
                            </p>

                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg text-left">
                                    <p className="text-red-600 text-[11px] font-bold uppercase tracking-wider">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="text-left">
                                    <label className="block text-[10px] font-black text-[#8d6e63] uppercase tracking-[0.2em] mb-2.5 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d6e63]/40 w-4 h-4 group-focus-within:text-[#4a3728] transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a3728]/10 focus:border-[#4a3728] text-sm font-medium transition-all"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="text-left">
                                    <label className="block text-[10px] font-black text-[#8d6e63] uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d6e63]/40 w-4 h-4 group-focus-within:text-[#4a3728] transition-colors" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-[#faf7f0]/50 border border-[#8d6e63]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a3728]/10 focus:border-[#4a3728] text-sm font-medium transition-all"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end px-1">
                                    <button type="button" className="text-[10px] font-black text-[#8d6e63] hover:text-[#4a3728] transition-colors uppercase tracking-widest">
                                        Forgot password?
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4a3728] hover:bg-[#3d2e22] text-[#faf7f0] py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#4a3728]/10 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Authenticating...' : 'Sign In Now'}
                                </button>
                            </form>

                            <p className="mt-10 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                                Don't have an account?{' '}
                                <button
                                    onClick={() => navigate('/role-selection')}
                                    className="text-[#4a3728] hover:underline"
                                >
                                    Register now
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}