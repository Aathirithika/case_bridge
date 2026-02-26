import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState(null);

  // Supported languages - Tamil and English only
  const languages = {
    en: { 
      name: 'English', 
      code: 'en-IN', 
      flag: '🇮🇳',
      direction: 'ltr'
    },
    ta: { 
      name: 'தமிழ்', 
      code: 'ta-IN', 
      flag: '🇮🇳',
      direction: 'ltr'
    },
  };

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const savedVoice = localStorage.getItem('voiceEnabled');
    
    if (savedLanguage && languages[savedLanguage]) {
      setLanguage(savedLanguage);
    }
    
    if (savedVoice !== null) {
      setVoiceEnabled(savedVoice === 'true');
    }
  }, []);

  // Save language preference when changed
  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
    
    // Speak language change confirmation
    if (voiceEnabled) {
      const message = newLang === 'ta' 
        ? 'மொழி தமிழாக மாற்றப்பட்டது' 
        : 'Language changed to English';
      speak(message);
    }
  };

  // Speech Recognition setup
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === 'ta' 
        ? 'உங்கள் உலாவியில் குரல் அங்கீகாரம் ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge ஐப் பயன்படுத்தவும்.'
        : 'Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const newRecognition = new SpeechRecognition();
    
    newRecognition.continuous = false;
    newRecognition.interimResults = true;
    newRecognition.lang = languages[language].code;
    newRecognition.maxAlternatives = 1;

    newRecognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    newRecognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    newRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        const message = language === 'ta' 
          ? 'குரல் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'No speech detected. Please try again.';
        speak(message);
      }
    };

    newRecognition.onend = () => {
      setIsListening(false);
    };

    newRecognition.start();
    setRecognition(newRecognition);
    return newRecognition;
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  };

  // Text-to-Speech
  const speak = (text, rate = 0.9) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languages[language].code;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle voice assistance
  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    localStorage.setItem('voiceEnabled', newState.toString());
    
    if (newState) {
      const message = language === 'ta' 
        ? 'குரல் உதவி இயக்கப்பட்டது'
        : 'Voice assistance enabled';
      speak(message);
    }
  };

  const value = {
    language,
    languages,
    changeLanguage,
    isListening,
    isSpeaking,
    transcript,
    setTranscript,
    voiceEnabled,
    setVoiceEnabled,
    toggleVoice,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};