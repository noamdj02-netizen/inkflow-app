import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, PenTool, Euro, Wand2, Loader2, Send, CheckCircle, ImagePlus, CalendarDays, AlertCircle } from 'lucide-react';
import { CustomProjectRequest, AIAnalysisResult } from '../types';
import { analyzeProjectRequest } from '../services/geminiService';
import { supabase } from '../services/supabase';

const BODY_PARTS = ['Avant-bras', 'Bras complet', 'Cuisse', 'Mollet', 'Côtes', 'Dos', 'Sternum', 'Main'];
const STYLES = ['Fine Line', 'Réalisme', 'Traditionnel', 'Ornemental', 'Blackwork', 'Graphique'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface CustomProjectFormProps {
  artistId: string;
}

export const CustomProjectForm: React.FC<CustomProjectFormProps> = ({ artistId }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  
  const [formData, setFormData] = useState<CustomProjectRequest>({
    bodyPart: '',
    sizeCm: 10,
    style: '',
    description: '',
    budget: '',
    isCoverUp: false,
    isFirstTattoo: false,
    availability: [],
    referenceImageCount: 0
  });

  const toggleDay = (day: string) => {
    setFormData(prev => ({
        ...prev,
        availability: prev.availability.includes(day) 
            ? prev.availability.filter(d => d !== day)
            : [...prev.availability, day]
    }));
  };

  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const progress = useMemo(() => Math.max(0, Math.min(1, (step - 1) / 3)), [step]);

  const stepVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: dir === 1 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir === 1 ? -24 : 24 }),
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
        if (!formData.bodyPart) {
            newErrors.bodyPart = "Veuillez sélectionner une zone du corps pour continuer.";
            isValid = false;
        }
    }

    if (currentStep === 2) {
        if (!formData.style) {
            newErrors.style = "Veuillez choisir un style artistique.";
            isValid = false;
        }
        if (!formData.description || formData.description.trim().length === 0) {
            newErrors.description = "La description du projet est obligatoire.";
            isValid = false;
        } else if (formData.description.trim().length < 10) {
            newErrors.description = "Veuillez donner plus de détails (min. 10 caractères).";
            isValid = false;
        }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = (nextStep: number) => {
    if (validateStep(step)) {
      goToStep(nextStep);
    }
  };

  const handleAnalysis = async () => {
    // Validate all previous steps just in case
    if (!formData.bodyPart || !formData.style || !formData.description) {
      goToStep(1); // Go back to start if something is missing
      toast.error('Informations manquantes', { description: 'Merci de compléter les étapes précédentes.' });
      return;
    }

    setIsLoading(true);
    const result = await analyzeProjectRequest(formData);
    setAnalysis(result);
    setIsLoading(false);
    goToStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bodyPart || !formData.style || !formData.description || !clientEmail || !clientName) {
      toast.error('Champs manquants', { description: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    if (step !== 4 || !analysis) {
      toast.error('Analyse requise', { description: "Veuillez d'abord analyser votre projet." });
      return;
    }

    setIsLoading(true);

    try {
      const budgetMax = formData.budget ? parseFloat(formData.budget) * 100 : null; // Convertir en centimes

      const payload = {
        artist_id: artistId,
        client_email: clientEmail,
        client_name: clientName,
        body_part: formData.bodyPart,
        size_cm: formData.sizeCm,
        style: formData.style,
        description: formData.description,
        budget_max: budgetMax,
        is_cover_up: formData.isCoverUp,
        is_first_tattoo: formData.isFirstTattoo,
        availability: formData.availability.length > 0 ? formData.availability : null,
        ai_estimated_hours: analysis.estimatedTimeHours,
        ai_complexity_score: analysis.complexityScore,
        ai_price_range: analysis.suggestedPriceRange,
        ai_technical_notes: analysis.technicalNotes,
      };

      // Primary path (stable on Vercel): Serverless API route
      let apiRes: Response;
      try {
        apiRes = await fetch('/api/submit-project-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (fetchError) {
        // Network error - try Supabase Edge Function fallback
        console.warn('API route fetch failed, trying Supabase Edge Function:', fetchError);
        const { data, error } = await supabase.functions.invoke('submit-project-request', { body: payload });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Impossible d'envoyer la demande.");
        // Success with Edge Function
        toast.success('Demande envoyée !', { description: "L'artiste va revenir vers vous rapidement." });
        goToStep(1);
        setFormData({
          bodyPart: '',
          sizeCm: 10,
          style: '',
          description: '',
          budget: '',
          isCoverUp: false,
          isFirstTattoo: false,
          availability: [],
          referenceImageCount: 0
        });
        setClientEmail('');
        setClientName('');
        setAnalysis(null);
        return;
      }

      // Check if response is valid JSON
      const contentType = apiRes.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (apiRes.ok) {
        if (isJson) {
          const json = await apiRes.json().catch(() => ({} as any));
          if (!json?.success) throw new Error(json?.error || "Impossible d'envoyer la demande.");
        } else {
          // Response is not JSON, might be HTML (404 page)
          const text = await apiRes.text();
          if (apiRes.status === 404) {
            // Try Supabase Edge Function fallback
            console.warn('API route returned 404, trying Supabase Edge Function');
            const { data, error } = await supabase.functions.invoke('submit-project-request', { body: payload });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || "Impossible d'envoyer la demande.");
            // Success with Edge Function
            toast.success('Demande envoyée !', { description: "L'artiste va revenir vers vous rapidement." });
            goToStep(1);
            setFormData({
              bodyPart: '',
              sizeCm: 10,
              style: '',
              description: '',
              budget: '',
              isCoverUp: false,
              isFirstTattoo: false,
              availability: [],
              referenceImageCount: 0
            });
            setClientEmail('');
            setClientName('');
            setAnalysis(null);
            return;
          }
          throw new Error(`Réponse invalide du serveur (${apiRes.status})`);
        }
      } else if (apiRes.status === 404 || apiRes.status === 405) {
        // Fallback (local dev / no /api): Supabase Edge Function
        console.warn('API route not found (404/405), trying Supabase Edge Function');
        const { data, error } = await supabase.functions.invoke('submit-project-request', { body: payload });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Impossible d'envoyer la demande.");
        // Success with Edge Function
        toast.success('Demande envoyée !', { description: "L'artiste va revenir vers vous rapidement." });
        goToStep(1);
        setFormData({
          bodyPart: '',
          sizeCm: 10,
          style: '',
          description: '',
          budget: '',
          isCoverUp: false,
          isFirstTattoo: false,
          availability: [],
          referenceImageCount: 0
        });
        setClientEmail('');
        setClientName('');
        setAnalysis(null);
        return;
      } else {
        // Other error status (including 500)
        let errorMessage = `Erreur serveur (HTTP ${apiRes.status})`;
        let errorDetails: any = null;
        
        if (isJson) {
          try {
            const json = await apiRes.json();
            errorMessage = json?.error || errorMessage;
            errorDetails = json?.details;
          } catch {
            // JSON parsing failed, try to read as text
            try {
              const text = await apiRes.text();
              if (text && text.length < 200) {
                errorMessage = text;
              }
            } catch {
              // Use default message
            }
          }
        } else {
          // Try to read error message from HTML/text response
          try {
            const text = await apiRes.text();
            // Extract error message if possible
            if (text.includes('error') || text.includes('Error')) {
              const match = text.match(/(?:error|Error)[:\s]+([^<\n]+)/i);
              if (match && match[1]) {
                errorMessage = match[1].trim().substring(0, 100);
              }
            }
          } catch {
            // Use default message
          }
        }
        
        // Create error with details
        const error = new Error(errorMessage);
        (error as any).status = apiRes.status;
        (error as any).details = errorDetails;
        throw error;
      }

      toast.success('Demande envoyée !', { description: "L'artiste va revenir vers vous rapidement." });
      
      // Reset form
      goToStep(1);
      setFormData({
        bodyPart: '',
        sizeCm: 10,
        style: '',
        description: '',
        budget: '',
        isCoverUp: false,
        isFirstTattoo: false,
        availability: [],
        referenceImageCount: 0
      });
      setClientEmail('');
      setClientName('');
      setAnalysis(null);
    } catch (err: any) {
      console.error('Error submitting project:', err);
      const rawMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      const status = err?.status || 0;
      const errorDetails = err?.details;
      
      const isEdgeFnSendFailure = rawMessage.includes('Failed to send a request to the Edge Function');
      const isNetworkError = rawMessage.includes('fetch') || rawMessage.includes('Network');

      let help = rawMessage;
      
      // Handle specific HTTP status codes
      if (status === 500) {
        if (errorDetails) {
          help = `Erreur serveur: ${errorDetails}`;
        } else if (rawMessage.includes('Missing server env vars') || rawMessage.includes('Configuration serveur')) {
          help = 'Configuration serveur manquante. Vérifiez que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont configurées dans Vercel Dashboard → Settings → Environment Variables.';
        } else if (rawMessage.includes('Failed to upsert customer')) {
          help = 'Erreur lors de la création du client. Vérifiez que la table "customers" existe dans Supabase et que les politiques RLS sont correctement configurées.';
        } else if (rawMessage.includes('Failed to create project')) {
          help = 'Erreur lors de la création du projet. Vérifiez que la table "projects" existe dans Supabase et que l\'artiste existe.';
        } else {
          help = 'Erreur serveur (500). Vérifiez les logs Vercel dans Functions → api/submit-project-request → Logs pour plus de détails.';
        }
      } else if (isEdgeFnSendFailure || isNetworkError) {
        const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
        if (isDevelopment) {
          help = "Les routes API ne fonctionnent qu'en production sur Vercel. Déployez votre projet sur Vercel pour tester, ou déployez l'Edge Function 'submit-project-request' dans Supabase.";
        } else {
          help = "Impossible de contacter le serveur. Vérifiez que '/api/submit-project-request' est déployée sur Vercel, ou déployez l'Edge Function 'submit-project-request' dans Supabase.";
        }
      } else if (status === 404 || rawMessage.includes('404') || rawMessage.includes('not found')) {
        const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
        if (isDevelopment) {
          help = "Route API non trouvée. Les routes API ne fonctionnent qu'en production sur Vercel. Déployez votre projet sur Vercel pour tester.";
        } else {
          help = "Route API non trouvée. Vérifiez que '/api/submit-project-request' est déployée sur Vercel dans l'onglet Functions.";
        }
      } else if (status === 400) {
        help = rawMessage || 'Données invalides. Vérifiez que tous les champs sont correctement remplis.';
      } else if (status === 429) {
        help = 'Trop de requêtes. Veuillez patienter quelques minutes avant de réessayer.';
      }

      toast.error("Erreur lors de l'envoi", { 
        description: help,
        duration: 10000, // Show longer for important errors
        action: status === 500 ? {
          label: 'Voir les logs',
          onClick: () => {
            window.open('https://vercel.com/dashboard', '_blank');
          },
        } : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-white mb-2 tracking-tight">
          Parlez-nous de votre projet
        </h2>
        <p className="text-slate-400">
          Pour obtenir un devis précis sans attendre, remplissez ce formulaire en détail.
        </p>
      </div>

      <form className="glass p-6 md:p-8 rounded-3xl shadow-xl" onSubmit={handleSubmit}>
        {/* Sleek progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Progression</span>
            <span className="text-xs text-zinc-400 font-mono">{step}/4</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-yellow via-brand-purple to-brand-cyan"
              initial={false}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
            <span className={step >= 1 ? 'text-white/80' : ''}>Zone</span>
            <span className={step >= 2 ? 'text-white/80' : ''}>Idée</span>
            <span className={step >= 3 ? 'text-white/80' : ''}>Logistique</span>
            <span className={step >= 4 ? 'text-white/80' : ''}>Analyse</span>
          </div>
        </div>
            
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="space-y-8"
            >
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                         <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                            <MapPin size={24} />
                         </div>
                         <div>
                             <h3 className="text-xl font-serif font-bold text-white">Emplacement & Anatomie</h3>
                             <p className="text-sm text-slate-400">La zone détermine la douleur et la complexité.</p>
                         </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">Zone du corps <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {BODY_PARTS.map(part => (
                                <button
                                    key={part}
                                    type="button"
                                    onClick={() => {
                                        setFormData({...formData, bodyPart: part});
                                        if (errors.bodyPart) setErrors({...errors, bodyPart: ''});
                                    }}
                                    className={`p-3 rounded-xl text-sm border-2 transition-all font-medium ${formData.bodyPart === part ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'}`}
                                >
                                    {part}
                                </button>
                            ))}
                        </div>
                        {errors.bodyPart && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> {errors.bodyPart}</p>}
                    </div>

                    <div className="glass p-5 rounded-2xl">
                        <label className="flex justify-between text-sm font-medium text-slate-300 mb-4">
                            <span>Taille estimée</span>
                            <span className="text-amber-400 font-mono text-lg">{formData.sizeCm} cm</span>
                        </label>
                        <input 
                            type="range" 
                            min="5" 
                            max="50" 
                            value={formData.sizeCm}
                            onChange={(e) => setFormData({...formData, sizeCm: parseInt(e.target.value)})}
                            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-3 font-mono">
                            <span>5cm (Pièce)</span>
                            <span>20cm (Main)</span>
                            <span>50cm (Dos)</span>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={() => handleNext(2)} 
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl mt-4 hover:bg-zinc-100 shadow-lg shadow-white/10 transition-all active:scale-[0.99]"
                    >
                        Continuer vers le Design
                    </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                         <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <PenTool size={24} />
                         </div>
                         <div>
                             <h3 className="text-xl font-serif font-bold text-white">Le Projet Artistique</h3>
                             <p className="text-sm text-slate-400">Détaillez votre idée pour éviter les allers-retours.</p>
                         </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">Style souhaité <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {STYLES.map(style => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => {
                                        setFormData({...formData, style: style});
                                        if (errors.style) setErrors({...errors, style: ''});
                                    }}
                                    className={`p-2 rounded-lg text-sm border transition-all ${formData.style === style ? 'bg-amber-400 border-amber-400 text-black font-bold' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                         {errors.style && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> {errors.style}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description détaillée <span className="text-red-500">*</span></label>
                        <textarea 
                            rows={4}
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({...formData, description: e.target.value});
                                if (errors.description) setErrors({...errors, description: ''});
                            }}
                            placeholder="Ex: Un serpent qui s'enroule autour d'une épée, avec des fleurs de pivoine..."
                            className={`w-full bg-slate-900 border rounded-lg p-4 text-white focus:outline-none transition-colors placeholder:text-slate-600 ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-amber-400'}`}
                        />
                         {errors.description && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> {errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.isCoverUp ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                            <input 
                                type="checkbox" 
                                checked={formData.isCoverUp}
                                onChange={(e) => setFormData({...formData, isCoverUp: e.target.checked})}
                                className="w-5 h-5 accent-red-500 rounded"
                            />
                            <div>
                                <span className="block font-bold text-white">Recouvrement</span>
                                <span className="text-xs text-slate-400">Cacher un ancien tatouage ?</span>
                            </div>
                        </label>
                         <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.isFirstTattoo ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                            <input 
                                type="checkbox" 
                                checked={formData.isFirstTattoo}
                                onChange={(e) => setFormData({...formData, isFirstTattoo: e.target.checked})}
                                className="w-5 h-5 accent-green-500 rounded"
                            />
                             <div>
                                <span className="block font-bold text-white">Premier Tatouage</span>
                                <span className="text-xs text-slate-400">Besoin de plus d'explications ?</span>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => goToStep(1)} className="w-1/3 border border-slate-600 text-slate-300 font-bold py-3 rounded-2xl hover:bg-white/5">Retour</button>
                        <button 
                            type="button" 
                            onClick={() => handleNext(3)} 
                            className="w-2/3 bg-white text-black font-bold py-3 rounded-2xl hover:bg-zinc-100"
                        >
                            Logistique & Images
                        </button>
                    </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
                     <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                         <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <ImagePlus size={24} />
                         </div>
                         <div>
                             <h3 className="text-xl font-serif font-bold text-white">Références & Dispos</h3>
                             <p className="text-sm text-slate-400">Pour vous donner un prix et une date.</p>
                         </div>
                    </div>

                    {/* Fake Upload UI */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Images d'inspiration (Minimum 1)</label>
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 hover:border-amber-400/50 transition-all cursor-pointer group" onClick={() => setFormData({...formData, referenceImageCount: Math.min(3, formData.referenceImageCount + 1)})}>
                            {formData.referenceImageCount === 0 ? (
                                <>
                                    <ImagePlus className="mx-auto text-slate-500 group-hover:text-amber-400 mb-2" size={32}/>
                                    <p className="text-slate-400 text-sm">Cliquez pour ajouter des images (JPG, PNG)</p>
                                </>
                            ) : (
                                <div className="flex justify-center gap-2">
                                    {[...Array(formData.referenceImageCount)].map((_, i) => (
                                        <div key={i} className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                                            <span className="text-xs text-slate-400">Img {i+1}</span>
                                        </div>
                                    ))}
                                    {formData.referenceImageCount < 3 && <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-slate-500">+</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Vos disponibilités habituelles</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${formData.availability.includes(day) ? 'bg-amber-400 border-amber-400 text-black font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Budget Maximum</label>
                        <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text"
                                placeholder="ex: 400"
                                value={formData.budget}
                                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-400"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-400/5 p-4 rounded-lg border border-amber-400/20 flex gap-3 items-start">
                        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-amber-200/80">
                            En cliquant sur Analyser, notre IA va estimer la faisabilité technique. 
                            L'artiste validera ensuite le prix final.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => goToStep(2)} className="w-1/3 border border-slate-600 text-slate-300 font-bold py-3 rounded-2xl hover:bg-white/5">Retour</button>
                        <button 
                            type="button" 
                            onClick={handleAnalysis} 
                            disabled={isLoading} 
                            className="w-2/3 bg-gradient-to-r from-brand-yellow to-brand-purple text-black font-extrabold py-3 rounded-2xl disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <><Wand2 size={18}/> Analyser</>}
                        </button>
                    </div>
            </motion.div>
          )}

          {step === 4 && analysis && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white">Dossier Prêt</h3>
                        <p className="text-slate-400">L'artiste a toutes les infos pour valider.</p>
                    </div>
                    
                    <div className="glass p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <span className="text-slate-400 flex items-center gap-2"><MapPin size={14}/> Difficulté</span>
                            <div className="flex gap-1">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className={`w-1.5 h-4 rounded-full ${i < analysis.complexityScore ? 'bg-amber-400' : 'bg-slate-800'}`}></div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <span className="text-slate-400 flex items-center gap-2"><CalendarDays size={14}/> Temps estimé</span>
                            <span className="text-white font-mono bg-slate-800 px-2 py-1 rounded text-sm">{analysis.estimatedTimeHours}h - {analysis.estimatedTimeHours + 1}h</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 flex items-center gap-2"><Euro size={14}/> Estimation IA</span>
                            <span className="text-amber-400 font-bold font-mono text-lg">{analysis.suggestedPriceRange}</span>
                        </div>
                    </div>

                     <div className="glass p-4 rounded-2xl text-sm">
                        <h4 className="font-bold text-slate-300 mb-2">Récapitulatif technique :</h4>
                        <ul className="space-y-1 text-slate-400 list-disc list-inside">
                            <li>Zone : <span className="text-white">{formData.bodyPart} ({formData.sizeCm}cm)</span></li>
                            <li>Style : <span className="text-white">{formData.style}</span></li>
                            <li>Cover-up : <span className={formData.isCoverUp ? "text-red-400 font-bold" : "text-slate-500"}>{formData.isCoverUp ? "OUI" : "Non"}</span></li>
                             <li>Dispos : <span className="text-white">{formData.availability.length > 0 ? formData.availability.join(', ') : "Flexible"}</span></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Votre nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Votre email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                          placeholder="jean.dupont@example.com"
                        />
                      </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!clientName || !clientEmail || isLoading}
                        className="w-full bg-white text-black font-extrabold py-4 rounded-2xl hover:bg-zinc-100 flex items-center justify-center gap-2 text-lg shadow-lg shadow-white/10 transition-transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Envoyer la demande</>}
                    </button>
                    <p className="text-center text-xs text-slate-600">En envoyant, vous acceptez de verser un acompte si le projet est validé.</p>
            </motion.div>
          )}
        </AnimatePresence>
        </form>
    </div>
  );
};