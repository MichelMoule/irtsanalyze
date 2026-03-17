import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'register' | 'forgot';

function ImagePanel() {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Gentle idle 3D float animation
  useEffect(() => {
    const animX = animate(rotateX, [0, 1.5, -1, 0.5, 0], {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    const animY = animate(rotateY, [0, -1.5, 1, -0.5, 0], {
      duration: 10,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => { animX.stop(); animY.stop(); };
  }, [rotateX, rotateY]);

  const transform = useTransform(
    [rotateX, rotateY],
    ([rx, ry]: number[]) => `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`
  );

  return (
    <div className="hidden lg:flex w-[45%] items-center justify-center p-5 relative overflow-hidden flex-shrink-0">
      <motion.div
        className="absolute inset-5 rounded-2xl overflow-hidden bg-[#2563EB]"
        style={{ transform }}
      >
        <img
          src="/loginpage2.png"
          alt="IRTS Parmentier - Institut Regional du Travail Social"
          className="w-full h-full object-cover object-bottom"
        />
      </motion.div>
    </div>
  );
}

export function LoginPage() {
  const { isAuthenticated, login, register, resetPassword, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const switchMode = (m: Mode) => {
    setMode(m);
    clearError();
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password, nom, prenom);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch {
      // error is set in context
    } finally {
      setBusy(false);
    }
  };

  const isSubmitting = busy || isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0EB]">

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden flex min-h-[680px]"
        >

          {/* ── Left: image panel ── */}
          <ImagePanel />

          {/* ── Right: form panel ── */}
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-10 min-w-[380px]">

            {/* Logo + Title */}
            <div className="mb-10">
              <img
                src="/logo.png"
                alt="IRTS Parmentier"
                className="h-20 object-contain mb-6 mx-auto"
              />
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {mode === 'login' ? 'Bon retour' : mode === 'register' ? 'Creer un compte' : 'Mot de passe oublie'}
              </h1>
              <p className="text-base text-slate-500 mt-2">
                {mode === 'login'
                  ? 'Plateforme d\'aide a la decision pour les commissions pedagogiques.'
                  : mode === 'register'
                    ? 'Rejoignez votre equipe pour evaluer les candidatures.'
                    : 'Saisissez votre email pour recevoir un lien de reinitialisation.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Register fields */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">Prenom</label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Jean"
                      required
                      className="w-full px-3.5 py-3 bg-white border-b-2 border-gray-200 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">Nom</label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Dupont"
                      required
                      className="w-full px-3.5 py-3 bg-white border-b-2 border-gray-200 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm text-slate-500 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@irts-parmentier.fr"
                    required
                    className="w-full px-3.5 py-3 bg-white border-b-2 border-gray-200 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={mode === 'register' ? 6 : undefined}
                    className="w-full px-3.5 py-3 bg-white border-b-2 border-gray-200 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  {mode === 'login' && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        Mot de passe oublie ?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Remember me */}
              {mode === 'login' && (
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-base text-slate-600">Rester connecte</span>
                </label>
              )}

              {/* Error */}
              {error && (
                <div className="px-4 py-2.5 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Reset success */}
              {resetSent && (
                <div className="px-4 py-2.5 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-700 font-medium">
                    Un email de reinitialisation a ete envoye a {email}.
                  </p>
                </div>
              )}

              {/* Submit */}
              {!resetSent && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white text-base font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? 'Connexion...' : mode === 'register' ? 'Inscription...' : 'Envoi...'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Creer mon compte' : 'Reinitialiser'}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Mode switcher */}
            <div className="mt-8 text-center">
              {mode === 'login' && (
                <p className="text-sm text-slate-500">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold text-slate-800 hover:text-primary-600 underline underline-offset-2 transition-colors"
                  >
                    S'inscrire
                  </button>
                </p>
              )}
              {mode === 'register' && (
                <p className="text-sm text-slate-500">
                  Deja un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-slate-800 hover:text-primary-600 underline underline-offset-2 transition-colors"
                  >
                    Se connecter
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Retour a la connexion
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between px-6 py-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>&copy; {new Date().getFullYear()} IRTS Parmentier</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Compliance RGPD active
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Support Technique</span>
          <span className="hover:text-slate-600 cursor-pointer transition-colors">Mentions Legales</span>
        </div>
      </footer>
    </div>
  );
}
