import React, { useState, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useVoiceCommands } from '../../hooks/voice/useVoiceCommands';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

/**
 * GlobalVoiceControl
 * 
 * A header-integrated microphone component that listens for 
 * app-wide voice commands and triggers UI actions.
 */
export function GlobalVoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { processText } = useVoiceCommands();

  const startRecording = async () => {
    try {
      console.log('🎙️ Global Voice active...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleTranscription(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsListening(true);

      // AUTO-STOP: Commands are short, but 4s allows for full sentences
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('🎙️ Auto-stopping Global Voice...');
          stopRecording();
        }
      }, 4000);

    } catch (err) {
      console.error('🎙️ Global Voice error:', err);
      toast.error('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const handleTranscription = async (blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      
      const response = await api.post('/stt/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data?.success && response.data?.text) {
        const text = response.data.text;
        const result = processText(text);
        
        if (result.matched) {
          toast.success(result.label, {
            icon: '🎙️',
            style: {
              borderRadius: '20px',
              background: 'hsl(var(--secondary))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--primary) / 0.2)',
              fontWeight: 'bold',
              fontSize: '12px'
            }
          });
        } else {
          // If no command matched, just show what was heard
          toast(`Heard: "${text}"`, {
            icon: '💬',
            style: {
              borderRadius: '20px',
              background: 'hsl(var(--secondary) / 0.8)',
              fontSize: '11px'
            }
          });
        }
      }
    } catch (err) {
      console.error('🎙️ Global Transcription error:', err);
      toast.error('Voice processing failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <button
      onClick={isListening ? stopRecording : startRecording}
      disabled={isTranscribing}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-[12px] transition-all duration-500",
        isListening 
          ? "bg-primary text-white scale-110 shadow-lg shadow-primary/40" 
          : "bg-card text-primary hover:bg-primary/10",
        isTranscribing && "opacity-50 cursor-wait"
      )}
      title="Global Voice Command"
    >
      {isListening && (
        <span className="absolute inset-0 rounded-[12px] bg-primary animate-ping opacity-40" />
      )}
      
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isListening ? (
        <StopIcon className="h-3 w-3 fill-current animate-pulse" />
      ) : (
        <Mic className="h-4 w-4 transition-transform hover:scale-110" />
      )}
    </button>
  );
}

// Simple internal icon for Stop state
function StopIcon({ className }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
