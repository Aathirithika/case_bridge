import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Lock, Mail, User, Briefcase, ArrowLeft } from 'lucide-react';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const preSelectedRole = location.state?.role || 'client';

    const [isLogin, setIsLogin] = useState(false); // Default to register for the register page
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: preSelectedRole,
    });
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        if (isLogin) {
            setLoginData({ ...loginData, [e.target.name]: e.target.value });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
            });
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', loginData);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));

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

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            console.log('Sending registration request for role:', formData.role);
            const response = await api.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });

            console.log('Registration successful, response data:', response.data);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));

            if (response.data.role === 'lawyer') {
                console.log('Redirecting to lawyer dashboard');
                navigate('/lawyer-dashboard');
            } else {
                console.log('Redirecting to client dashboard');
                navigate('/client-dashboard');
            }
        } catch (err) {
            console.error('Registration error details:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-[#8d6e63]/10 overflow-hidden relative z-10">
                    <div className="flex border-b border-stone-100">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-5 font-black text-[11px] transition-colors tracking-[0.2em] ${isLogin ? 'text-[#4a3728] border-b-2 border-[#4a3728]' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            LOGIN
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-5 font-black text-[11px] transition-colors tracking-[0.2em] ${!isLogin ? 'text-[#4a3728] border-b-2 border-[#4a3728]' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            REGISTER
                        </button>
                    </div>

                    <div className="p-10">
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 bg-[#faf7f0] rounded-2xl flex items-center justify-center border border-[#8d6e63]/10 shadow-inner">
                                <Scale className="w-8 h-8 text-[#4a3728]" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-[#1a1a1a] text-center mb-2 tracking-tight uppercase">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-[#8d6e63] text-center text-[10px] font-black uppercase tracking-[0.2em] mb-10 italic">
                            {isLogin ? 'Sign in to your CaseBridge account' : `Join as a ${formData.role === 'lawyer' ? 'Lawyer' : 'Client'}`}
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-xs">{error}</p>
                            </div>
                        )}

                        {isLogin ? (
                            <form onSubmit={handleLoginSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={loginData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={loginData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-amber-700 text-white py-4 rounded-2xl font-bold hover:bg-amber-800 transition-all shadow-lg shadow-amber-100"
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegisterSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="At least 6 characters"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Re-enter your password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4a3728] hover:bg-[#3d2e22] text-[#faf7f0] py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#4a3728]/10 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (isLogin ? 'Authenticating...' : 'Creating Account...') : (isLogin ? 'Sign In Now' : 'Create Account')}
                                </button>
                            </form>
                        )}

                        <div className="mt-10 text-center">
                            <button
                                onClick={() => navigate('/role-selection')}
                                className="text-[10px] font-black text-[#8d6e63] hover:text-[#4a3728] transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                            >
                                <ArrowLeft size={14} />
                                Change selected role ({formData.role})
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}