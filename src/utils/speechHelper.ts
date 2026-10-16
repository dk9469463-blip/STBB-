import { AssistantLanguage } from './chatStorage';

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'Audio recording is not supported in this environment.' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately after permission check
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        granted: false,
        error: 'Microphone permission was denied. Please allow microphone access in your browser site settings.',
      };
    }
    return {
      granted: false,
      error: `Could not access microphone: ${err.message || 'Check audio hardware'}`,
    };
  }
}

export interface SpeechRecognizerHandle {
  start: () => void;
  stop: () => void;
}

export function createSpeechRecognizer(options: {
  language: AssistantLanguage;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMsg: string) => void;
  onEnd: () => void;
}): SpeechRecognizerHandle | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError('Voice recognition is not supported in this browser. Please type your query.');
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = true;

  // Language mapping
  let langCode = 'en-US';
  if (options.language === 'urdu') {
    langCode = 'ur-PK';
  } else if (options.language === 'sindhi') {
    langCode = 'sd-PK';
  }
  recognizer.lang = langCode;

  recognizer.onresult = (event: any) => {
    // The Web Speech API result list contains the whole current utterance,
    // including previous final chunks and the latest interim chunk. Return
    // the complete utterance so callers can replace the draft instead of
    // appending the same words repeatedly.
    const chunks: string[] = [];
    let allResultsFinal = event.results.length > 0;

    for (let i = 0; i < event.results.length; i++) {
      const chunk = String(event.results[i]?.[0]?.transcript || '').trim();
      if (chunk) chunks.push(chunk);
      if (!event.results[i]?.isFinal) allResultsFinal = false;
    }

    const output = chunks.join(' ').replace(/\s+/g, ' ').trim();
    if (output) {
      options.onResult(output, allResultsFinal);
    }
  };

  recognizer.onerror = (event: any) => {
    let msg = 'Speech recognition error occurred.';
    if (event.error === 'not-allowed') {
      msg = 'Microphone permission denied. Please allow microphone access in browser settings.';
    } else if (event.error === 'no-speech') {
      msg = 'No speech detected. Please speak into your microphone.';
    } else if (event.error === 'network') {
      msg = 'Network error during voice recognition.';
    }
    options.onError(msg);
  };

  recognizer.onend = () => {
    options.onEnd();
  };

  return {
    start: () => {
      try {
        recognizer.start();
      } catch (err: any) {
        options.onError(`Unable to start microphone: ${err.message}`);
      }
    },
    stop: () => {
      try {
        recognizer.stop();
      } catch {
        // ignore
      }
    },
  };
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*_#`$]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\n+/g, '. ')
    .trim()
    .slice(0, 1000);
}

export function speakText(
  text: string,
  language: AssistantLanguage,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) return null;

  window.speechSynthesis.cancel();

  const clean = cleanTextForSpeech(text);
  if (!clean) return null;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  if (language === 'urdu') {
    const urVoice = voices.find((v) => v.lang.startsWith('ur'));
    if (urVoice) utterance.voice = urVoice;
    else utterance.lang = 'ur-PK';
  } else if (language === 'sindhi') {
    const sdVoice = voices.find((v) => v.lang.startsWith('sd'));
    if (sdVoice) utterance.voice = sdVoice;
    else {
      const fallback = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi'));
      if (fallback) utterance.voice = fallback;
      utterance.lang = 'sd-PK';
    }
  } else {
    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    else utterance.lang = 'en-US';
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function pauseSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
