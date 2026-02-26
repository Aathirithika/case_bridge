import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Lock, Mail, User, Briefcase, ArrowLeft } from 'lucide-react';
import api from '../utils/axiosConfig';

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
            const response = await api.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));

            if (response.data.role === 'lawyer') {
                navigate('/lawyer-dashboard');
            } else {
                navigate('/client-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
            <header className="bg-stone-800 text-white px-6 py-4 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scale className="w-6 h-6" />
                    <span className="text-xl font-semibold">CaseBridge Legal Platform</span>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                    Back to Home
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="flex border-b border-amber-100">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-4 font-bold text-sm transition-colors ${isLogin ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            LOGIN
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-4 font-bold text-sm transition-colors ${!isLogin ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            REGISTER
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                                <Scale className="w-8 h-8 text-amber-700" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-stone-900 text-center mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-stone-500 text-center text-sm mb-8">
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
                                    className="w-full bg-amber-700 text-white py-4 rounded-2xl font-bold hover:bg-amber-800 transition-all shadow-lg shadow-amber-100"
                                >
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </form>
                        )}

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => navigate('/role-selection')}
                                className="text-xs text-stone-500 hover:text-stone-700 flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={12} />
                                Change selected role ({formData.role})
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}