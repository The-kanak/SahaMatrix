import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mic, MicOff, Send, Volume2, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

export const AskAIPanel = ({ selectedState }) => {
  const { language, t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const recognitionRef = useRef(null);
  const [history, setHistory] = useState([
    {
      q: 'Which districts in Uttar Pradesh face the highest shortage of Insulin?',
      a: 'In Uttar Pradesh, Gorakhpur and Kanpur districts face the highest deficit risk for Insulin with under 2.5 days of buffer remaining. Rebalancing from Lucknow is currently recommended.',
      source: 'gemini',
    },
    {
      q: 'Are any cross-state shipments recommended today?',
      a: 'Yes, 4 inter-state rebalancing transfers are scheduled from Maharashtra surplus nodes (Nagpur, Hingna) to high-deficit facilities in Uttar Pradesh for Artemisinin ACT antimalarials.',
      source: 'gemini',
    },
  ]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    };
  }, []);

  const getSampleQuestions = () => {
    switch (language) {
      case 'hi':
        return [
          'उत्तर प्रदेश के कौन से जिलों में इस सप्ताह इंसुलिन खत्म हो जाएगा?',
          'महाराष्ट्र में पैरासिटामोल के स्टॉक की क्या स्थिति है?',
          'क्या तमिलनाडु के लिए कोई अंतर-राज्यीय स्थानांतरण हैं?',
          'वर्तमान में कितने प्राथमिक स्वास्थ्य केंद्रों में गंभीर चेतावनी है?',
        ];
      case 'mr':
        return [
          'उत्तर प्रदेशातील कोणत्या जिल्ह्यांत या आठवड्यात इन्सुलिन संपेल?',
          'महाराष्ट्रात पॅरासिटामॉलच्या साठ्याची काय स्थिती आहे?',
          'तामिळनाडूसाठी कोणते आंतरराज्यीय हस्तांतरण आहेत का?',
          'सध्या किती केंद्रांवर अतिगंभीर अलर्ट आहेत?',
        ];
      case 'ta':
        return [
          'இந்த வாரம் உத்தரபிரதேசத்தில் எந்த மாவட்டங்களில் இன்சுலின் தீர்ந்துவிடும்?',
          'மகாராஷ்டிராவில் பாராசிட்டமால் இருப்பு நிலை என்ன?',
          'தமிழ்நாட்டிற்கு ஏதேனும் மாநிலங்களுக்கு இடையேயான மாற்றங்கள் உள்ளதா?',
          'தற்போது எத்தனை ஆரம்ப சுகாதார நிலையங்களில் தீவிர எச்சரிக்கைகள் உள்ளன?',
        ];
      default:
        return [
          'Which districts in UP will run out of insulin this week?',
          'What is the stock status of Paracetamol in Maharashtra?',
          'Are there any inter-state transfers to Tamil Nadu?',
          'How many PHCs currently have critical stockout alerts?',
        ];
    }
  };

  const sampleQuestions = getSampleQuestions();

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice(t('voiceNotSupported'));
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    setVoiceNotice(null);
    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang =
        language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (err) => {
        setIsListening(false);
        if (err.error !== 'no-speech' && err.error !== 'aborted') {
          setVoiceNotice('Microphone error: ' + err.error);
        }
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        handleSendQuestion(transcript);
      };
      recognition.start();
    } catch (err) {
      setVoiceNotice('Failed to start speech recognition: ' + err.message);
      setIsListening(false);
    }
  };

  const handleSendQuestion = async (customQ) => {
    const qText = customQ || question;
    if (!qText.trim()) return;

    setIsAsking(true);
    setVoiceNotice(null);
    try {
      const res = await api.askAI(qText, selectedState, language);
      setHistory((prev) => [
        { q: qText, a: res.answer, source: res.source },
        ...prev,
      ]);
      setQuestion('');
    } catch (err) {
      setHistory((prev) => [
        { q: qText, a: 'Error contacting AI: ' + err.message, source: 'fallback' },
        ...prev,
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSpeak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={18} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
              {t('tabAsk')}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Voice-first natural language interface grounded strictly in live health telemetry
            </div>
          </div>
        </div>
      </div>

      {/* Voice Warning banner if unsupported */}
      {voiceNotice && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#b45309',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{voiceNotice}</span>
        </div>
      )}

      {/* Input row: Text field + Mic Button + Send Button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
          placeholder={isListening ? t('listening') : t('askPlaceholder')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: isListening ? '2px solid #ef4444' : '1px solid #cbd5e1',
            fontSize: '13px',
            outline: 'none',
          }}
        />

        {/* Microphone Button */}
        <button
          onClick={handleVoiceInput}
          style={{
            backgroundColor: isListening ? '#ef4444' : '#f1f5f9',
            color: isListening ? '#ffffff' : '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Click to speak (Web Speech API)"
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Send Button */}
        <button
          onClick={() => handleSendQuestion()}
          disabled={!question.trim() || isAsking}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            height: '42px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: !question.trim() || isAsking ? 'not-allowed' : 'pointer',
            opacity: !question.trim() || isAsking ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Send size={15} />
          {isAsking ? '...' : t('askSend')}
        </button>
      </div>

      {/* Example Prompt Chips */}
      <div>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
          {t('exampleQuestionsTitle')}:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq);
                handleSendQuestion(sq);
              }}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                color: '#475569',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
        {history.map((chat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              Q: {chat.q}
            </div>
            <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
              {chat.a}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid #edf2f7',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: chat.source === 'gemini' ? '#dcfce7' : '#f1f5f9',
                  color: chat.source === 'gemini' ? '#15803d' : '#64748b',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Sparkles size={10} />
                {chat.source === 'gemini' ? t('poweredByGemini') : t('fallbackMode')}
              </span>

              {window.speechSynthesis && (
                <button
                  onClick={() => handleSpeak(chat.a)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Volume2 size={13} />
                  {t('readAloud')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
