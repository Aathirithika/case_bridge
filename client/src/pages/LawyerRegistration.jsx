import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

export default function LawyerRegistration() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        barCouncilNumber: '',
        yearsOfExperience: '',
        location: '',
        specializations: [],
        password: ''
    });

    const [verificationStatus, setVerificationStatus] = useState({
        verified: false,
        loading: false,
        error: '',
        lawyerName: ''
    });

    const [submitting, setSubmitting] = useState(false);

    const specializations = [
        'Criminal Law',
        'Civil Law',
        'Family Law',
        'Corporate Law',
        'Property Law',
        'Consumer Law',
        'Tax Law',
        'Labour Law'
    ];

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        // Reset verification if bar council number changes
        if (e.target.name === 'barCouncilNumber') {
            setVerificationStatus({
                verified: false,
                loading: false,
                error: '',
                lawyerName: ''
            });
        }
    };

    const verifyBarCouncilNumber = async () => {
        if (!formData.barCouncilNumber) {
            setVerificationStatus(prev => ({ ...prev, error: 'Please enter a Bar Council Number' }));
            return;
        }

        setVerificationStatus(prev => ({ ...prev, loading: true, error: '' }));

        try {
            const response = await api.post('/api/auth/verify-bar-council', {
                barCouncilNumber: formData.barCouncilNumber
            });

            if (response.data.isValid) {
                setVerificationStatus({
                    verified: true,
                    loading: false,
                    error: '',
                    lawyerName: response.data.lawyerData.name
                });

                // Auto-fill name from verification
                setFormData(prev => ({
                    ...prev,
                    fullName: response.data.lawyerData.name
                }));
            }
        } catch (error) {
            setVerificationStatus({
                verified: false,
                loading: false,
                error: error.response?.data?.message || 'Verification failed. Please check the number.',
                lawyerName: ''
            });
        }
    };

    const toggleSpecialization = (spec) => {
        setFormData({
            ...formData,
            specializations: formData.specializations.includes(spec)
                ? formData.specializations.filter(s => s !== spec)
                : [...formData.specializations, spec]
        });
    };

    const handleNext = () => {
        // Validate step 1
        if (!verificationStatus.verified) {
            alert('Please verify your Bar Council Number first');
            return;
        }
        if (!formData.fullName || !formData.email || !formData.phone) {
            alert('Please fill in all required fields');
            return;
        }
        setStep(2);
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigate('/role-selection');
        }
    };

    const handleSubmit = async () => {
        // Validate step 2
        if (!formData.password || formData.password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        if (formData.specializations.length === 0) {
            alert('Please select at least one specialization');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post('/api/auth/register-lawyer', formData);

            if (response.status === 201) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data));
                alert('Registration successful!');
                navigate('/lawyer-dashboard');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-amber-50">
            {/* Step 1: Basic Information */}
            {step === 1 && (
                <div className="px-6 py-8 max-w-4xl mx-auto">
                    <button onClick={handleBack} className="mb-8 hover:opacity-70 transition-opacity">
                        <ArrowLeft size={28} className="text-stone-900" />
                    </button>

                    <h1 className="text-4xl font-bold text-stone-900 mb-3">
                        Register as Lawyer
                    </h1>
                    <p className="text-lg text-stone-600 mb-12">
                        Join our verified legal professionals
                    </p>

                    <div className="space-y-8">
                        {/* Bar Council MS Number - First for verification */}
                        <div>
                            <label className="block text-base font-semibold text-stone-900 mb-3">
                                Bar Council MS Number *
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    name="barCouncilNumber"
                                    value={formData.barCouncilNumber}
                                    onChange={handleInputChange}
                                    placeholder="MS12345"
                                    className={`flex-1 px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 ${verificationStatus.error ? 'ring-2 ring-red-500' : 'focus:ring-amber-500'
                                        }`}
                                    disabled={verificationStatus.verified}
                                />
                                <button
                                    onClick={verifyBarCouncilNumber}
                                    disabled={verificationStatus.loading || verificationStatus.verified || !formData.barCouncilNumber}
                                    className="px-8 py-4 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verificationStatus.loading ? 'Verifying...' : verificationStatus.verified ? 'Verified' : 'Verify'}
                                </button>
                            </div>

                            {/* Verification Status Messages */}
                            {verificationStatus.error && (
                                <div className="mt-3 flex items-center gap-2 text-red-600">
                                    <AlertCircle size={18} />
                                    <p className="text-sm font-medium">{verificationStatus.error}</p>
                                </div>
                            )}

                            {verificationStatus.verified && (
                                <div className="mt-3 flex items-center gap-2 text-green-600">
                                    <CheckCircle size={18} />
                                    <p className="text-sm font-medium">Verified: {verificationStatus.lawyerName}</p>
                                </div>
                            )}

                            <p className="mt-2 text-sm text-stone-500">
                                Your Bar Council number will be verified against official records
                            </p>
                        </div>

                        {/* Show remaining fields only after verification */}
                        {verificationStatus.verified && (
                            <>
                                {/* Full Name - Auto-filled from verification */}
                                <div>
                                    <label className="block text-base font-semibold text-stone-900 mb-3">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Adv. Your Full Name"
                                        className="w-full px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        readOnly
                                    />
                                    <p className="mt-2 text-sm text-stone-500">Auto-filled from Bar Council records</p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-base font-semibold text-stone-900 mb-3">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your@email.com"
                                        className="w-full px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-base font-semibold text-stone-900 mb-3">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-amber-700 hover:bg-amber-800 text-white text-lg font-semibold py-4 rounded-xl transition-colors shadow-lg mt-8"
                                >
                                    Next
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Additional Details */}
            {step === 2 && (
                <div className="px-6 py-8 max-w-4xl mx-auto">
                    <button onClick={handleBack} className="mb-8 hover:opacity-70 transition-opacity">
                        <ArrowLeft size={28} className="text-stone-900" />
                    </button>

                    <h1 className="text-4xl font-bold text-stone-900 mb-3">
                        Professional Details
                    </h1>
                    <p className="text-lg text-stone-600 mb-12">
                        Tell us about your expertise
                    </p>

                    <div className="space-y-8">
                        {/* Years of Experience */}
                        <div>
                            <label className="block text-base font-semibold text-stone-900 mb-3">
                                Years of Experience
                            </label>
                            <input
                                type="number"
                                name="yearsOfExperience"
                                value={formData.yearsOfExperience}
                                onChange={handleInputChange}
                                placeholder="5"
                                min="0"
                                className="w-full px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-base font-semibold text-stone-900 mb-3">
                                Location (City, State)
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="Mumbai, Maharashtra"
                                className="w-full px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        {/* Specializations */}
                        <div>
                            <label className="block text-base font-semibold text-stone-900 mb-3">
                                Specializations *
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {specializations.map((spec) => (
                                    <button
                                        key={spec}
                                        type="button"
                                        onClick={() => toggleSpecialization(spec)}
                                        className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${formData.specializations.includes(spec)
                                            ? 'bg-amber-700 text-white'
                                            : 'bg-amber-100 text-stone-700 hover:bg-amber-200'
                                            }`}
                                    >
                                        {spec}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-sm text-stone-500">Select at least one specialization</p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-base font-semibold text-stone-900 mb-3">
                                Password *
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Minimum 6 characters"
                                className="w-full px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-amber-700 hover:bg-amber-800 text-white text-lg font-semibold py-4 rounded-xl transition-colors shadow-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Complete Registration'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
