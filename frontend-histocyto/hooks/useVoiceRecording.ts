"use client";

import { useState, useRef, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "processing" | "error";

interface UseVoiceRecordingOptions {
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number;
}

interface UseVoiceRecordingReturn {
  state: RecordingState;
  error: string | null;
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioBlob: Blob | null;
  duration: number;
}

export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const { onRecordingComplete, maxDuration = 120 } = options;

  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        cleanup();
        setState("idle");
        onRecordingComplete?.(blob);
      };

      mediaRecorder.onerror = () => {
        setError("Recording error occurred");
        cleanup();
        setState("error");
      };

      mediaRecorder.start(100);
      setState("recording");
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);
    } catch (err: unknown) {
      console.error("Failed to start recording:", err);

      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError") {
        setError(
          "Microphone permission denied. Please allow microphone access."
        );
      } else if (error.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone.");
      } else {
        setError(error.message || "Failed to start recording");
      }

      setState("error");
    }
  }, [cleanup, maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      setState("processing");
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    state,
    error,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    startRecording,
    stopRecording,
    audioBlob,
    duration,
  };
}
