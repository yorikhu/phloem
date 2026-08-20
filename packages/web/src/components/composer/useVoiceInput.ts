/**
 * useVoiceInput — shared Web Speech API hook.
 *
 * Used by both RetrievalComposer and ChatComposer so voice input
 * behavior stays identical across the app.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { message } from 'antd';

/** Minimal structural type for the Web Speech API (not in lib.dom for all targets). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export interface VoiceInputOptions {
  /** Called with the recognized transcript (interim + final). */
  onResult: (text: string) => void;
  /** i18n string shown when the browser lacks SpeechRecognition. */
  unsupportedMessage: string;
}

export function useVoiceInput({ onResult, unsupportedMessage }: VoiceInputOptions) {
  const speechRef = useRef<{ recognition: SpeechRecognitionLike | null; active: boolean }>({
    recognition: null,
    active: false,
  });
  const [listening, setListening] = useState(false);

  const supported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const w = window as typeof window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  const toggle = useCallback(() => {
    if (!supported) {
      void message.warning(unsupportedMessage);
      return;
    }
    if (speechRef.current.active) {
      speechRef.current.recognition?.stop();
      return;
    }
    const w = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = navigator.language || 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i]?.[0]?.transcript ?? '';
      }
      onResult(text);
    };
    recognition.onend = () => {
      speechRef.current.active = false;
      setListening(false);
    };
    recognition.onerror = () => {
      speechRef.current.active = false;
      setListening(false);
    };
    speechRef.current = { recognition, active: true };
    setListening(true);
    recognition.start();
  }, [supported, onResult, unsupportedMessage]);

  return { listening, supported, toggle };
}
