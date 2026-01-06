import React, { useState } from 'react';
import { Ruler, MapPin, PenTool, Euro, Wand2, Loader2, Send, CheckCircle, ImagePlus, CalendarDays, AlertCircle } from 'lucide-react';
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
        setStep(nextStep);
    }
  };

  const handleAnalysis = async () => {
    // Validate all previous steps just in case
    if (!formData.bodyPart || !formData.style || !formData.description) {
        setStep(1); // Go back to start if something is missing
        alert("Des informations sont manquantes.");
        return;
    }

    setIsLoading(true);
    const result = await analyzeProjectRequest(formData);
    setAnalysis(result);
    setIsLoading(false);
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bodyPart || !formData.style || !formData.description || !clientEmail || !clientName) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    if (step !== 4 || !analysis) {
        alert("Veuillez d'abord analyser votre projet.");
        return;
    }

    setIsLoading(true);

    try {
      const budgetMax = formData.budget ? parseFloat(formData.budget) * 100 : null; // Convertir en centimes

      const { data, error } = await supabase
        .from('projects')
        .insert({
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
          statut: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      alert("✅ Dossier complet envoyé ! L'artiste reviendra vers vous avec un devis basé sur ces éléments.");
      
      // Reset form
      setStep(1);
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
      alert(`Erreur lors de l'envoi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in slide-in-from-bottom-10 duration-500">
        <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Parlez-nous de votre projet</h2>
            <p className="text-slate-400">Pour obtenir un devis précis sans attendre, remplissez ce formulaire en détail.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-8 relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10 rounded"></div>
            {[
                { id: 1, label: "Zone" },
                { id: 2, label: "Idée" },
                { id: 3, label: "Logistique" },
                { id: 4, label: "Analyse" }
            ].map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-900 px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${step >= s.id ? 'bg-amber-400 border-amber-400 text-black' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                        {s.id}
                    </div>
                    <span className={`text-xs font-medium hidden md:block ${step >= s.id ? 'text-amber-400' : 'text-slate-600'}`}>{s.label}</span>
                </div>
            ))}
        </div>

        <form className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl" onSubmit={handleSubmit}>
            
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                         <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                            <MapPin size={24} />
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-white">Emplacement & Anatomie</h3>
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

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
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
                        className="w-full bg-white text-black font-bold py-4 rounded-xl mt-4 hover:bg-amber-50 shadow-lg shadow-white/5 transition-all transform hover:-translate-y-1"
                    >
                        Continuer vers le Design
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                         <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <PenTool size={24} />
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-white">Le Projet Artistique</h3>
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
                        <button type="button" onClick={() => setStep(1)} className="w-1/3 border border-slate-600 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700">Retour</button>
                        <button 
                            type="button" 
                            onClick={() => handleNext(3)} 
                            className="w-2/3 bg-white text-black font-bold py-3 rounded-xl hover:bg-amber-50"
                        >
                            Logistique & Images
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                         <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <ImagePlus size={24} />
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-white">Références & Dispos</h3>
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
                        <button type="button" onClick={() => setStep(2)} className="w-1/3 border border-slate-600 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700">Retour</button>
                        <button 
                            type="button" 
                            onClick={handleAnalysis} 
                            disabled={isLoading} 
                            className="w-2/3 bg-amber-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-amber-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <><Wand2 size={18}/> Analyser & Envoyer</>}
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && analysis && (
                <div className="space-y-6 animate-in zoom-in duration-300">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Dossier Prêt !</h3>
                        <p className="text-slate-400">L'artiste a toutes les infos pour valider.</p>
                    </div>
                    
                    <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-700 space-y-4">
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

                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm">
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
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-amber-50 flex items-center justify-center gap-2 text-lg shadow-lg shadow-white/10 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Envoyer la demande au Tatoueur</>}
                    </button>
                    <p className="text-center text-xs text-slate-600">En envoyant, vous acceptez de verser un acompte si le projet est validé.</p>
                </div>
            )}
        </form>
    </div>
  );
};