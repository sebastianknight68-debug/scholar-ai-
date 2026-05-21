"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Pause, Play, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Status = "idle" | "recording" | "paused" | "uploading";

export function VoiceRecorder({
  onTranscript,
}: {
  onTranscript: (text: string, filename: string) => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<Status>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [levels, setLevels] = React.useState<number[]>(Array(48).fill(0.05));

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const tickRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        await uploadForTranscription(blob);
        cleanup();
      };
      recorder.start(250);

      // visualizer
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AC();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const bands: number[] = [];
        const step = Math.floor(data.length / 48);
        for (let i = 0; i < 48; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
          bands.push(Math.min(1, sum / (step * 200)));
        }
        setLevels(bands);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setStatus("recording");
    } catch (err) {
      toast({
        title: "Mic permission needed",
        description:
          err instanceof Error ? err.message : "Allow microphone access to record.",
        variant: "danger",
      });
    }
  }

  function pauseRecording() {
    mediaRecorderRef.current?.pause();
    if (tickRef.current) clearInterval(tickRef.current);
    setStatus("paused");
  }
  function resumeRecording() {
    mediaRecorderRef.current?.resume();
    tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setStatus("recording");
  }
  function stopRecording() {
    setStatus("uploading");
    if (tickRef.current) clearInterval(tickRef.current);
    mediaRecorderRef.current?.stop();
  }

  async function uploadForTranscription(blob: Blob) {
    try {
      const fd = new FormData();
      const filename = `recording-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
      fd.append("file", blob, filename);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed");
      onTranscript(data.text ?? "", filename);
      toast({ title: "Recording transcribed", variant: "success" });
    } catch (err) {
      toast({
        title: "Transcription failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setStatus("idle");
      setSeconds(0);
      setLevels(Array(48).fill(0.05));
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Record lecture</h3>
          <p className="text-xs text-muted">
            We'll transcribe your audio with Whisper after you stop.
          </p>
        </div>
        <span className="font-mono text-xl tabular-nums text-primary-soft">
          {mmss}
        </span>
      </div>

      <div className="mt-6 flex h-24 items-center gap-1 rounded-xl border border-border bg-bg/40 px-3">
        {levels.map((l, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-primary/80 transition-all"
            style={{
              height: `${Math.max(8, l * 100)}%`,
              opacity: status === "recording" ? 0.4 + l * 0.6 : 0.2,
            }}
          />
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        {status === "idle" && (
          <Button className="flex-1" onClick={startRecording}>
            <Mic className="h-4 w-4" /> Start recording
          </Button>
        )}
        {status === "recording" && (
          <>
            <Button variant="secondary" onClick={pauseRecording}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
            <Button variant="danger" className="flex-1" onClick={stopRecording}>
              <Square className="h-4 w-4" /> Stop & transcribe
            </Button>
          </>
        )}
        {status === "paused" && (
          <>
            <Button variant="secondary" onClick={resumeRecording}>
              <Play className="h-4 w-4" /> Resume
            </Button>
            <Button variant="danger" className="flex-1" onClick={stopRecording}>
              <Square className="h-4 w-4" /> Stop & transcribe
            </Button>
          </>
        )}
        {status === "uploading" && (
          <Button className="flex-1" disabled>
            <Loader2 className="h-4 w-4 animate-spin" /> Transcribing…
          </Button>
        )}
      </div>
    </Card>
  );
}
