'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');

  return (
    <main className={`min-h-screen bg-gray-100 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* En-tête Administration */}
      <header className="bg-amber-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">
              {lang === 'fr' ? 'Administration - Suivi Électoral' : 'لوحة تحكم المشرف - الانتخابات'}
            </h1>
            <p className="text-amber-200 text-xs mt-0.5">
              {lang === 'fr' ? 'République Islamique de Mauritanie' : 'الجمهورية الإسلامية الموريتانية'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-900 p-1 rounded-xl flex gap-1 border border-amber-700">
              <button
                onClick={() => setLang('fr')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'fr' ? 'bg-white text-amber-900 shadow' : 'text-amber-200 hover:text-white'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  lang === 'ar' ? 'bg-white text-amber-900 shadow' : 'text-amber-200 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            <Link
              href="/"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-xl text-xs font-medium transition shadow"
            >
              {lang === 'fr' ? 'Déconnexion / Accueil' : 'الرئيسية / تسجيل الخروج'}
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu Tableau de Bord Admin */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {lang === 'fr' ? 'Tableau de Bord Administrateur' : 'لوحة التحكم الرئيسية'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {lang === 'fr' 
              ? 'Accès complet pour la saisie nationale, la validation/correction des PVs et l’affectation des candidatures.' 
              : 'صلاحيات كاملة لإدخال النتائج الوطنية، المصادقة وتعديل المحاضر وإدارة الترشيحات.'}
          </p>
        </div>

        {/* Grille d'actions rapides Admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Module 1 : Saisie Globale PVs */}
          <Link href="/saisie" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-amber-500 transition block group">
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-700 transition">
              {lang === 'fr' ? 'Saisie Globale des PVs' : 'الإدخال الشامل للمحاضر'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {lang === 'fr' ? 'Saisir les procès-verbaux pour n’importe quelle Wilaya / Moughataa.' : 'إدخال محاضر الفرز لأي ولاية أو مقاطعة بدون قيود.'}
            </p>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full inline-block">
              {lang === 'fr' ? 'Accès Super-Utilisateur' : 'صلاحية كاملة'}
            </span>
          </Link>

          {/* Module 2 : Validation & Modification des PVs */}
          <Link href="/admin/pvs" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-amber-500 transition block group">
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-700 transition">
              {lang === 'fr' ? 'Validation & Modification PVs' : 'المصادقة وتعديل المحاضر'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {lang === 'fr' ? "Revoir, corriger les voix saisies et valider définitivement les procès-verbaux." : 'مراجعة وتعديل الأصوات المدخلة والمصادقة النهائية على المحاضر.'}
            </p>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full inline-block">
              {lang === 'fr' ? 'Contrôle & Validation' : 'مراقبة ومصادقة'}
            </span>
          </Link>

          {/* Module 3 : Gestion des Candidatures */}
          <Link href="/admin/candidatures" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-amber-500 transition block group">
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-700 transition">
              {lang === 'fr' ? 'Gestion des Candidatures' : 'إدارة الترشيحات'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {lang === 'fr' ? 'Affectation des partis et listes par élection et zone géographique.' : 'ربط الأحزاب واللائحات بالانتخابات والدوائر الجغرافية.'}
            </p>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full inline-block">
              {lang === 'fr' ? 'Configuration' : 'إعداد'}
            </span>
          </Link>
{/* Carte : Gestion des Utilisateurs (Remplacer l'ancienne carte inactive) */}
<Link href="/admin/users" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-amber-500 transition block group">
  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-700 transition">
    {lang === 'fr' ? 'Gestion des Utilisateurs' : 'إدارة المستخدمين'}
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    {lang === 'fr' ? 'Création et modification des comptes opérateurs et validateurs.' : 'إنشاء وتعديل حسابات المشرفين والموظفين.'}
  </p>
  <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full inline-block">
    {lang === 'fr' ? 'Actif & Opérationnel' : 'نشط'}
  </span>
</Link>
        </div>

      </div>
    </main>
  );
}