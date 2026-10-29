'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  
  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang'); 
    if (savedLang) setLang(savedLang as 'fr' | 'ar');
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Corrigé ici (chaîne vide au lieu de null)
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

      // 1. Si l'utilisateur doit changer son mot de passe à la première connexion
      if (data.mustChangePassword) {
        localStorage.setItem('temp_user', JSON.stringify(data.user));
        router.push('/change-password');
        return;
      }

      // 2. Connexion normale : stocker l'utilisateur et rediriger selon son rôle
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/saisie');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Barre de langue en haut */}
      <div className="absolute top-4 right-4 sm:right-8 flex items-center gap-3">
        <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1">
          <button
            onClick={() => { setLang('fr'); localStorage.setItem('app_lang', 'fr'); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              lang === 'fr' ? 'bg-emerald-800 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => { setLang('ar'); localStorage.setItem('app_lang', 'ar'); }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              lang === 'ar' ? 'bg-emerald-800 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            العربية
          </button>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-white px-3 py-2 rounded-xl shadow-sm border"
        >
          {lang === 'fr' ? '← Accueil' : '← الرئيسية'}
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {lang === 'fr' ? 'Espace Sécurisé' : 'الفضاء الآمن'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {lang === 'fr' ? 'Connexion des opérateurs et administrateurs' : 'تسجيل دخول المشرفين والموظفين'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {lang === 'fr' ? 'Adresse Email' : 'البريد الإلكتروني'}
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="admin@election.mr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {lang === 'fr' ? 'Mot de passe' : 'كلمة المرور'}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
              >
                {loading 
                  ? (lang === 'fr' ? 'Connexion en cours...' : 'جاري تسجيل الدخول...') 
                  : (lang === 'fr' ? 'Se connecter' : 'تسجيل الدخول')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            {lang === 'fr' ? 'République Islamique de Mauritanie ' : 'الجمهورية الإسلامية الموريتانية'}
          </div>
        </div>
      </div>
    </main>
  );
}