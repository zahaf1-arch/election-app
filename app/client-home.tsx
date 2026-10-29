'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClientHome({ stats }: { stats: any }) {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');

  return (
    <main className={`min-h-screen bg-gray-50 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* En-tête officiel */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-start">
            <h1 className="text-xl md:text-2xl font-bold">
              {lang === 'fr' ? 'République Islamique de Mauritanie' : 'الجمهورية الإسلامية الموريتانية'}
            </h1>
            <p className="text-emerald-200 text-xs mt-1">
              {lang === 'fr' 
                ? 'Gestion et Suivi des Élections Locales et Nationales' 
                : 'نظام تسيير ومتابعة الانتخابات المحلية والوطنية'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sélecteur de langue (Français par défaut) */}
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

            {/* Espace Sécurisé Unique */}
            <Link
              href="/login"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium transition shadow-md flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>{lang === 'fr' ? 'Espace Sécurisé' : 'تسجيل الدخول'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Section Indicateurs Clés (KPIs) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Wilayas Couvertes' : 'الولايات المغطاة'}</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.totalWilayas}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Moughataas' : 'المقاطعات'}</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.totalMoughataas}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Bureaux de Vote' : 'مكاتب التصويت'}</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">
              {stats.bureauxSaisisCount} <span className="text-lg font-normal text-gray-400">/ {stats.totalBureaux}</span>
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${stats.tauxDepouillement}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.tauxDepouillement}% {lang === 'fr' ? 'des bureaux remontés' : 'من المكاتب التي تم فرزها'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">{lang === 'fr' ? 'Partis en Lisse' : 'الأحزاب المتنافسة'}</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.totalPartis}</p>
          </div>
        </section>

        {/* Section Scrutins Électoraux */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {lang === 'fr' ? 'Scrutins Électoraux' : 'الاستحقاقات الانتخابية'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.electionTypes?.map((election: any) => (
              <div key={election.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-emerald-50 transition border-l-4 border-emerald-600 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                    {election.code}
                  </span>
                  <h3 className="font-bold text-lg text-gray-900 mt-2">
                    {lang === 'fr' ? election.nom_fr : election.nom_ar}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Liens Rapides / Actions */}
        <section className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/resultats"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl text-center shadow transition"
          >
            {lang === 'fr' ? 'Consulter les Résultats en Direct' : 'الاطلاع على النتائج المباشرة'}
          </Link>
          <Link
            href="/saisie"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-emerald-800 border border-emerald-700 font-medium rounded-xl text-center shadow-sm transition"
          >
            {lang === 'fr' ? 'Accéder à la Saisie des Procès-Verbaux' : 'الوصول إلى إدخال المحاضر'}
          </Link>
        </section>

      </div>
    </main>
  );
}