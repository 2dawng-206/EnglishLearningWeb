// TypeScript's bundled DOM lib already declares SpeechRecognitionEvent,
// SpeechRecognitionErrorEvent, SpeechRecognitionResult(List), and
// SpeechRecognitionAlternative — but not the SpeechRecognition interface
// itself, nor the (still vendor-prefixed in most browsers) constructor on
// `window`. This file adds only what's missing, reusing the existing types.

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
