import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale, CheckCircle, XCircle, Clock, Users, Shield,
    ChevronRight, AlertCircle, User, FileText, LogOut
} from 'lucide-react';
import api from '../utils/axiosConfig';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingLawyers, setPendingLawyers] = useState([]);
    const [allLawyers, setAllLawyers] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (user && !loading) {
            fetchPendingLawyers();
            fetchAllLawyers();
        }
    }, [user, loading]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            const response = await api.get('/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.role !== 'admin') {
                navigate('/');
                return;
            }

            setUser(response.data);
        } catch (error) {
            localStorage.removeItem('token');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingLawyers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/api/admin/pending-lawyers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingLawyers(res.data);
        } catch (error) {
            console.error('Error fetching pending lawyers:', error);
        }
    };

    const fetchAllLawyers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/api/admin/all-lawyers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllLawyers(res.data);
        } catch (error) {
            console.error('Error fetching all lawyers:', error);
        }
    };

    const handleVerify = async (lawyerId) => {
        setActionLoading(lawyerId);
        try {
            const token = localStorage.getItem('token');
            await api.put(`/api/admin/verify-lawyer/${lawyerId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchPendingLawyers();
            await fetchAllLawyers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to verify lawyer');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (lawyerId) => {
        if (!window.confirm('Are you sure you want to reject this lawyer?')) return;
        setActionLoading(lawyerId);
        try {
            const token = localStorage.getItem('token');
            await api.put(`/api/admin/reject-lawyer/${lawyerId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchPendingLawyers();
            await fetchAllLawyers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reject lawyer');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" />Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />Rejected</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
                <div className="text-center">
                    <Scale className="w-16 h-16 text-amber-700 animate-pulse mx-auto mb-4" />
                    <p className="text-stone-600 text-lg">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf7f0]">
            <Navbar user={user} onLogout={handleLogout} />

            {/* Admin Header Bar */}
            <div className="bg-gradient-to-r from-[#4a3728] to-[#2d2926] text-white px-6 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
                            <p className="text-white/60 text-sm font-medium">Manage lawyer verifications</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Pending Reviews</p>
                            <p className="text-3xl font-black">{pendingLawyers.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Total Lawyers</p>
                            <p className="text-3xl font-black">{allLawyers.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-amber-100 flex items-center px-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'pending' ? 'border-[#4a3728] text-[#4a3728]' : 'border-transparent text-stone-400'}`}
                >
                    Pending Verification ({pendingLawyers.length})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'all' ? 'border-[#4a3728] text-[#4a3728]' : 'border-transparent text-stone-400'}`}
                >
                    All Lawyers ({allLawyers.length})
                </button>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingLawyers.length === 0 ? (
                            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-amber-200">
                                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-stone-800">All Clear!</h3>
                                <p className="text-stone-500 mt-1">No pending lawyer verifications at the moment.</p>
                            </div>
                        ) : (
                            pendingLawyers.map((lawyer) => (
                                <div key={lawyer._id} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-200">
                                                <User className="w-7 h-7 text-amber-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-stone-900">{lawyer.name}</h3>
                                                <p className="text-sm text-stone-500">{lawyer.email}</p>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
                                                    <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                                        <FileText className="w-3 h-3 text-amber-600" />
                                                        <strong className="text-stone-700">{lawyer.barCouncilNumber}</strong>
                                                    </span>
                                                    {lawyer.location && (
                                                        <span className="text-stone-400">📍 {lawyer.location}</span>
                                                    )}
                                                    {lawyer.yearsOfExperience && (
                                                        <span className="text-stone-400">{lawyer.yearsOfExperience} yrs exp</span>
                                                    )}
                                                    {lawyer.specializations?.length > 0 && (
                                                        <span className="text-stone-400">{lawyer.specializations.join(', ')}</span>
                                                    )}
                                                    <span className="text-stone-400">
                                                        Registered: {new Date(lawyer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleVerify(lawyer._id)}
                                                disabled={actionLoading === lawyer._id}
                                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-100 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(lawyer._id)}
                                                disabled={actionLoading === lawyer._id}
                                                className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-200 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'all' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#faf7f0] border-b border-amber-100">
                                        <th className="text-left px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Lawyer</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Bar Council</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Location</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Specializations</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Status</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-50">
                                    {allLawyers.map((lawyer) => (
                                        <tr key={lawyer._id} className="hover:bg-amber-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-stone-900">{lawyer.name}</p>
                                                <p className="text-xs text-stone-400">{lawyer.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-mono font-bold text-stone-700 bg-stone-50 px-2 py-1 rounded">{lawyer.barCouncilNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">{lawyer.location || '—'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {lawyer.specializations?.slice(0, 2).map((s, i) => (
                                                        <span key={i} className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">{s}</span>
                                                    ))}
                                                    {lawyer.specializations?.length > 2 && (
                                                        <span className="text-[10px] text-stone-400 font-bold">+{lawyer.specializations.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(lawyer.verificationStatus)}</td>
                                            <td className="px-6 py-4">
                                                {lawyer.verificationStatus === 'pending' && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleVerify(lawyer._id)}
                                                            disabled={actionLoading === lawyer._id}
                                                            className="p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-700 disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(lawyer._id)}
                                                            disabled={actionLoading === lawyer._id}
                                                            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-700 disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {lawyer.verificationStatus === 'rejected' && (
                                                    <button
                                                        onClick={() => handleVerify(lawyer._id)}
                                                        disabled={actionLoading === lawyer._id}
                                                        className="p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-700 disabled:opacity-50"
                                                        title="Re-approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
