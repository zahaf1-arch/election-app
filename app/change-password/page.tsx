'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'ar' || savedLang === 'fr') setLang(savedLang);

    const tempUser = localStorage.getItem('temp_user');
    if (!tempUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(tempUser);
    setUserId(user.id);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'كلمات المرور غير متطابقة.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      // Nettoyer le stockage temporaire et connecter l'utilisateur définitivement
      localStorage.removeItem('temp_user');
      localStorage.setItem('user', JSON.stringify(data.user));

      alert(lang === 'fr' ? '✅ Mot de passe mis à jour avec succès !' : '✅ تم تحديث كلمة المرور بنجاح!');

      // Rediriger selon le rôle
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/saisie');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <div className="text-center mb-6">
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
            {lang === 'fr' ? 'Sécurité Obligatoire' : 'أمان إجباري'}
          </span>
          <h1 className="text-xl font-bold text-gray-800 mt-3">
            {lang === 'fr' ? 'Changement de Mot de Passe Requis' : 'تغيير كلمة المرور مطلوب'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {lang === 'fr' 
              ? 'Pour votre première connexion, veuillez définir un nouveau mot de passe personnel.' 
              : 'يرجى تعيين كلمة مرور شخصية جديدة عند تسجيل الدخول لأول مرة.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'fr' ? 'Nouveau mot de passe' : 'كلمة المرور الجديدة'}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 border rounded-xl text-sm bg-white"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'fr' ? 'Confirmer le mot de passe' : 'تأكيد كلمة المرور'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 border rounded-xl text-sm bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition shadow text-sm disabled:opacity-50 mt-2"
          >
            {loading ? '...' : (lang === 'fr' ? 'Mettre à jour et Continuer' : 'تحديث والمتابعة')}
          </button>
        </form>
      </div>
    </main>
  );
}