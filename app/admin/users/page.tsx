'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [users, setUsers] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<any[]>([]);

  // Formulaire de création (le mot de passe n'est plus requis ici car généré par défaut)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [wilayaId, setWilayaId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'ar' || savedLang === 'fr') setLang(savedLang);

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin') {
      router.push('/saisie');
      return;
    }

    loadUsers();
    loadWilayas();
  }, [router]);

  const loadUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); });
  };

  const loadWilayas = () => {
    fetch('/api/geo/wilayas')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setWilayas(data); });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          wilayaId: role === 'operator' ? wilayaId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de création');

      // Réinitialiser les champs du formulaire
      setName('');
      setEmail('');
      setRole('operator');
      setWilayaId('');

      loadUsers();
      
      // Message indiquant le mot de passe temporaire par défaut attribué
      alert(
        lang === 'fr'
          ? '✅ Utilisateur créé avec succès !\nMot de passe par défaut : 123456789\n(Il devra le modifier à sa première connexion).'
          : '✅ تم إنشاء المستخدم بنجاح!\nكلمة المرور الافتراضية: 123456789\n(سيُطلب منه تغييرها عند أول تسجيل دخول).'
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cet utilisateur ?' : 'حذف هذا المستخدم؟')) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className={`min-h-screen bg-gray-100 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs uppercase">ADMIN</span>
            <h1 className="text-xl font-bold">{lang === 'fr' ? 'Gestion des Utilisateurs' : 'إدارة المستخدمين'}</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700">
              {lang === 'fr' ? 'Tableau de Bord' : 'لوحة القيادة'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulaire de création */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-md font-bold text-gray-800 mb-4 pb-2 border-b">
            {lang === 'fr' ? 'Créer un Compte' : 'إنشاء حساب جديد'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Nom complet' : 'الاسم الكامل'}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 border rounded-xl text-sm bg-white"
                placeholder="Ex: Ahmed Ould..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Email (Identifiant)' : 'البريد الإلكتروني'}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2.5 border rounded-xl text-sm bg-white"
                placeholder="operator@election.mr"
              />
            </div>

            {/* Note d'information sur le mot de passe par défaut */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {lang === 'fr'
                  ? 'ℹ️ Un mot de passe par défaut provisoire (123456789) sera automatiquement attribué. L’utilisateur sera invité à le modifier lors de sa première connexion.'
                  : 'ℹ️ سيتم تعيين كلمة مرور مؤقتة افتراضية (123456789). يُطلب من المستخدم تغييرها عند تسجيل الدخول لأول مرة.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Rôle' : 'الدور'}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm bg-white font-semibold"
              >
                <option value="operator">{lang === 'fr' ? 'Opérateur de Saisie' : 'مشرف إدخال'}</option>
                <option value="admin">{lang === 'fr' ? 'Administrateur' : 'مشرف عام'}</option>
              </select>
            </div>

            {role === 'operator' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Wilaya assignée (Optionnel)' : 'الولاية المخصصة (اختياري)'}</label>
                <select
                  value={wilayaId}
                  onChange={(e) => setWilayaId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-sm bg-white"
                >
                  <option value="">{lang === 'fr' ? '-- Toutes les Wilayas --' : '-- كل الولايات --'}</option>
                  {wilayas.map((w) => (
                    <option key={w.id} value={w.id}>{lang === 'fr' ? w.nom_fr : w.nom_ar}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition shadow text-sm disabled:opacity-50 mt-2"
            >
              {loading ? '...' : (lang === 'fr' ? 'Créer l’Utilisateur' : 'إنشاء المستخدم')}
            </button>
          </form>
        </div>

        {/* Liste des utilisateurs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-md font-bold text-gray-800 mb-4 pb-2 border-b">
            {lang === 'fr' ? 'Liste des Utilisateurs Enregistrés' : 'قائمة المستخدمين المسجلين'}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
                <tr>
                  <th className="p-3">{lang === 'fr' ? 'Nom' : 'الاسم'}</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">{lang === 'fr' ? 'Rôle' : 'الدور'}</th>
                  <th className="p-3">{lang === 'fr' ? 'Wilaya Attribuée' : 'الولاية'}</th>
                  <th className="p-3 text-center">{lang === 'fr' ? 'Action' : 'إجراء'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-800">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 font-medium">
                        {u.wilayas ? (lang === 'fr' ? u.wilayas.nom_fr : u.wilayas.nom_ar) : <span className="text-gray-400 italic">National / Global</span>}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded bg-red-50">
                          {lang === 'fr' ? 'Supprimer' : 'حذف'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      {lang === 'fr' ? 'Aucun utilisateur trouvé.' : 'لا يوجد مستخدمون.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}