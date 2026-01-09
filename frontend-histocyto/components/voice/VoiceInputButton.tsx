"use client";

import React, { useState, useCallback } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { voiceService } from "@/services/api";
import { useAuth } from "@/lib/auth-context";

type ReportFieldType =
  | "specimen"
  | "gross_examination"
  | "microscopic_examination"
  | "diagnosis"
  | "special_stains"
  | "immunohistochemistry"
  | "comments";

interface VoiceInputButtonProps {
  fieldType: ReportFieldType;
  fieldName: string;
  currentValue: string;
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({
  fieldType,
  fieldName,
  currentValue,
  onTranscriptionComplete,
  disabled = false,
  className,
}: VoiceInputButtonProps) {
  const { token } = useAuth();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      setIsTranscribing(true);
      setError(null);

      try {
        const result = await voiceService.transcribe(
          audioBlob,
          fieldType,
          token,
          {
            enhance: true,
            existingText: currentValue || undefined,
          }
        );

        const transcribedText = result.enhanced_text || result.raw_transcription;

        if (currentValue) {
          const separator = currentValue.endsWith(".") ? " " : ". ";
          onTranscriptionComplete(currentValue + separator + transcribedText);
        } else {
          onTranscriptionComplete(transcribedText);
        }
      } catch (err: unknown) {
        console.error("Transcription failed:", err);
        const error = err as { message?: string };
        setError(error.message || "Transcription failed");
      } finally {
        setIsTranscribing(false);
      }
    },
    [token, fieldType, currentValue, onTranscriptionComplete]
  );

  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    duration,
    error: recordingError,
  } = useVoiceRecording({
    onRecordingComplete: handleRecordingComplete,
    maxDuration: 120,
  });

  const handleClick = useCallback(() => {
    setError(null);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const displayError = error || recordingError;
  const isLoading = isProcessing || isTranscribing;
  const isDisabled = disabled || isLoading;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "relative transition-all h-8 w-8",
          isRecording && "animate-pulse",
          className
        )}
        title={
          isRecording
            ? `Recording ${fieldName}... Click to stop`
            : `Record voice for ${fieldName}`
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}

        {isRecording && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>

      {isRecording && (
        <span className="text-sm font-mono text-red-600">
          {formatDuration(duration)}
        </span>
      )}

      {isLoading && !isRecording && (
        <span className="text-sm text-muted-foreground">Processing...</span>
      )}

      {displayError && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span className="max-w-[200px] truncate">{displayError}</span>
        </div>
      )}
    </div>
  );
}
