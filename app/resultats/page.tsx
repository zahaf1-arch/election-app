'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResultatsContent() {
  const searchParams = useSearchParams();
  const typeCode = (searchParams.get('type') || '').toUpperCase();

  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [loading, setLoading] = useState(false);
  const [resultatsData, setResultatsData] = useState<any>(null);

  // État pour la modale de zoom du PV
  const [selectedPvImage, setSelectedPvImage] = useState<string | null>(null);

  // Sélecteurs géographiques
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [moughataas, setMoughataas] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [bureaux, setBureaux] = useState<any[]>([]);

  // Filtres sélectionnés
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedMoughataa, setSelectedMoughataa] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedBureau, setSelectedBureau] = useState('');

  // Niveaux d'élections
  const isRegional = typeCode.includes('REGIONAL');
  const isDepartemental = typeCode.includes('DEPARTEMENT') || typeCode.includes('LEGISLATIVE');
  const isCommunal = typeCode.includes('COMMUNAL');
  const isNational = !isRegional && !isDepartemental && !isCommunal;

  // Détection si on est sur une Wilaya de Nouakchott (13, 14, 15)
  const isNouakchottWilayaSelected = selectedWilaya && ['13', '14', '15'].includes(selectedWilaya);

  // Le cumul s'affiche si le niveau requis est atteint (autorise la wilaya seule pour départemental à Nouakchott)
  const canShowCumul =
    isNational ||
    (isRegional && selectedWilaya !== '') ||
    (isDepartemental && (selectedMoughataa !== '' || isNouakchottWilayaSelected)) ||
    (isCommunal && selectedCommune !== '');

  // 1. Chargement de la langue et des Wilayas
  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'ar' || savedLang === 'fr') setLang(savedLang);

    fetch('/api/geo/wilayas')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setWilayas(data); });
  }, []);

  // Fonction de changement de langue
  const toggleLang = (newLang: 'fr' | 'ar') => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  // 2. Cascades géographiques
  useEffect(() => {
    setSelectedMoughataa('');
    setSelectedCommune('');
    setSelectedCentre('');
    setSelectedBureau('');
    setMoughataas([]);
    setCommunes([]);
    setCentres([]);
    setBureaux([]);

    if (selectedWilaya) {
      fetch(`/api/geo/moughataas?wilayaId=${selectedWilaya}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setMoughataas(data); });
    }
  }, [selectedWilaya]);

  useEffect(() => {
    setSelectedCommune('');
    setSelectedCentre('');
    setSelectedBureau('');
    setCommunes([]);
    setCentres([]);
    setBureaux([]);

    if (selectedMoughataa) {
      fetch(`/api/geo/communes?moughataaId=${selectedMoughataa}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setCommunes(data); });
    }
  }, [selectedMoughataa]);

  useEffect(() => {
    setSelectedCentre('');
    setSelectedBureau('');
    setCentres([]);
    setBureaux([]);

    if (selectedCommune) {
      fetch(`/api/geo/centres?communeId=${selectedCommune}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setCentres(data); });
    }
  }, [selectedCommune]);

  useEffect(() => {
    setSelectedBureau('');
    setBureaux([]);

    if (selectedCentre) {
      fetch(`/api/geo/bureaux?centreId=${selectedCentre}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setBureaux(data); });
    }
  }, [selectedCentre]);

  // 3. Déclenchement du cumul dès que le niveau requis est atteint
  useEffect(() => {
    if (!typeCode || !canShowCumul) {
      setResultatsData(null);
      setLoading(false);
      return;
    }

    async function loadResultats() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          type: typeCode,
          ...(selectedWilaya && { wilayaId: selectedWilaya }),
          ...(selectedMoughataa && { moughataaId: selectedMoughataa }),
          ...(selectedCommune && { communeId: selectedCommune }),
          ...(selectedCentre && { centreId: selectedCentre }),
          ...(selectedBureau && { bureauId: selectedBureau }),
        });

        const res = await fetch(`/api/resultats?${queryParams.toString()}`);
        const data = await res.json();
        setResultatsData(data);
      } catch (err) {
        console.error('Erreur chargement résultats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadResultats();
  }, [typeCode, selectedWilaya, selectedMoughataa, selectedCommune, selectedCentre, selectedBureau, canShowCumul]);

  return (
    <main className={`min-h-screen bg-gray-50 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">
              {lang === 'fr' ? 'Résultats du Scrutin' : 'نتائج الاقتراع'} : <span className="text-amber-400">{typeCode || 'Global'}</span>
            </h1>
            <p className="text-emerald-200 text-xs mt-0.5">
              {isNational && (lang === 'fr' ? 'Scrutin National : Cumul Pays entier' : 'استحقاق وطني : التجميع المباشر لكامل البلد')}
              {isRegional && (lang === 'fr' ? 'Scrutin Régional : Cumul de la Wilaya (Nouakchott groupé si applicable)' : 'استحقاق جهوي : تجميع أصوات الولاية')}
              {isDepartemental && (lang === 'fr' ? 'Scrutin Départemental : Cumul de la Moughataa / Wilaya Nouakchott' : 'استحقاق نيابي : تجميع أصوات المقاطعة')}
              {isCommunal && (lang === 'fr' ? 'Scrutin Communal : Cumul de la Commune' : 'استحقاق بلدي : تجميع أصوات البلدية')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton bascule de langue */}
            <div className="bg-emerald-900 p-1 rounded-xl flex items-center border border-emerald-700">
              <button
                onClick={() => toggleLang('fr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  lang === 'fr' ? 'bg-amber-500 text-white shadow-sm' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => toggleLang('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  lang === 'ar' ? 'bg-amber-500 text-white shadow-sm' : 'text-emerald-200 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            <Link href="/" className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-medium transition">
              {lang === 'fr' ? '← Retour Accueil' : '← العودة للرئيسية'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Barre de filtrage hiérarchique */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {lang === 'fr' ? 'Sélection du Territoire Électoral' : 'اختيار المنطقة الانتخابية'}
            </h2>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
              Type : {typeCode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* 1. Wilaya */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                {lang === 'fr' ? 'Wilaya' : 'الولاية'}
                {(isRegional || isDepartemental) && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
              >
                <option value="">{lang === 'fr' ? '-- Choisir une Wilaya --' : '-- اختر الولاية --'}</option>
                {wilayas.map((w) => (<option key={w.id} value={w.id}>{lang === 'fr' ? w.nom_fr : w.nom_ar}</option>))}
              </select>
            </div>

            {/* 2. Moughataa */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                {lang === 'fr' ? 'Moughataa' : 'المقاطعة'}
                {isDepartemental && !isNouakchottWilayaSelected && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <select
                value={selectedMoughataa}
                onChange={(e) => setSelectedMoughataa(e.target.value)}
                disabled={!selectedWilaya}
                className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                <option value="">{lang === 'fr' ? '-- Toutes les Moughataas --' : '-- جميع المقاطعات --'}</option>
                {moughataas.map((m) => (<option key={m.id} value={m.id}>{lang === 'fr' ? m.nom_fr : m.nom_ar}</option>))}
              </select>
            </div>

            {/* 3. Commune */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                {lang === 'fr' ? 'Commune' : 'البلدية'}
                {isCommunal && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <select
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                disabled={!selectedMoughataa}
                className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                <option value="">{lang === 'fr' ? '-- Toutes les Communes --' : '-- جميع البلديات --'}</option>
                {communes.map((c) => (<option key={c.id} value={c.id}>{lang === 'fr' ? c.nom_fr : c.nom_ar}</option>))}
              </select>
            </div>

            {/* 4. Centre */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">{lang === 'fr' ? 'Centre' : 'المركز'}</label>
              <select
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                disabled={!selectedCommune}
                className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                <option value="">{lang === 'fr' ? '-- Tous les Centres --' : '-- جميع المراكز --'}</option>
                {centres.map((ct) => (<option key={ct.id} value={ct.id}>{lang === 'fr' ? ct.nom_fr : ct.nom_ar}</option>))}
              </select>
            </div>

            {/* 5. Bureau */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">{lang === 'fr' ? 'Bureau (PV)' : 'المكتب (المحضر)'}</label>
              <select
                value={selectedBureau}
                onChange={(e) => setSelectedBureau(e.target.value)}
                disabled={!selectedCentre}
                className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                <option value="">{lang === 'fr' ? '-- Tous les Bureaux --' : '-- جميع المكاتب --'}</option>
                {bureaux.map((b) => (<option key={b.id} value={b.id}>{lang === 'fr' ? b.nom_fr : b.nom_ar}</option>))}
              </select>
            </div>

          </div>
        </div>

        {/* Affichage des résultats généraux et des sièges */}
        {!canShowCumul ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-10 text-center space-y-2">
            <p className="text-base font-bold">
              {isRegional && (lang === 'fr' ? 'Veuillez sélectionner une Wilaya pour afficher le cumul régional.' : 'يرجى اختيار الولاية لعرض النتائج الجهوية.')}
              {isDepartemental && (lang === 'fr' ? 'Veuillez sélectionner une Wilaya (ou Moughataa) pour afficher le cumul.' : 'يرجى اختيار الولاية أو المقاطعة لعرض النتائج.')}
              {isCommunal && (lang === 'fr' ? 'Veuillez sélectionner la Wilaya, Moughataa puis Commune pour afficher le cumul.' : 'يرجى اختيار الولاية ثم المقاطعة ثم البلدية لعرض النتائج.')}
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-16 text-gray-500 font-medium">
            {lang === 'fr' ? 'Calcul du cumul et attribution des sièges...' : 'جاري حساب النتائج وتوزيع المقاعد...'}
          </div>
        ) : resultatsData ? (
          <div className="space-y-6">
            
            {/* Bannière globale du cumul et des sièges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-800 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-semibold text-emerald-200">
                    {lang === 'fr' ? 'Total Suffrages Exprimés' : 'مجموع الأصوات المعبر عنها'}
                  </span>
                  <h3 className="text-2xl font-black mt-1">
                    {(resultatsData.totalVoixGlobal || 0).toLocaleString()} {lang === 'fr' ? 'voix' : 'صوت'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-200 block">{lang === 'fr' ? 'Partis / Listes' : 'الأحزاب'}</span>
                  <span className="text-xl font-bold">{resultatsData.partisSummary?.length || 0}</span>
                </div>
              </div>

              <div className="bg-amber-600 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-semibold text-amber-100">
                    {lang === 'fr' ? 'Total Sièges à Pourvoir' : 'إجمالي المقاعد المتنافس عليها'}
                  </span>
                  <h3 className="text-2xl font-black mt-1">
                    {resultatsData.nombreTotalSieges || 0} {lang === 'fr' ? 'sièges' : 'مقعد'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-amber-100 block">{lang === 'fr' ? 'Mode de scrutin' : 'طريقة الاقتراع'}</span>
                  <span className="text-sm font-bold bg-amber-700 px-2.5 py-1 rounded-lg">Proportionnelle</span>
                </div>
              </div>
            </div>

            {/* Répartition des voix et des sièges par parti */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex justify-between items-center">
                <span>{lang === 'fr' ? 'Répartition des Voix et des Sièges' : 'توزيع الأصوات والمقاعد'}</span>
                <span className="text-xs text-gray-500 font-normal">
                  {lang === 'fr' ? 'Quotient électoral & Plus forte moyenne' : 'العانت الانتخابي وأكبر البقايا'}
                </span>
              </h2>

              {resultatsData.partisSummary && resultatsData.partisSummary.length > 0 ? (
                <div className="space-y-4">
                  {resultatsData.partisSummary.map((p: any, index: number) => (
                    <div key={p.partiId} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center bg-slate-900 text-white rounded-full text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{lang === 'fr' ? p.nom_fr : p.nom_ar}</h4>
                            {p.sigle && <span className="text-[10px] text-gray-400 font-semibold">{p.sigle}</span>}
                          </div>
                        </div>
                        
                        {/* Affichage des Sièges et des Voix au niveau général */}
                        <div className="flex items-center gap-4 text-right">
                          <div className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl">
                            <span className="text-xs font-semibold block text-emerald-700">
                              {lang === 'fr' ? 'Sièges' : 'مقاعد'}
                            </span>
                            <span className="text-base font-black">
                              {p.sieges}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-black text-gray-900">
                              {p.totalVoix.toLocaleString()} {lang === 'fr' ? 'voix' : 'صوت'}
                            </span>
                            <span className="text-xs font-bold text-gray-500 block">{p.pourcentage}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${p.pourcentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                  {lang === 'fr' ? 'Aucune voix enregistrée pour cette zone.' : 'لا توجد أصوات مسجلة في هذه المنطقة.'}
                </div>
              )}
            </div>

            {/* PVs et Bureaux concernés */}
            {resultatsData.pvs && resultatsData.pvs.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                  {lang === 'fr' ? 'Procès-Verbaux (PV) de la Zone' : 'محاضر الفرز للمنطقة'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {resultatsData.pvs.map((pv: any, index: number) => (
                    <div key={index} className="p-4 border rounded-xl bg-gray-50 space-y-2">
                      <div className="text-xs font-bold text-emerald-800">
                        <p className="text-sm">{pv.bureauNom}</p>
                        {pv.centreNom && <p className="text-[11px] text-gray-600 font-normal">Centre: {pv.centreNom}</p>}
                      </div>
                      {pv.pvImage ? (
                        <div className="relative group cursor-pointer overflow-hidden rounded-lg border shadow-sm mt-2" onClick={() => setSelectedPvImage(pv.pvImage)}>
                          <img 
                            src={pv.pvImage} 
                            alt="PV Scanné" 
                            className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                            {lang === 'fr' ? '🔍 Cliquer pour zoomer' : '🔍 اضغط للتكبير'}
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 mt-2">
                          {lang === 'fr' ? 'Aucune image de PV' : 'لا توجد صورة محضر'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>

      {/* MODALE DE ZOOM / LIGHTBOX POUR LE PV */}
      {selectedPvImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPvImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-3 rounded-2xl shadow-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedPvImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white w-9 h-9 rounded-full font-bold flex items-center justify-center shadow-lg transition z-10"
            >
              ✕
            </button>
            <img 
              src={selectedPvImage} 
              alt="PV Zoom" 
              className="w-auto h-auto max-h-[80vh] mx-auto rounded-lg object-contain"
            />
            <div className="text-center mt-3 text-xs font-semibold text-gray-600">
              {lang === 'fr' ? 'Aperçu du Procès-Verbal (Cliquez hors de l’image pour fermer)' : 'معاينة محضر الفرز (انقر خارج الصورة للإغلاق)'}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResultatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium">
        Chargement...
      </div>
    }>
      <ResultatsContent />
    </Suspense>
  );
}