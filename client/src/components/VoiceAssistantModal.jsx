import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Send, Globe, Volume2, Loader } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import nlpProcessor from '../utils/nlpProcessor';

export default function VoiceAssistantModal({ isOpen, onClose, onSubmitIssue }) {
    const {
        language,
        languages,
        changeLanguage,
        isListening,
        transcript,
        setTranscript,
        startListening,
        stopListening,
        speak,
    } = useAccessibility();

    const [inputMethod, setInputMethod] = useState('voice'); // 'voice' or 'text'
    const [issueDescription, setIssueDescription] = useState('');
    const [nlpAnalysis, setNlpAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Update issue description when transcript changes
    useEffect(() => {
        if (transcript) {
            setIssueDescription(transcript);
            analyzeText(transcript);
        }
    }, [transcript]);

    // Analyze text using NLP processor
    const analyzeText = (text) => {
        if (!text || text.length < 10) return;

        setIsAnalyzing(true);
        setTimeout(() => {
            const analysis = nlpProcessor.processVoiceQuery(text, language);
            setNlpAnalysis(analysis);
            setIsAnalyzing(false);

            // Provide voice feedback about detected category
            if (analysis.detectedCategory && analysis.detectedCategory !== 'other') {
                const categoryNames = {
                    family: language === 'ta' ? 'குடும்ப சட்டம்' : 'Family Law',
                    property: language === 'ta' ? 'சொத்து சட்டம்' : 'Property Law',
                    criminal: language === 'ta' ? 'குற்றவியல் சட்டம்' : 'Criminal Law',
                    business: language === 'ta' ? 'வணிக சட்டம்' : 'Business Law',
                    civil: language === 'ta' ? 'சிவில் சட்டம்' : 'Civil Law',
                    labor: language === 'ta' ? 'தொழிலாளர் சட்டம்' : 'Labor Law',
                    consumer: language === 'ta' ? 'நுகர்வோர் சட்டம்' : 'Consumer Law',
                };

                const message = language === 'ta'
                    ? `இது ${categoryNames[analysis.detectedCategory]} தொடர்பான பிரச்சினை என்று தெரிகிறது`
                    : `This appears to be a ${categoryNames[analysis.detectedCategory]} issue`;

                speak(message);
            }
        }, 500);
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
            const message = language === 'ta'
                ? 'உங்கள் சட்ட பிரச்சினையை கூறுங்கள்'
                : 'Please describe your legal issue';
            speak(message);
        }
    };

    const handleTextChange = (e) => {
        const text = e.target.value;
        setIssueDescription(text);
        setTranscript(text);
        analyzeText(text);
    };

    const handleSubmit = () => {
        if (!issueDescription || issueDescription.trim().length < 20) {
            const message = language === 'ta'
                ? 'தயவுசெய்து உங்கள் பிரச்சினையை விரிவாக விவரிக்கவும்'
                : 'Please provide more details about your issue';
            speak(message);
            alert(message);
            return;
        }

        const submissionData = {
            description: issueDescription,
            detectedCategory: nlpAnalysis?.detectedCategory || 'other',
            priority: nlpAnalysis?.urgencyLevel || 'normal',
            submissionMethod: inputMethod,
            voiceTranscript: inputMethod === 'voice' ? issueDescription : null,
            nlpAnalysis: nlpAnalysis,
            language: language,
        };

        onSubmitIssue(submissionData);

        const message = language === 'ta'
            ? 'உங்கள் பிரச்சினை சமர்ப்பிக்கப்பட்டது'
            : 'Your issue has been submitted';
        speak(message);

        onClose();
    };

    const handleLanguageSwitch = () => {
        const newLang = language === 'en' ? 'ta' : 'en';
        changeLanguage(newLang);
    };

    if (!isOpen) return null;

    const caseTypeLabels = {
        en: {
            family: 'Family Law',
            property: 'Property Law',
            criminal: 'Criminal Law',
            business: 'Business Law',
            civil: 'Civil Law',
            labor: 'Labor Law',
            consumer: 'Consumer Law',
            other: 'Other',
        },
        ta: {
            family: 'குடும்ப சட்டம்',
            property: 'சொத்து சட்டம்',
            criminal: 'குற்றவியல் சட்டம்',
            business: 'வணிக சட்டம்',
            civil: 'சிவில் சட்டம்',
            labor: 'தொழிலாளர் சட்டம்',
            consumer: 'நுகர்வோர் சட்டம்',
            other: 'மற்றவை',
        },
    };

    const priorityLabels = {
        en: { high: 'High Priority', normal: 'Normal Priority', low: 'Low Priority' },
        ta: { high: 'அதிக முன்னுரிமை', normal: 'சாதாரண முன்னுரிமை', low: 'குறைந்த முன்னுரிமை' },
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-700 to-stone-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {language === 'ta' ? 'குரல் உதவியாளர்' : 'Voice Assistant'}
                            </h2>
                            <p className="text-sm text-amber-100">
                                {language === 'ta' ? 'உங்கள் சட்ட பிரச்சினையை விவரிக்கவும்' : 'Describe your legal issue'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <button
                            onClick={handleLanguageSwitch}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            title={language === 'ta' ? 'ஆங்கிலம்' : 'தமிழ்'}
                        >
                            <Globe className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Input Method Toggle */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setInputMethod('voice')}
                            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${inputMethod === 'voice'
                                ? 'bg-white text-amber-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Mic className="w-4 h-4 inline mr-2" />
                            {language === 'ta' ? 'குரல்' : 'Voice'}
                        </button>
                        <button
                            onClick={() => setInputMethod('text')}
                            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${inputMethod === 'text'
                                ? 'bg-white text-amber-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {language === 'ta' ? 'உரை' : 'Text'}
                        </button>
                    </div>

                    {/* Voice Input Section */}
                    {inputMethod === 'voice' && (
                        <div className="text-center space-y-4">
                            {/* Microphone Button */}
                            <button
                                onClick={handleMicClick}
                                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${isListening
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200'
                                    : 'bg-amber-700 hover:bg-amber-800 shadow-lg shadow-amber-200'
                                    }`}
                            >
                                {isListening ? (
                                    <MicOff className="w-10 h-10 text-white" />
                                ) : (
                                    <Mic className="w-10 h-10 text-white" />
                                )}
                            </button>

                            <p className="text-sm font-medium text-gray-600">
                                {isListening
                                    ? language === 'ta' ? 'கேட்கிறது...' : 'Listening...'
                                    : language === 'ta' ? 'பேச மைக்ரோபோனை கிளிக் செய்யவும்' : 'Click microphone to speak'}
                            </p>

                            {/* Language Indicator */}
                            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                                <span className="text-2xl">{languages[language].flag}</span>
                                <span className="text-sm font-medium text-gray-700">{languages[language].name}</span>
                            </div>
                        </div>
                    )}

                    {/* Transcription / Text Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {language === 'ta' ? 'பிரச்சினை விவரம்' : 'Issue Description'}
                        </label>
                        <textarea
                            value={issueDescription}
                            onChange={handleTextChange}
                            placeholder={
                                language === 'ta'
                                    ? 'உங்கள் சட்ட பிரச்சினையை இங்கே விவரிக்கவும்...'
                                    : 'Describe your legal issue here...'
                            }
                            className="w-full min-h-32 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                            rows={4}
                            readOnly={inputMethod === 'voice' && isListening}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {issueDescription.length} {language === 'ta' ? 'எழுத்துக்கள்' : 'characters'} (
                            {language === 'ta' ? 'குறைந்தபட்சம் 20' : 'minimum 20'})
                        </p>
                    </div>

                    {/* NLP Analysis Results */}
                    {isAnalyzing && (
                        <div className="flex items-center justify-center gap-2 text-amber-700">
                            <Loader className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">
                                {language === 'ta' ? 'பகுப்பாய்வு செய்கிறது...' : 'Analyzing...'}
                            </span>
                        </div>
                    )}

                    {nlpAnalysis && !isAnalyzing && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                                <span className="text-xl">🤖</span>
                                {language === 'ta' ? 'AI பகுப்பாய்வு' : 'AI Analysis'}
                            </h3>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-gray-500 text-xs mb-1">
                                        {language === 'ta' ? 'வழக்கு வகை' : 'Case Type'}
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {caseTypeLabels[language][nlpAnalysis.detectedCategory] ||
                                            caseTypeLabels[language].other}
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-gray-500 text-xs mb-1">
                                        {language === 'ta' ? 'முன்னுரிமை' : 'Priority'}
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {priorityLabels[language][nlpAnalysis.urgencyLevel]}
                                    </p>
                                </div>
                            </div>

                            {nlpAnalysis.completenessAnalysis && nlpAnalysis.completenessAnalysis.score < 75 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-xs text-yellow-800 font-medium mb-1">
                                        {language === 'ta' ? 'மேலும் தகவல் தேவை:' : 'Additional information needed:'}
                                    </p>
                                    <ul className="text-xs text-yellow-700 space-y-1">
                                        {nlpAnalysis.completenessAnalysis.missingInfo.map((info, idx) => (
                                            <li key={idx}>• {info}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!issueDescription || issueDescription.length < 20}
                            className="flex-1 py-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            {language === 'ta' ? 'சமர்ப்பிக்கவும்' : 'Submit Issue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
