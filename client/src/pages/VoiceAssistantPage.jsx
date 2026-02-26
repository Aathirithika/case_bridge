import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  Send,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Scale
} from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import VoiceInput from '../components/VoiceInput';
import LanguageSelector from '../components/LanguageSelector';
import { getTranslation } from '../translations';

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const { language, speak } = useAccessibility();
  const t = getTranslation(language);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Example queries in current language
  const examples = [
    t.voice.examples.property,
    t.voice.examples.divorce,
    t.voice.examples.business,
    t.voice.examples.accident,
  ];

  useEffect(() => {
    // Welcome message when page loads
    speak(t.voice.subtitle);
  }, [language]);

  const handleTranscriptChange = (transcript) => {
    setQuery(transcript);
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      alert('Please describe your legal issue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would send to backend for processing
      const response = await fetch('/api/voice/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          query,
          language,
          category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        speak('Query submitted successfully. We will connect you with a suitable lawyer.');

        // Navigate to dashboard or results page
        setTimeout(() => {
          navigate('/client-dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    speak(example);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-stone-800 text-white px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="hover:bg-stone-700 p-2 rounded transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Mic className="w-6 h-6" />
              <span className="text-xl font-semibold">{t.voice.title}</span>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <Scale className="w-10 h-10 text-amber-700" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            {t.voice.title}
          </h1>
          <p className="text-lg text-stone-600">
            {t.voice.subtitle}
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-gradient-to-r from-amber-50 to-stone-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-amber-700 p-3 rounded-full">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                {t.voice.instructions}
              </h3>
              <ul className="text-stone-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">1.</span>
                  <span>Click the microphone button below</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">2.</span>
                  <span>Speak clearly about your legal problem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">3.</span>
                  <span>No need for legal terms - use simple words</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">4.</span>
                  <span>Submit and we'll find the right lawyer for you</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Voice Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-8">
          <label className="block text-lg font-semibold text-stone-900 mb-4">
            {t.voice.describe}
          </label>
          <VoiceInput
            onTranscriptChange={handleTranscriptChange}
            placeholder={t.voice.placeholder}
          />
        </div>

        {/* Category Selection (Optional) */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-8">
          <label className="block text-lg font-semibold text-stone-900 mb-4">
            Type of Legal Issue (Optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(t.legalCategories).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${category === key
                  ? 'border-amber-700 bg-amber-50 text-amber-700 font-semibold'
                  : 'border-amber-200 hover:border-amber-300 text-stone-700'
                  }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Example Queries */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-semibold text-stone-900">
              {t.voice.examples.title}
            </h3>
          </div>
          <div className="space-y-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-700 mt-1 flex-shrink-0" />
                  <span className="text-stone-700">{example}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t.voice.processing}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{t.voice.submit}</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-stone-200 hover:bg-stone-300 text-stone-700 text-lg font-semibold rounded-xl transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 text-center">
            🔒 Your information is secure and confidential. We will only share it with verified lawyers who can help you.
          </p>
        </div>
      </main>
    </div>

  );
}