import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIConsultantProps {
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
}

export function AIConsultant({ isOpen, onClose, artistName }: AIConsultantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Salut ! Je suis votre consultant tattoo virtuel. Une idée de tattoo, une question sur l'emplacement ou les soins ? Je suis là pour vous guider dans l'univers de ${artistName}.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      const base = isDev ? window.location.origin : '';
      const response = await fetch(`${base}/api/tattoo-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, artistName }),
      });

      const data = await response.json().catch(() => ({}));
      const reply = typeof data?.response === 'string' ? data.response : "Désolé, je rencontre un problème. Réessayez dans un instant.";
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "Désolé, je rencontre un problème. Réessayez dans un instant." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[#0a0a0a]/80 backdrop-blur-sm animate-ai-fade-in"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Fermer l’overlay"
      />
      <div
        className="fixed inset-y-0 right-0 z-[70] w-full sm:max-w-md lg:max-w-lg bg-[#121212] shadow-2xl flex flex-col border-l border-white/5 animate-ai-slide-in"
        role="dialog"
        aria-label="Consultant Tattoo IA"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between glass-vitrine">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-500 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">Consultant Tattoo IA</h3>
              <p className="text-[10px] sm:text-xs text-violet-400 uppercase tracking-widest font-bold">En ligne</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors shrink-0"
            aria-label="Fermer le chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-500 text-white rounded-tr-none'
                    : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 border-t border-white/5 glass-vitrine safe-area-bottom">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur votre futur tattoo..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all pr-12 sm:pr-14"
              disabled={isLoading}
              aria-label="Votre message"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Envoyer le message"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
          <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-white/20 text-center">
            Propulsé par Gemini • Conseils artistiques uniquement
          </p>
        </div>
      </div>
    </>
  );
}
