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
        password: '',
        profilePicture: ''
    });

    const [verificationStatus, setVerificationStatus] = useState({
        verified: false,
        pendingManualReview: false,
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
                pendingManualReview: false,
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
                    pendingManualReview: false,
                    loading: false,
                    error: '',
                    lawyerName: response.data.lawyerData.name
                });

                // Auto-fill name from verification
                setFormData(prev => ({
                    ...prev,
                    fullName: response.data.lawyerData.name
                }));
            } else if (response.data.pendingManualReview) {
                setVerificationStatus({
                    verified: false,
                    pendingManualReview: true,
                    loading: false,
                    error: '',
                    lawyerName: ''
                });
            }
        } catch (error) {
            setVerificationStatus({
                verified: false,
                pendingManualReview: false,
                loading: false,
                error: error.response?.data?.message || 'Verification failed. Please check the number.',
                lawyerName: ''
            });
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Photo size should be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    profilePicture: reader.result
                }));
            };
            reader.readAsDataURL(file);
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
        if (!verificationStatus.verified && !verificationStatus.pendingManualReview) {
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
                if (response.data.pendingReview) {
                    // Pending review — show step 3 confirmation
                    setStep(3);
                } else {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data));
                    alert('Registration successful!');
                    navigate('/lawyer-dashboard');
                }
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
                                    disabled={verificationStatus.verified || verificationStatus.pendingManualReview}
                                />
                                <button
                                    onClick={verifyBarCouncilNumber}
                                    disabled={verificationStatus.loading || verificationStatus.verified || verificationStatus.pendingManualReview || !formData.barCouncilNumber}
                                    className="px-8 py-4 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verificationStatus.loading ? 'Verifying...' : verificationStatus.verified ? 'Verified' : 'Verify'}
                                </button>
                            </div>

                            {/* Verification Status Messages */}
                            {verificationStatus.error && (
                                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={20} />
                                    <p className="text-sm font-bold">{verificationStatus.error}</p>
                                </div>
                            )}

                            {verificationStatus.verified && (
                                <div className="mt-3 flex items-center justify-between gap-2 text-green-700 bg-green-50 p-4 rounded-xl border border-green-100 animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <CheckCircle size={24} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-wider">Identity Verified</p>
                                            <p className="text-lg font-bold text-stone-900">{verificationStatus.lawyerName}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-green-200">
                                        Verified Pro
                                    </div>
                                </div>
                            )}

                            {verificationStatus.pendingManualReview && (
                                <div className="mt-3 flex items-center justify-between gap-2 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                            <AlertCircle size={24} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-wider">Manual Review Required</p>
                                            <p className="text-xs text-stone-600 mt-0.5">Your Bar Council number was not found in our dataset. You can still register — an admin will verify your credentials.</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-amber-200 whitespace-nowrap">
                                        Pending Review
                                    </div>
                                </div>
                            )}

                            <p className="mt-4 text-xs font-medium text-stone-400 uppercase tracking-widest">
                                YOUR BAR COUNCIL NUMBER IS SECURELY VERIFIED AGAINST BAR COUNCIL OF INDIA RECORDS
                            </p>
                        </div>

                        {/* Show remaining fields after verification or pending manual review */}
                        {(verificationStatus.verified || verificationStatus.pendingManualReview) && (
                            <>
                                {/* Full Name */}
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
                                        readOnly={verificationStatus.verified}
                                    />
                                    <p className="mt-2 text-sm text-stone-500">
                                        {verificationStatus.verified ? 'Auto-filled from Bar Council records' : 'Enter your full name as per Bar Council records'}
                                    </p>
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

                        {/* Profile Photo */}
                        <div>
                            <label className="block text-base font-semibold text-stone-900 mb-3">
                                Profile Photo
                            </label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-amber-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-amber-300">
                                    {formData.profilePicture ? (
                                        <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-amber-400 text-xs font-bold text-center px-2">No Photo</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        id="photo-upload"
                                    />
                                    <label
                                        htmlFor="photo-upload"
                                        className="inline-block px-6 py-3 bg-stone-800 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-stone-700 transition-colors"
                                    >
                                        Upload Photo
                                    </label>
                                    <p className="mt-2 text-xs text-stone-500">JPG, PNG (Max 2MB). This photo will be visible to clients.</p>
                                </div>
                            </div>
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

            {/* Step 3: Pending Review Confirmation */}
            {step === 3 && (
                <div className="px-6 py-16 max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <AlertCircle size={40} className="text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-4">
                        Registration Under Review
                    </h1>
                    <p className="text-lg text-stone-600 mb-3">
                        Your registration has been submitted successfully.
                    </p>
                    <p className="text-stone-500 mb-10">
                        Since your Bar Council number was not found in our automated records, an <strong className="text-stone-800">admin will manually verify</strong> your credentials. You will be able to log in once your account is approved.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-10 text-left">
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">What happens next?</p>
                        <ul className="space-y-2 text-sm text-stone-600">
                            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">1.</span> An admin reviews your Bar Council credentials</li>
                            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">2.</span> Once approved, your account is activated</li>
                            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">3.</span> You can then log in to CaseBridge and start accepting cases</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-10 py-4 bg-[#4a3728] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#3d2e22] transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            )}
        </div>
    );
}
