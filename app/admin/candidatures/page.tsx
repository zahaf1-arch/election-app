'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCandidaturesPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');

  // Listes de données
  const [partisDisponibles, setPartisDisponibles] = useState<any[]>([]);
  const [electionTypes, setElectionTypes] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [moughataas, setMoughataas] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [candidatures, setCandidatures] = useState<any[]>([]);

  // Sélections
  const [selectedElectionType, setSelectedElectionType] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedMoughataa, setSelectedMoughataa] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedParti, setSelectedParti] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingPartis, setLoadingPartis] = useState(false);
  const [filterElection, setFilterElection] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'ar' || savedLang === 'fr') setLang(savedLang);

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    loadCandidatures();
    loadElectionTypes();
    loadWilayas();
  }, [router]);

  const toggleLang = (l: 'fr' | 'ar') => {
    setLang(l);
    localStorage.setItem('app_lang', l);
  };

  const loadCandidatures = () => {
    fetch('/api/candidatures')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCandidatures(data); });
  };

  const loadElectionTypes = () => {
    fetch('/api/election-types').then((res) => res.json()).then((data) => setElectionTypes(data));
  };

  const loadWilayas = () => {
    fetch('/api/geo/wilayas').then((res) => res.json()).then((data) => setWilayas(data));
  };

  // Cascades géographiques
  useEffect(() => {
    setSelectedMoughataa(''); setSelectedCommune('');
    setMoughataas([]); setCommunes([]);
    if (selectedWilaya) {
      fetch(`/api/geo/moughataas?wilayaId=${selectedWilaya}`)
        .then((res) => res.json())
        .then((data) => setMoughataas(data));
    }
  }, [selectedWilaya]);

  useEffect(() => {
    setSelectedCommune(''); setCommunes([]);
    if (selectedMoughataa) {
      fetch(`/api/geo/communes?moughataaId=${selectedMoughataa}`)
        .then((res) => res.json())
        .then((data) => setCommunes(data));
    }
  }, [selectedMoughataa]);

  // Analyse du type d'élection
  const selectedElectionObj = electionTypes.find((et) => et.id.toString() === selectedElectionType);
  const electionCode = selectedElectionObj ? selectedElectionObj.code.toLowerCase() : '';

  const isNational = electionCode.includes('presid') || electionCode.includes('nat');
  const isRegional = electionCode.includes('region');
  const isLegislative = electionCode.includes('legis') || electionCode.includes('depart');
  const isCommunale = electionCode.includes('commun');

  // Filtrage intelligent de la liste des Wilayas : 
  // Si l'élection est Régionale ou Communale, on exclut "Étranger"
  const filteredWilayas = wilayas.filter((w) => {
    const nom = (w.nom_fr || '').toLowerCase();
    const isEtranger = nom.includes('etranger') || nom.includes('étranger');
    if ((isRegional || isCommunale) && isEtranger) {
      return false;
    }
    return true;
  });

  // Analyse de la Wilaya sélectionnée
  const selectedWilayaObj = wilayas.find((w) => w.id.toString() === selectedWilaya);
  const selectedWilayaNom = selectedWilayaObj ? (selectedWilayaObj.nom_fr || '').toLowerCase() : '';
  const isNouakchottWilaya = selectedWilayaNom.includes('nouakchott');

  // Vérifier si la sélection géographique est complète
  const isGeoReady = isNational 
    || (isRegional && (isNouakchottWilaya || selectedWilaya))
    || (isLegislative && (isNouakchottWilaya || selectedMoughataa))
    || (isCommunale && selectedCommune);

  // Charger les partis NON affectés dès que la zone est définie
  useEffect(() => {
    setSelectedParti('');
    setPartisDisponibles([]);

    if (!selectedElectionType || !isGeoReady) return;

    setLoadingPartis(true);
    const params = new URLSearchParams({
      availableForScope: 'true',
      electionTypeId: selectedElectionType,
      ...(selectedWilaya && { wilayaId: selectedWilaya }),
      ...(selectedMoughataa && { moughataaId: selectedMoughataa }),
      ...(selectedCommune && { communeId: selectedCommune }),
    });

    fetch(`/api/partis?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPartisDisponibles(data);
      })
      .catch((err) => console.error('Erreur chargement partis disponibles:', err))
      .finally(() => setLoadingPartis(false));
  }, [selectedElectionType, selectedWilaya, selectedMoughataa, selectedCommune, isGeoReady]);

  // Enregistrement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let scope = 'national';
    if (isRegional) scope = 'regional';
    else if (isLegislative) scope = 'legislative';
    else if (isCommunale) scope = 'municipale';

    try {
      const res = await fetch('/api/candidatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partiId: selectedParti,
          electionTypeId: selectedElectionType,
          scope,
          wilayaId: !isNational && selectedWilaya ? selectedWilaya : null,
          moughataaId: (isLegislative || isCommunale) && selectedMoughataa ? selectedMoughataa : null,
          communeId: isCommunale && selectedCommune ? selectedCommune : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’affectation');

      setSelectedParti('');
      loadCandidatures();
      
      const params = new URLSearchParams({
        availableForScope: 'true',
        electionTypeId: selectedElectionType,
        ...(selectedWilaya && { wilayaId: selectedWilaya }),
        ...(selectedMoughataa && { moughataaId: selectedMoughataa }),
        ...(selectedCommune && { communeId: selectedCommune }),
      });
      fetch(`/api/partis?${params.toString()}`).then(r => r.json()).then(d => setPartisDisponibles(d));

      alert(lang === 'fr' ? '✅ Candidature enregistrée sans doublon !' : '✅ تم تسجيل الترشيح بنجاح دون تكرار!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette candidature ?' : 'حذف هذا الترشيح؟')) return;
    try {
      const res = await fetch(`/api/candidatures?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadCandidatures();
        if (selectedElectionType && isGeoReady) {
          const params = new URLSearchParams({
            availableForScope: 'true',
            electionTypeId: selectedElectionType,
            ...(selectedWilaya && { wilayaId: selectedWilaya }),
            ...(selectedMoughataa && { moughataaId: selectedMoughataa }),
            ...(selectedCommune && { communeId: selectedCommune }),
          });
          fetch(`/api/partis?${params.toString()}`).then(r => r.json()).then(d => setPartisDisponibles(d));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCandidatures = filterElection
    ? candidatures.filter((c) => c.electionTypeId.toString() === filterElection)
    : candidatures;

  return (
    <main className={`min-h-screen bg-gray-100 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs uppercase">ADMIN</span>
            <h1 className="text-xl font-bold">{lang === 'fr' ? 'Gestion des Candidatures' : 'إدارة الترشيحات'}</h1>
          </div>
          <div className="flex gap-3">
            <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
              <button onClick={() => toggleLang('fr')} className={`px-3 py-1 rounded-lg text-xs font-medium ${lang === 'fr' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Français</button>
              <button onClick={() => toggleLang('ar')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${lang === 'ar' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>العربية</button>
            </div>
            <Link href="/admin" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700">
              {lang === 'fr' ? 'Tableau de Bord' : 'لوحة القيادة'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulaire filtré sans doublons */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-md font-bold text-gray-800 mb-4 pb-2 border-b">
            {lang === 'fr' ? 'Affectation sans doublon' : 'ربط ترشيح دون تكرار'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Type d'élection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'fr' ? '1. Type d’Élection' : '1. نوع الانتخابات'}
              </label>
              <select
                value={selectedElectionType}
                onChange={(e) => {
                  setSelectedElectionType(e.target.value);
                  setSelectedWilaya('');
                  setSelectedMoughataa('');
                  setSelectedCommune('');
                }}
                required
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white font-semibold"
              >
                <option value="">{lang === 'fr' ? '-- Choisir une élection --' : '-- اختر الانتخابات --'}</option>
                {electionTypes.map((et) => (
                  <option key={et.id} value={et.id}>{lang === 'fr' ? et.nom_fr : et.nom_ar}</option>
                ))}
              </select>
            </div>

            {/* 2. Définition Géographique */}
          {selectedElectionType && !isNational && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <p className="text-xs font-bold text-emerald-900">
                {lang === 'fr' ? '2. Sélectionner la Zone' : '2. تحديد الدائرة'}
              </p>

              {/* Wilaya */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Wilaya' : 'الولاية'}</label>
                <select
                  value={selectedWilaya}
                  onChange={(e) => {
                    setSelectedWilaya(e.target.value);
                    setSelectedMoughataa('');
                    setSelectedCommune('');
                  }}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                >
                  <option value="">{lang === 'fr' ? '-- Choisir Wilaya --' : '-- اختر الولاية --'}</option>
                  {filteredWilayas.map((w) => (
                    <option key={w.id} value={w.id}>{lang === 'fr' ? w.nom_fr : w.nom_ar}</option>
                  ))}
                </select>
              </div>

              {/* Moughataa (Affichée pour Législatives ou Communales, y compris à Nouakchott pour les municipales) */}
              {(isLegislative || isCommunale) && (!isNouakchottWilaya || isCommunale) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Moughataa' : 'المقاطعة'}</label>
                  <select
                    value={selectedMoughataa}
                    onChange={(e) => {
                      setSelectedMoughataa(e.target.value);
                      setSelectedCommune('');
                    }}
                    required
                    disabled={!selectedWilaya}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="">{lang === 'fr' ? '-- Choisir Moughataa --' : '-- اختر المقاطعة --'}</option>
                    {moughataas.map((m) => (
                      <option key={m.id} value={m.id}>{lang === 'fr' ? m.nom_fr : m.nom_ar}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Commune (Uniquement pour les Municipales) */}
              {isCommunale && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Commune' : 'البلدية'}</label>
                  <select
                    value={selectedCommune}
                    onChange={(e) => setSelectedCommune(e.target.value)}
                    required
                    disabled={!selectedMoughataa}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="">{lang === 'fr' ? '-- Choisir Commune --' : '-- اختر البلدية --'}</option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.id}>{lang === 'fr' ? c.nom_fr : c.nom_ar}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

            {/* 3. Choix du Parti */}
            {selectedElectionType && isGeoReady && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'fr' ? '3. Parti / Candidat (Non encore affecté)' : '3. الحزب / المترشح (غير مسجل بعد)'}
                </label>
                {loadingPartis ? (
                  <p className="text-xs text-gray-500 py-2">{lang === 'fr' ? 'Vérification des partis disponibles...' : 'جاري البحث عن الأحزاب المتاحة...'}</p>
                ) : partisDisponibles.length > 0 ? (
                  <select
                    value={selectedParti}
                    onChange={(e) => setSelectedParti(e.target.value)}
                    required
                    className="w-full p-2.5 border border-emerald-500 rounded-xl text-sm bg-emerald-50 font-medium"
                  >
                    <option value="">{lang === 'fr' ? '-- Choisir un Parti non affecté --' : '-- اختر حزباً غير مسجل --'}</option>
                    {partisDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>{lang === 'fr' ? p.nom_fr : p.nom_ar}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                    {lang === 'fr' 
                      ? 'Tous les partis sont déjà affectés à cette circonscription.' 
                      : 'جميع الأحزاب مسجلة بالفعل في هذه الدائرة.'}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedParti}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition shadow text-sm disabled:opacity-50"
            >
              {loading ? (lang === 'fr' ? 'Enregistrement...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer la Candidature' : 'تأكيد الترشيح')}
            </button>
          </form>
        </div>

        {/* Liste des candidatures existantes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pb-2 border-b">
            <h2 className="text-md font-bold text-gray-800">
              {lang === 'fr' ? 'Registre des Candidatures Actives' : 'سجل الترشيحات المفعلة'}
            </h2>
            <select
              value={filterElection}
              onChange={(e) => setFilterElection(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-xs bg-gray-50 font-medium"
            >
              <option value="">{lang === 'fr' ? 'Toutes les élections' : 'جميع الانتخابات'}</option>
              {electionTypes.map((et) => (
                <option key={et.id} value={et.id}>{lang === 'fr' ? et.nom_fr : et.nom_ar}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
                <tr>
                  <th className="p-3">{lang === 'fr' ? 'Parti' : 'الحزب'}</th>
                  <th className="p-3">{lang === 'fr' ? 'Élection' : 'الانتخابات'}</th>
                  <th className="p-3">{lang === 'fr' ? 'Circonscription' : 'الدائرة'}</th>
                  <th className="p-3 text-center">{lang === 'fr' ? 'Action' : 'إجراء'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCandidatures.length > 0 ? (
                  filteredCandidatures.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-800">{lang === 'fr' ? c.partis?.nom_fr : c.partis?.nom_ar}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-100 rounded-md font-medium text-gray-700">
                          {lang === 'fr' ? c.election_types?.nom_fr : c.election_types?.nom_ar}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">
                        {c.estNationale && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">National</span>}
                        {c.wilayas && !c.moughataas && <span>Wilaya : {lang === 'fr' ? c.wilayas.nom_fr : c.wilayas.nom_ar}</span>}
                        {c.moughataas && !c.communes && <span>Moughataa : {lang === 'fr' ? c.moughataas.nom_fr : c.moughataas.nom_ar}</span>}
                        {c.communes && <span>Commune : {lang === 'fr' ? c.communes.nom_fr : c.communes.nom_ar}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded bg-red-50">
                          {lang === 'fr' ? 'Supprimer' : 'حذف'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      {lang === 'fr' ? 'Aucune candidature enregistrée.' : 'لا توجد ترشيحات مسجلة.'}
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