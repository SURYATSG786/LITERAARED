import { useState, useEffect, useRef, useCallback } from "react";
import { getLangLocale } from "../audio";

export function useSpeechRecognition(lang = "en") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const autoStopTimerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognitionClass =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
    } else {
      setIsSupported(true);
    }

    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);

    const SpeechRecognitionClass =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognitionClass) {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      setIsSupported(false);
      return;
    }

    // Request mic permission explicitly if available
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        console.warn("Microphone permission check:", micErr);
        if (micErr.name === "NotAllowedError" || micErr.name === "PermissionDeniedError") {
          setError("Microphone permission was denied. Please allow microphone access in your browser settings.");
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = getLangLocale(lang);

      recognition.onstart = () => {
        setListening(true);
        isListeningRef.current = true;
        setError(null);

        // Auto stop after 7 seconds if user stays silent
        if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }
        }, 7000);
      };

      recognition.onresult = (event) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const res = event.results[i];
          for (let k = 0; k < res.length; k += 1) {
            const altText = res[k].transcript;
            if (res.isFinal) {
              if (!finalStr.includes(altText)) {
                finalStr += (finalStr ? " " : "") + altText;
              }
            } else {
              interimStr += (interimStr ? " " : "") + altText;
            }
          }
        }

        if (finalStr) {
          setTranscript((prev) => (prev ? `${prev} ${finalStr}` : finalStr).trim());
        }
        setInterimTranscript(interimStr.trim());
      };

      recognition.onerror = (event) => {
        console.warn("SpeechRecognition error:", event.error);
        if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

        if (event.error === "no-speech" || event.error === "aborted") {
          setListening(false);
          isListeningRef.current = false;
          return;
        }

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError(
            "Microphone access is blocked in this browser. Please allow microphone access in browser settings."
          );
        } else if (event.error === "network") {
          setError("Speech recognition network error. Please check your internet connection.");
        } else if (event.error === "language-not-supported") {
          setError(`Speech recognition for ${lang.toUpperCase()} is not available. Please use Google Chrome or Edge.`);
        } else {
          setError(`Microphone error: ${event.error}`);
        }
        setListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
        setListening(false);
        isListeningRef.current = false;
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      if (err.name === "InvalidStateError") {
        try {
          recognitionRef.current?.stop();
        } catch (e) {}
      } else {
        setError("Could not start microphone. Please check browser permissions and tap again.");
      }
      setListening(false);
      isListeningRef.current = false;
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {}
    setListening(false);
    isListeningRef.current = false;
  }, []);

  const resetTranscript = useCallback(() => {
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    listening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

export default useSpeechRecognition;
