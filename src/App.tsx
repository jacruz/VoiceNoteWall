import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Square } from "lucide-react";

interface StickyNote {
  id: number;
  text: string;
  audioUrl: string;
  color: string;
}

const noteColors = [
  { name: "Amarillo", value: "bg-yellow-300", gradient: "from-yellow-100 to-yellow-300" },
  { name: "Verde", value: "bg-green-300", gradient: "from-green-100 to-green-300" },
  { name: "Rosa", value: "bg-pink-300", gradient: "from-pink-100 to-pink-300" },
  { name: "Azul", value: "bg-blue-300", gradient: "from-blue-100 to-blue-300" },
];

export default function App() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(noteColors[0].value);
  const [selectedGradient, setSelectedGradient] = useState<string>(noteColors[0].gradient);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});
  const timerRef = useRef<number | null>(null);

  const MAX_DURATION = 60; // segundos

  const startRecording = async () => {
    setError(null);
    setRecordingTime(0);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/mp4" });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp4" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);

        // Simular llamada a API Speech-to-Text
        setIsLoadingText(true);
        setTimeout(() => {
          setPreviewText("Este es el texto transcrito desde el audio.");
          setIsLoadingText(false);
          setIsPreview(true);
        }, 2000);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true); // <- aquí, no antes

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError("No se pudo acceder al micrófono.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleAccept = async () => {
    setError(null);
    const success = Math.random() > 0.2; // Simulación de respuesta del servicio
    if (!success) {
      setError("No se pudo cargar el audio, inténtalo más tarde.");
      return;
    }
    if (audioUrl) {
      const newNote: StickyNote = {
        id: Date.now(),
        text: previewText,
        audioUrl,
        color: selectedColor,
      };
      setNotes([newNote, ...notes]);
    }
    setAudioUrl(null);
    setIsPreview(false);
    setSelectedColor(noteColors[0].value);
    setSelectedGradient(noteColors[0].gradient);
    setPreviewText("");
  };

  const handlePlayToggle = (id: number, url: string) => {
    if (isPlaying === id) {
      audioRefs.current[id]?.pause();
      audioRefs.current[id]!.currentTime = 0;
      setIsPlaying(null);
    } else {
      if (isPlaying !== null && audioRefs.current[isPlaying]) {
        audioRefs.current[isPlaying]?.pause();
        audioRefs.current[isPlaying]!.currentTime = 0;
      }
      const audio = new Audio(url);
      audioRefs.current[id] = audio;
      audio.play();
      setIsPlaying(id);
      audio.onended = () => setIsPlaying(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col overflow-y-scroll">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white border-b-4 border-black p-4 z-10 text-center font-bold text-lg">
        Con la Palabra de Dios nunca estoy solo ¿Qué piensas hoy?
      </header>

      {/* Notes Wall */}
      <main className="mt-20 p-4 flex flex-wrap gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`${note.color} border-4 border-black p-4 rounded-lg shadow-lg w-full sm:w-[48%] md:w-[30%] lg:w-[22%]`}
          >
            <p className="mb-4 font-semibold">{note.text}</p>
            <button
              onClick={() => handlePlayToggle(note.id, note.audioUrl)}
              className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center bg-white hover:bg-gray-200"
            >
              {isPlaying === note.id ? <Square size={24} /> : <Play size={24} />}
            </button>
          </div>
        ))}
      </main>

      {/* Record Button */}
      {!isRecording && !isPreview && !isLoadingText && (
        <button
          onClick={startRecording}
          className="fixed bottom-6 right-6 w-20 h-20 rounded-full bg-red-600 border-4 border-black flex items-center justify-center text-white text-xl font-bold shadow-lg hover:bg-red-700 z-20"
        >
          REC
        </button>
      )}

      {/* Recording Screen */}
      {isRecording && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-200 to-blue-900 flex flex-col items-center justify-center z-30">
          <motion.div
            className="w-40 h-40 rounded-full border-4 border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ background: "radial-gradient(circle, #fff, transparent)" }}
          ></motion.div>
          <p className="mt-6 text-xl font-bold text-white drop-shadow-lg">Grabando...</p>
          <p className="mt-2 text-xl font-mono text-white">
            {formatTime(recordingTime)} / 01:00
          </p>
          <button
            onClick={stopRecording}
            className="mt-8 px-6 py-3 bg-white border-4 border-black rounded-lg shadow-lg font-bold hover:bg-gray-200"
          >
            Detener
          </button>
        </div>
      )}

      {/* Loading Text Screen */}
      {isLoadingText && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-200 to-blue-900 flex flex-col items-center justify-center z-30">
          <p className="text-xl font-bold">Procesando audio...</p>
        </div>
      )}

      {/* Preview Screen */}
      {isPreview && (
        <div className={`fixed inset-0 flex flex-col items-center justify-center z-30 bg-gradient-to-br ${selectedGradient}`}>
          {error && (
            <div className="mb-4 bg-red-200 text-red-800 border-4 border-black px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          <audio src={audioUrl || undefined} controls className="mb-6" />
          <textarea
            className="mb-6 p-2 border-4 border-black rounded-lg w-80 h-32"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
          />
          <div className="flex gap-4 mb-6">
            {noteColors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  setSelectedColor(color.value);
                  setSelectedGradient(color.gradient);
                }}
                className={`w-12 h-12 rounded-full border-4 border-black ${color.value} ${
                  selectedColor === color.value ? "ring-4 ring-black" : ""
                }`}
              ></button>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              className="px-6 py-3 bg-green-400 border-4 border-black rounded-lg shadow-lg font-bold hover:bg-green-500"
            >
              Aceptar
            </button>
            <button
              onClick={() => {
                setIsPreview(false);
                setAudioUrl(null);
                setPreviewText("");
              }}
              className="px-6 py-3 bg-red-400 border-4 border-black rounded-lg shadow-lg font-bold hover:bg-red-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
