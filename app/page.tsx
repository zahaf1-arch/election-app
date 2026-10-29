'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <main className={`min-h-screen bg-gray-50 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* En-tête officiel avec Logo */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo + Titre principal */}
          <div className="flex items-center gap-4 text-center md:text-start">
            <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center shrink-0">
              <Image 
                src="/logo.jpg" 
                alt="Mauritanie Insoumise Logo" 
                width={80} 
                height={50} 
                className="object-contain h-12 w-auto"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {lang === 'fr' ? 'Mauritanie Insoumise' : 'موريتانيا الأبية'}
              </h1>
              <p className="text-emerald-200 text-xs mt-0.5">
                {lang === 'fr' 
                  ? 'Gestion et Suivi des Élections Locales et Nationales' 
                  : 'نظام تسيير ومتابعة الانتخابات المحلية والوطنية'}
              </p>
            </div>
          </div>
          
          {/* Langue & Connexion */}
          <div className="flex items-center gap-4">
            <div className="bg-emerald-900 p-1 rounded-xl flex gap-1 border border-emerald-700">
              <button
                onClick={() => setLang('fr')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'fr' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  lang === 'ar' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-200 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            <Link
              href="/login"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition shadow-md flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {/*<span>{lang === 'fr' ? 'Espace Sécurisé' : 'تسجيل الدخول'}</span>*/}
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu Principal Public */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {loading ? (
          <div className="text-center py-16 text-gray-500 font-medium">
            {lang === 'fr' ? 'Chargement des indicateurs électoraux...' : 'جاري تحميل المؤشرات الانتخابية...'}
          </div>
        ) : (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Wilayas Couvertes' : 'الولايات المغطاة'}</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">{stats?.totalWilayas || 16}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Moughataas' : 'المقاطعات'}</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">{stats?.totalMoughataas || 67}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Bureaux de Vote' : 'مكاتب التصويت'}</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">
                  {stats?.bureauxSaisisCount || 0} <span className="text-lg font-normal text-gray-400">/ {stats?.totalBureaux || 4503}</span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                  <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${stats?.tauxDepouillement || 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.tauxDepouillement || 0}% {lang === 'fr' ? 'des bureaux remontés' : 'من المكاتب التي تم فرزها'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Partis en Lisse' : 'الأحزاب المتنافسة'}</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">{stats?.totalPartis || 9}</p>
              </div>
            </section>

            {/* Scrutins avec liens vers les résultats */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {lang === 'fr' ? 'Scrutins Électoraux' : 'الاستحقاقات الانتخابية'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats?.electionTypes?.map((election: any) => (
                  <div key={election.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-emerald-50 transition border-l-4 border-emerald-600 flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                          {election.code}
                        </span>
                        <span className="text-xs text-emerald-700 opacity-0 group-hover:opacity-100 transition font-medium flex items-center gap-1">
                          {lang === 'fr' ? 'Voir résultats' : 'عرض النتائج'} &rarr;
                        </span>
                      </div>

                      <Link 
                        href={`/resultats?type=${election.code}`}
                        className="font-bold text-lg text-gray-900 group-hover:text-emerald-800 transition block hover:underline"
                      >
                        {lang === 'fr' ? election.nom_fr : election.nom_ar}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

      </div>
    </main>
  );
}