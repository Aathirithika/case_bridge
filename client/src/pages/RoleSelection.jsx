import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Globe, User, Scale } from 'lucide-react';

export default function RoleSelection() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        // Navigate to appropriate registration page based on role
        if (role === 'lawyer') {
            navigate('/lawyer-register');
        } else {
            navigate('/register', { state: { role } });
        }
    };

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
            {/* Header */}
            <header className="bg-stone-800 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="hover:bg-stone-700 p-2 rounded transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <button className="hover:bg-stone-700 p-2 rounded transition-colors">
                        <MessageCircle size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold">CaseBridge Legal Platform</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                <div className="flex items-center gap-2 text-stone-300">
                    <Globe size={20} />
                    <span>Public</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="mb-8 hover:opacity-70 transition-opacity"
                    >
                        <ArrowLeft size={32} className="text-stone-900" />
                    </button>

                    {/* Title */}
                    <h1 className="text-4xl font-bold text-stone-900 mb-3">
                        I am a...
                    </h1>
                    <p className="text-xl text-stone-600 mb-12">
                        Select your role to continue
                    </p>

                    {/* Role Cards */}
                    <div className="space-y-6">
                        {/* Client Card */}
                        <button
                            onClick={() => handleRoleSelect('client')}
                            className={`w-full bg-white rounded-2xl p-8 shadow-sm border-2 transition-all hover:shadow-md ${selectedRole === 'client' ? 'border-amber-700' : 'border-amber-200'
                                }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                                    <User className="w-10 h-10 text-amber-700" strokeWidth={2} />
                                </div>
                                <h2 className="text-2xl font-bold text-stone-900 mb-2">Client</h2>
                                <p className="text-stone-600 text-lg">
                                    Looking for legal assistance and consultation
                                </p>
                            </div>
                        </button>

                        {/* Lawyer Card */}
                        <button
                            onClick={() => handleRoleSelect('lawyer')}
                            className={`w-full bg-white rounded-2xl p-8 shadow-sm border-2 transition-all hover:shadow-md ${selectedRole === 'lawyer' ? 'border-amber-700' : 'border-amber-200'
                                }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                                    <Scale className="w-10 h-10 text-amber-700" strokeWidth={2} />
                                </div>
                                <h2 className="text-2xl font-bold text-stone-900 mb-2">Lawyer</h2>
                                <p className="text-stone-600 text-lg">
                                    Provide legal services to clients
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-stone-600 mt-8">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-amber-700 font-medium hover:underline"
                        >
                            Login
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
}