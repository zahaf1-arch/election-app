'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ValidationPvsPage() {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPv, setSelectedPv] = useState<any | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Formulaire d'édition/correction rapide
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'ar' || savedLang === 'fr') setLang(savedLang);
  }, []);

  const toggleLang = (newLang: 'fr' | 'ar') => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pvs/anomalies');
      const data = await res.json();
      setAnomalies(data.anomalies || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des PV en anomalie:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleOpenEdit = (item: any) => {
    setSelectedPv(item);
    setEditForm({
      votants: item.votants,
      nuls: item.nuls,
      blancs: item.blancs,
      voix: item.lignesResultats.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.voix;
        return acc;
      }, {}),
    });
  };

  const handleSaveCorrection = async () => {
    if (!selectedPv) return;

    try {
      const res = await fetch('/api/admin/pvs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bureauId: selectedPv.bureauId,
          electionTypeId: selectedPv.electionTypeId,
          votants: parseInt(editForm.votants, 10),
          nuls: parseInt(editForm.nuls, 10),
          rejets: parseInt(editForm.blancs, 10), // Correspond au champ stocké
          voixDetails: editForm.voix,
        }),
      });

      if (res.ok) {
        alert(lang === 'fr' ? 'Procès-Verbal corrigé et mis à jour avec succès !' : 'تم تصحيح المحضر وتحديثه بنجاح!');
        setSelectedPv(null);
        fetchAnomalies(); // Recharger la liste des anomalies
      } else {
        alert(lang === 'fr' ? 'Erreur lors de la sauvegarde.' : 'حدث خطأ أثناء الحفظ.');
      }
    } catch (err) {
      console.error('Erreur enregistrement:', err);
    }
  };

  return (
    <main className={`min-h-screen bg-gray-50 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* En-tête avec sélecteur de langue et retour Admin */}
      <header className="bg-amber-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">
              {lang === 'fr' ? 'Contrôle & Validation des PV' : 'مراقبة ومصادقة محاضر الفرز'}
            </h1>
            <p className="text-amber-200 text-xs mt-0.5">
              {lang === 'fr' ? 'Détection automatique des anomalies et incohérences' : 'الكشف التلقائي عن الأخطاء والتناقضات'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-900 p-1 rounded-xl flex items-center border border-amber-700">
              <button
                onClick={() => toggleLang('fr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  lang === 'fr' ? 'bg-white text-amber-900 shadow' : 'text-amber-200 hover:text-white'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => toggleLang('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  lang === 'ar' ? 'bg-white text-amber-900 shadow' : 'text-amber-200 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            <Link
              href="/admin"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-xl text-xs font-medium transition shadow"
            >
              {lang === 'fr' ? '← Retour Admin' : '← العودة لوحة التحكم'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {lang === 'fr' ? 'Liste des PV en Anomalie' : 'قائمة المحاضر التي بها أخطاء'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'fr' 
                ? 'Vérification arithmétique des votes (Votants, Inscrits, Nuls et Voix).' 
                : 'التحقق الحسابي للأصوات (المصوتون، المسجلون، الباطلة، الأصوات).'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-red-100 text-red-800 text-xs font-bold px-4 py-2 rounded-xl">
              {anomalies.length} {lang === 'fr' ? 'PV(s) en Incohérence' : 'محضر(ات) غير متطابقة'}
            </span>
            <button
              onClick={fetchAnomalies}
              className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
            >
              ↻ {lang === 'fr' ? 'Actualiser' : 'تحديث'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">
            {lang === 'fr' ? 'Analyse des Procès-Verbaux en cours...' : 'جاري تحليل محاضر الفرز...'}
          </div>
        ) : anomalies.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-12 text-center font-bold text-sm">
            {lang === 'fr' ? '✓ Aucun PV en anomalie. Tous les procès-verbaux sont conformes !' : '✓ لا توجد محاضر بها أخطاء. كافة المحاضر مطابقة!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {anomalies.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      {item.electionNom} ({item.electionCode})
                    </span>
                    <h3 className="text-base font-black text-gray-900 mt-1">
                      {item.wilayaNom} → {item.moughataaNom} → {item.communeNom}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-800">
                      {lang === 'fr' ? 'Centre' : 'المركز'} : {item.centreNom} | <span className="font-bold">{item.bureauNom}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    ✏️ {lang === 'fr' ? 'Corriger & Valider' : 'تصحيح ومصادقة'}
                  </button>
                </div>

                {/* Erreurs signalées */}
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl space-y-1">
                  <span className="text-xs font-bold text-red-900 uppercase">
                    {lang === 'fr' ? 'Anomalies détectées :' : 'الأخطاء المكتشفة :'}
                  </span>
                  <ul className="list-disc list-inside text-xs font-semibold text-red-700 space-y-0.5">
                    {item.erreurs.map((err: string, eIdx: number) => (
                      <li key={eIdx}>{err}</li>
                    ))}
                  </ul>
                </div>

                {/* Chiffres du PV */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-gray-500 block">{lang === 'fr' ? 'Inscrits' : 'المسجلون'}</span>
                    <span className="font-bold text-gray-900">{item.inscrits}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{lang === 'fr' ? 'Votants' : 'المصوتون'}</span>
                    <span className="font-bold text-red-600">{item.votants}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{lang === 'fr' ? 'Nuls' : 'الباطلة'}</span>
                    <span className="font-bold text-gray-900">{item.nuls}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{lang === 'fr' ? 'Blancs' : 'البيضاء'}</span>
                    <span className="font-bold text-gray-900">{item.blancs}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{lang === 'fr' ? 'Somme Voix Partis' : 'مجموع أصوات الأحزاب'}</span>
                    <span className="font-bold text-emerald-700">{item.sommeVoixCandidats}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODALE DE CORRECTION DU PV */}
        {selectedPv && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {lang === 'fr' ? 'Correction du PV :' : 'تصحيح محضر الفرز :'} {selectedPv.bureauNom}
                  </h2>
                  <p className="text-xs text-gray-500">{selectedPv.electionNom}</p>
                </div>
                <button
                  onClick={() => setSelectedPv(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulaire de modification */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-gray-700">
                    {lang === 'fr' ? 'Chiffres Globaux' : 'الأرقام العامة'}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block">{lang === 'fr' ? 'Votants' : 'المصوتون'}</label>
                      <input
                        type="number"
                        value={editForm.votants}
                        onChange={(e) => setEditForm({ ...editForm, votants: e.target.value })}
                        className="w-full p-2 border rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block">{lang === 'fr' ? 'Nuls' : 'الباطلة'}</label>
                      <input
                        type="number"
                        value={editForm.nuls}
                        onChange={(e) => setEditForm({ ...editForm, nuls: e.target.value })}
                        className="w-full p-2 border rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block">{lang === 'fr' ? 'Blancs' : 'البيضاء'}</label>
                      <input
                        type="number"
                        value={editForm.blancs}
                        onChange={(e) => setEditForm({ ...editForm, blancs: e.target.value })}
                        className="w-full p-2 border rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold uppercase text-gray-700 pt-2">
                    {lang === 'fr' ? 'Voix par Parti / Liste' : 'الأصوات حسب الحزب / اللائحة'}
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {selectedPv.lignesResultats.map((ligne: any) => (
                      <div key={ligne.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border">
                        <span className="text-xs font-bold text-gray-800">{ligne.partiNom}</span>
                        <input
                          type="number"
                          value={editForm.voix[ligne.id] ?? ligne.voix}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              voix: { ...editForm.voix, [ligne.id]: parseInt(e.target.value, 10) || 0 },
                            })
                          }
                          className="w-24 p-1.5 border rounded-lg text-xs font-black text-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aperçu du PV scanné pour vérification visuelle */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-gray-700">
                    {lang === 'fr' ? 'Procès-Verbal Scanné' : 'محضر الفرز الممسوح ضوئياً'}
                  </h3>
                  {selectedPv.pvImage ? (
                    <div className="relative group cursor-pointer" onClick={() => setZoomImage(selectedPv.pvImage)}>
                      <img
                        src={selectedPv.pvImage}
                        alt="PV Scanné"
                        className="w-full h-80 object-cover rounded-xl border shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold rounded-xl">
                        {lang === 'fr' ? '🔍 Cliquer pour agrandir' : '🔍 اضغط للتكبير'}
                      </div>
                    </div>
                  ) : (
                    <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      {lang === 'fr' ? 'Aucune image scannée jointe à ce bureau.' : 'لا توجد صورة محضر مرفقة بهذا المكتب.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setSelectedPv(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  onClick={handleSaveCorrection}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  💾 {lang === 'fr' ? 'Enregistrer & Valider le PV' : 'حفظ ومصادقة المحضر'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX ZOOM */}
        {zoomImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setZoomImage(null)}
          >
            <img src={zoomImage} alt="Zoom PV" className="max-w-full max-h-[90vh] rounded-lg object-contain" />
          </div>
        )}
      </div>
    </main>
  );
}