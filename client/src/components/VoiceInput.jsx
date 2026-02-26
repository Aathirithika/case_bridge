import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export default function VoiceInput({ onTranscriptChange, placeholder = 'Click microphone to speak...' }) {
    const { startListening, stopListening, isListening, transcript, setTranscript } = useAccessibility();
    const [localTranscript, setLocalTranscript] = useState('');

    useEffect(() => {
        if (transcript) {
            setLocalTranscript(transcript);
            if (onTranscriptChange) {
                onTranscriptChange(transcript);
            }
        }
    }, [transcript, onTranscriptChange]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleTextChange = (e) => {
        const newValue = e.target.value;
        setLocalTranscript(newValue);
        setTranscript(newValue);
        if (onTranscriptChange) {
            onTranscriptChange(newValue);
        }
    };

    return (
        <div className="relative">
            <textarea
                value={localTranscript}
                onChange={handleTextChange}
                placeholder={placeholder}
                className="w-full min-h-32 p-4 pr-16 bg-amber-50 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={4}
            />
            <button
                type="button"
                onClick={handleMicClick}
                className={`absolute right-4 top-4 p-3 rounded-full transition-all ${isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-amber-700 hover:bg-amber-800 text-white'
                    }`}
                title={isListening ? 'Stop recording' : 'Start recording'}
            >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            {isListening && (
                <div className="absolute left-4 top-4">
                    <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Listening...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
