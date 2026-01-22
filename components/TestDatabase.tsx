import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, getConfigErrors } from '../services/supabase';
import { CheckCircle, XCircle, Loader2, Database, AlertCircle } from 'lucide-react';

export const TestDatabase: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  } | null>(null);
  const [tableName, setTableName] = useState('artists');

  // Vérifier la configuration au chargement
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const errors = getConfigErrors();
      setResult({
        success: false,
        message: 'Configuration Supabase manquante',
        error: errors.join('. '),
      });
    }
  }, []);

  const testConnection = async () => {
    if (!isSupabaseConfigured()) {
      setResult({
        success: false,
        message: 'Configuration Supabase manquante',
        error: 'Vérifiez vos variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Test 1: Lire une table (même vide)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      if (error) {
        setResult({
          success: false,
          message: `Erreur lors de la lecture de la table "${tableName}"`,
          error: error.message,
        });
      } else {
        setResult({
          success: true,
          message: `✅ Connexion réussie ! Table "${tableName}" accessible.`,
          data: {
            count: data?.length || 0,
            sample: data?.slice(0, 3) || [],
          },
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Erreur de connexion',
        error: err.message || 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  const testTables = async () => {
    if (!isSupabaseConfigured()) {
      setResult({
        success: false,
        message: 'Configuration Supabase manquante',
        error: 'Vérifiez vos variables d\'environnement',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Tester plusieurs tables
      const tables = ['artists', 'flashs', 'projects', 'bookings', 'customers'];
      const results: Record<string, { success: boolean; count: number; error?: string }> = {};

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            results[table] = { success: false, count: 0, error: error.message };
          } else {
            results[table] = { success: true, count: data?.length || 0 };
          }
        } catch (err: any) {
          results[table] = { success: false, count: 0, error: err.message };
        }
      }

      setResult({
        success: true,
        message: 'Test de toutes les tables terminé',
        data: results,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Erreur lors du test des tables',
        error: err.message || 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  const configErrors = getConfigErrors();
  const isConfigured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Database className="text-amber-400" size={32} />
            Test de Connexion Supabase
          </h1>
          <p className="text-zinc-400">
            Vérifiez que votre connexion à Supabase fonctionne correctement
          </p>
        </div>

        {/* Configuration Status */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            État de la Configuration
          </h2>
          
          {isConfigured ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span>✅ Supabase est correctement configuré</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={20} />
                <span>❌ Configuration Supabase manquante</span>
              </div>
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm font-semibold mb-2">Erreurs détectées :</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {configErrors.map((error, idx) => (
                    <li key={idx} className="text-red-300">{error}</li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-[#050505] rounded-lg">
                  <p className="text-xs text-zinc-400 mb-2">Solution :</p>
                  <p className="text-sm text-zinc-300">
                    Créez un fichier <code className="bg-zinc-800 px-2 py-1 rounded">.env.local</code> à la racine avec :
                  </p>
                  <pre className="mt-2 text-xs bg-[#0a0a0a] p-3 rounded border border-white/10 overflow-x-auto">
{`VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici`}
                  </pre>
                  <p className="text-xs text-zinc-400 mt-2">
                    ⚠️ Note : Ce projet utilise <strong>Vite</strong>, pas Next.js. Utilisez <code>VITE_</code> et non <code>NEXT_PUBLIC_</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Form */}
        {isConfigured && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Tests de Connexion</h2>
            
            <div className="space-y-4">
              {/* Test simple */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <label className="block text-sm font-medium mb-2">
                  Tester une table spécifique
                </label>
                <div className="flex gap-2">
                  <select
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="flex-1 bg-[#050505] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="artists">artists</option>
                    <option value="flashs">flashs</option>
                    <option value="projects">projects</option>
                    <option value="bookings">bookings</option>
                    <option value="customers">customers</option>
                  </select>
                  <button
                    onClick={testConnection}
                    disabled={loading}
                    className="px-6 py-2 bg-amber-400 text-black font-semibold rounded-lg hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Test...
                      </>
                    ) : (
                      'Tester'
                    )}
                  </button>
                </div>
              </div>

              {/* Test toutes les tables */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-zinc-400 mb-3">
                  Tester toutes les tables principales
                </p>
                <button
                  onClick={testTables}
                  disabled={loading}
                  className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Tester toutes les tables
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`glass rounded-2xl p-6 border-2 ${
            result.success 
              ? 'border-green-500/30 bg-green-500/5' 
              : 'border-red-500/30 bg-red-500/5'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="text-green-400 shrink-0" size={24} />
              ) : (
                <XCircle className="text-red-400 shrink-0" size={24} />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  result.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.message}
                </h3>
                
                {result.error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-300 font-mono">{result.error}</p>
                  </div>
                )}

                {result.data && (
                  <div className="mt-4 space-y-2">
                    {result.data.count !== undefined ? (
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-zinc-400">Nombre d'enregistrements :</p>
                        <p className="text-2xl font-bold text-white">{result.data.count}</p>
                      </div>
                    ) : null}

                    {result.data && typeof result.data === 'object' && !result.data.count && (
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-zinc-400 mb-2">Résultats par table :</p>
                        <div className="space-y-2">
                          {Object.entries(result.data).map(([table, info]: [string, any]) => (
                            <div
                              key={table}
                              className={`p-2 rounded border ${
                                info.success
                                  ? 'border-green-500/30 bg-green-500/5'
                                  : 'border-red-500/30 bg-red-500/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">{table}</span>
                                {info.success ? (
                                  <span className="text-green-400 text-sm">
                                    ✅ {info.count} enregistrement(s)
                                  </span>
                                ) : (
                                  <span className="text-red-400 text-sm">
                                    ❌ {info.error || 'Erreur'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.data.sample && result.data.sample.length > 0 && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-zinc-400 mb-2">Aperçu des données :</p>
                        <pre className="text-xs bg-[#0a0a0a] p-3 rounded border border-white/10 overflow-x-auto">
                          {JSON.stringify(result.data.sample, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-blue-300">
            <strong>Note importante :</strong> Ce projet utilise <strong>Vite</strong> et non Next.js. 
            Les variables d'environnement doivent être préfixées avec <code className="bg-zinc-800 px-1 rounded">VITE_</code> 
            et non <code className="bg-zinc-800 px-1 rounded">NEXT_PUBLIC_</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
