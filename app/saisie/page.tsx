'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SaisiePage() {
  const router = useRouter();
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');

  // Utilisateur connecté et rôle/wilaya
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Listes géographiques et électorales
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [moughataas, setMoughataas] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [bureaux, setBureaux] = useState<any[]>([]);
  const [electionTypes, setElectionTypes] = useState<any[]>([]);
  const [partis, setPartis] = useState<any[]>([]);

  // Sélection utilisateur
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedMoughataa, setSelectedMoughataa] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedBureau, setSelectedBureau] = useState('');
  const [selectedElectionType, setSelectedElectionType] = useState('');

  // Données du bureau et du PV
  const [selectedBureauInscrits, setSelectedBureauInscrits] = useState(0);
  const [votants, setVotants] = useState('');
  const [bulletinsNuls, setBulletinsNuls] = useState('');
  const [bulletinsRejetes, setBulletinsRejetes] = useState('');
  const [voixPartis, setVoixPartis] = useState<{ [key: number]: string }>({});
  const [pvImage, setPvImage] = useState<string>('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang === 'ar' || savedLang === 'fr') setLang(savedLang);

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    try {
      const userParsed = JSON.parse(storedUser);
      setCurrentUser(userParsed);

      // 🟢 Si l'utilisateur est un opérateur rattaché à une wilaya spécifique, on verrouille sa wilaya
      if (userParsed.wilayaId) {
        setSelectedWilaya(userParsed.wilayaId.toString());
      }
    } catch (e) {
      console.error("Erreur lecture utilisateur:", e);
    }

    loadWilayas();
    loadElectionTypes();
  }, [router]);

  const toggleLang = (l: 'fr' | 'ar') => {
    setLang(l);
    localStorage.setItem('app_lang', l);
  };

  const loadWilayas = () => {
    fetch('/api/geo/wilayas')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setWilayas(data); });
  };

  const loadElectionTypes = () => {
    fetch('/api/election-types')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setElectionTypes(data); });
  };

  // Analyse du type d'élection sélectionné
  const selectedElectionObj = electionTypes.find((et) => et.id.toString() === selectedElectionType);
  const electionCode = selectedElectionObj ? selectedElectionObj.code.toLowerCase() : '';

  const isNational = electionCode.includes('presid') || electionCode.includes('nat');
  const isRegional = electionCode.includes('region');
  const isLegislative = electionCode.includes('legis') || electionCode.includes('depart');
  const isCommunale = electionCode.includes('commun');

  // Analyse de la Wilaya choisie
  const selectedWilayaObj = wilayas.find((w) => w.id.toString() === selectedWilaya);
  const selectedWilayaNom = selectedWilayaObj ? (selectedWilayaObj.nom_fr || '').toLowerCase() : '';
  const isEtrangerWilaya = selectedWilayaNom.includes('etranger') || selectedWilayaNom.includes('étranger');
  const isNouakchottWilaya = selectedWilayaNom.includes('nouakchott');

  // Filtrage des Wilayas
  const filteredWilayas = wilayas.filter((w) => {
    // Si l'opérateur a une wilaya assignée, il ne voit que la sienne
    if (currentUser?.wilayaId && currentUser.wilayaId.toString() !== w.id.toString()) {
      return false;
    }
    const nom = (w.nom_fr || '').toLowerCase();
    const isEtranger = nom.includes('etranger') || nom.includes('étranger');
    if ((isRegional || isCommunale) && isEtranger) return false;
    return true;
  });

  // Cascades géographiques
  useEffect(() => {
    if (!selectedWilaya) return;
    fetch(`/api/geo/moughataas?wilayaId=${selectedWilaya}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setMoughataas(data); });
  }, [selectedWilaya]);

  useEffect(() => {
    if (!selectedMoughataa) return;
    fetch(`/api/geo/communes?moughataaId=${selectedMoughataa}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCommunes(data); });
  }, [selectedMoughataa]);

  useEffect(() => {
    if (!selectedCommune && !selectedMoughataa) return;
    
    const targetUrl = isLegislative && isNouakchottWilaya 
      ? `/api/geo/centres?wilayaId=${selectedWilaya}`
      : selectedCommune 
        ? `/api/geo/centres?communeId=${selectedCommune}`
        : `/api/geo/centres?moughataaId=${selectedMoughataa}`;

    fetch(targetUrl)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCentres(data);
        else setCentres([]);
      })
      .catch(() => setCentres([]));
  }, [selectedCommune, selectedMoughataa, selectedWilaya, isLegislative, isNouakchottWilaya]);

  useEffect(() => {
    if (!selectedCentre) return;
    fetch(`/api/geo/bureaux?centreId=${selectedCentre}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setBureaux(data); });
  }, [selectedCentre]);

  useEffect(() => {
    if (!selectedBureau) {
      setSelectedBureauInscrits(0);
      return;
    }
    const bureauObj = bureaux.find((b: any) => b.id.toString() === selectedBureau);
    if (bureauObj) {
      setSelectedBureauInscrits(bureauObj.nombreInscrits || 0);
      setVotants(bureauObj.nombreVotants ? bureauObj.nombreVotants.toString() : '');
    }
  }, [selectedBureau, bureaux]);

  // Chargement des partis candidats et des saisies existantes
  useEffect(() => {
    setPartis([]);
    setVoixPartis({});
    setPvImage('');

    if (!selectedElectionType || !selectedBureau) return;

    const isNouakchottLegis = isLegislative && isNouakchottWilaya;

    const queryParams = new URLSearchParams({
      availableForScope: 'true',
      forSaisie: 'true', // 🟢 Indique à l'API qu'on veut UNIQUEMENT les candidats déclarés
      electionTypeId: selectedElectionType,
      ...(selectedWilaya && { wilayaId: selectedWilaya }),
      ...(!isNouakchottLegis && selectedMoughataa && { moughataaId: selectedMoughataa }),
      ...(selectedCommune && { communeId: selectedCommune }),
    });

    let isMounted = true;

    Promise.all([
      fetch(`/api/partis?${queryParams.toString()}`).then((res) => res.json()),
      fetch(`/api/saisie?bureauId=${selectedBureau}`).then((res) => res.json())
    ])
      .then(([partisCandidats, existingSaisies]) => {
        if (!isMounted) return;

        setPartis(Array.isArray(partisCandidats) ? partisCandidats : []);

        const currentSaisie = Array.isArray(existingSaisies) 
          ? existingSaisies.filter((s: any) => s.electionTypeId.toString() === selectedElectionType) 
          : [];

        if (currentSaisie.length > 0) {
          setBulletinsNuls(currentSaisie[0].voixNuls !== null ? currentSaisie[0].voixNuls.toString() : '');
          setBulletinsRejetes(currentSaisie[0].voixRejetes !== null ? currentSaisie[0].voixRejetes.toString() : '');
          setPvImage(currentSaisie[0].pvImage || '');

          const voixMap: { [key: number]: string } = {};
          currentSaisie.forEach((s: any) => {
            voixMap[s.partiId] = s.nombreVoix ? s.nombreVoix.toString() : '0';
          });
          setVoixPartis(voixMap);
        } else {
          setBulletinsNuls('');
          setBulletinsRejetes('');
          setPvImage('');
          setVoixPartis({});
        }
      })
      .catch((err) => console.error('Erreur chargement partis/saisie:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedElectionType, selectedBureau, selectedWilaya, selectedMoughataa, selectedCommune, isLegislative, isNouakchottWilaya]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPvImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalV = parseInt(votants || '0', 10);
    if (totalV > selectedBureauInscrits) {
      alert(lang === 'fr' ? '❌ Erreur : Le nombre de votants ne peut pas dépasser les inscrits.' : '❌ خطأ: عدد المقترعين يتجاوز عدد المسجلين.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bureauId: parseInt(selectedBureau, 10),
        electionTypeId: parseInt(selectedElectionType, 10),
        votants: totalV,
        voixNuls: parseInt(bulletinsNuls || '0', 10),
        voixRejetes: parseInt(bulletinsRejetes || '0', 10),
        pvImage,
        voixPartis: Object.entries(voixPartis).map(([partiId, voix]) => ({
          partiId: parseInt(partiId, 10),
          nombreVoix: parseInt(voix || '0', 10),
        })),
      };

      const res = await fetch('/api/saisie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’enregistrement');

      alert(lang === 'fr' ? '✅ Résultats et PV enregistrés avec succès !' : '✅ تم حفظ النتائج والمحضر بنجاح!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gray-50 text-gray-900 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{lang === 'fr' ? 'Saisie des Résultats & PV' : 'إدخال النتائج والمحاضر'}</h1>
            <p className="text-emerald-200 text-xs mt-0.5">
              {currentUser?.wilayaNom ? (lang === 'fr' ? `Zone assignée : Wilaya de ${currentUser.wilayaNom}` : `المنطقة المخصصة : ولاية ${currentUser.wilayaNom}`) : (lang === 'fr' ? 'Modules officiels de dépouillement' : 'بوابة الفرز الرسمية')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-900 p-1 rounded-xl flex gap-1 border border-emerald-700">
              <button onClick={() => toggleLang('fr')} className={`px-3 py-1 rounded-lg text-xs font-medium ${lang === 'fr' ? 'bg-white text-emerald-900' : 'text-emerald-200'}`}>Français</button>
              <button onClick={() => toggleLang('ar')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${lang === 'ar' ? 'bg-white text-emerald-900' : 'text-emerald-200'}`}>العربية</button>
            </div>
            <Link href="/" className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-medium transition">
              {lang === 'fr' ? '← Accueil' : '← الرئيسية'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Étape 1 : Localisation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider pb-2 border-b">
            {lang === 'fr' ? '1. Localisation du Bureau de Vote' : '1. تحديد مكتب الاقتراع'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Wilaya' : 'الولاية'}</label>
              <select
                value={selectedWilaya}
                disabled={!!currentUser?.wilayaId} // Verrouillé si l'opérateur a une wilaya fixe
                onChange={(e) => {
                  setSelectedWilaya(e.target.value);
                  setSelectedMoughataa('');
                  setSelectedCommune('');
                  setSelectedCentre('');
                  setSelectedBureau('');
                }}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{lang === 'fr' ? '-- Wilaya --' : '-- الولاية --'}</option>
                {filteredWilayas.map((w) => (
                  <option key={w.id} value={w.id}>{lang === 'fr' ? w.nom_fr : w.nom_ar}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Moughataa' : 'المقاطعة'}</label>
              <select
                value={selectedMoughataa}
                onChange={(e) => {
                  setSelectedMoughataa(e.target.value);
                  setSelectedCommune('');
                  setSelectedCentre('');
                  setSelectedBureau('');
                }}
                disabled={!selectedWilaya}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white disabled:bg-gray-100"
              >
                <option value="">{lang === 'fr' ? '-- Moughataa --' : '-- المقاطعة --'}</option>
                {moughataas.map((m) => (
                  <option key={m.id} value={m.id}>{lang === 'fr' ? m.nom_fr : m.nom_ar}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Commune' : 'البلدية'}</label>
              <select
                value={selectedCommune}
                onChange={(e) => {
                  setSelectedCommune(e.target.value);
                  setSelectedCentre('');
                  setSelectedBureau('');
                }}
                disabled={!selectedMoughataa || isEtrangerWilaya}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white disabled:bg-gray-100"
              >
                <option value="">{lang === 'fr' ? '-- Commune --' : '-- البلدية --'}</option>
                {communes.map((c) => (
                  <option key={c.id} value={c.id}>{lang === 'fr' ? c.nom_fr : c.nom_ar}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Centre de Vote' : 'مركز الاقتراع'}</label>
              <select
                value={selectedCentre}
                onChange={(e) => {
                  setSelectedCentre(e.target.value);
                  setSelectedBureau('');
                }}
                disabled={!selectedWilaya}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white disabled:bg-gray-100"
              >
                <option value="">{lang === 'fr' ? '-- Centre --' : '-- المركز --'}</option>
                {centres.map((ct) => (
                  <option key={ct.id} value={ct.id}>{lang === 'fr' ? ct.nom_fr : ct.nom_ar}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Bureau de Vote' : 'مكتب الاقتراع'}</label>
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              disabled={!selectedCentre}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white font-bold text-emerald-800 disabled:bg-gray-100"
            >
              <option value="">{lang === 'fr' ? '-- Choisir le Bureau de Vote --' : '-- اختر مكتب الاقتراع --'}</option>
              {bureaux.map((b) => (
                <option key={b.id} value={b.id}>
                  {lang === 'fr' ? b.nom_fr : b.nom_ar} (Inscrits : {b.nombreInscrits || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Étape 2 : Type de Scrutin */}
        {selectedBureau && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider pb-2 border-b">
              {lang === 'fr' ? '2. Type d’Élection' : '2. نوع الانتخابات'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {electionTypes.map((et) => {
                const code = et.code.toLowerCase();
                const isDisallowedForEtranger = isEtrangerWilaya && (code.includes('region') || code.includes('commun'));

                return (
                  <button
                    key={et.id}
                    type="button"
                    disabled={isDisallowedForEtranger}
                    onClick={() => setSelectedElectionType(et.id.toString())}
                    className={`p-4 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      isDisallowedForEtranger 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : selectedElectionType === et.id.toString()
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <span>{lang === 'fr' ? et.nom_fr : et.nom_ar}</span>
                    {isDisallowedForEtranger && <span className="text-[10px] text-red-500 font-normal">Non concerné</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 3 : Saisie des Voix */}
        {selectedElectionType && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {lang === 'fr' ? '3. Saisie des Bulletins et des Voix' : '3. إدخال الأصوات والأوراق'}
                </h2>
                <div className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-semibold border border-emerald-200">
                  {lang === 'fr' ? `Inscrits au bureau : ${selectedBureauInscrits}` : `المسجلون في المكتب : ${selectedBureauInscrits}`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Nombre de Votants' : 'عدد المقترعين'}</label>
                  <input
                    type="number"
                    value={votants}
                    onChange={(e) => setVotants(e.target.value)}
                    required
                    max={selectedBureauInscrits}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Bulletins Nuls' : 'الأوراق الباطلة'}</label>
                  <input
                    type="number"
                    value={bulletinsNuls}
                    onChange={(e) => setBulletinsNuls(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'fr' ? 'Suffrages Exprimés (Rejetés)' : 'الأوراق الملغاة'}</label>
                  <input
                    type="number"
                    value={bulletinsRejetes}
                    onChange={(e) => setBulletinsRejetes(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">
                  {lang === 'fr' ? 'Suffrages par Parti / Candidat (Candidatures Actives)' : 'الأصوات حسب الأحزاب المترشحة'}
                </h3>

                {partis.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                          <th className="p-3">{lang === 'fr' ? 'Parti / Candidat' : 'الحزب / المترشح'}</th>
                          <th className="p-3 w-48 text-center">{lang === 'fr' ? 'Voix Obtenues' : 'الأصوات المحصل عليها'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {partis.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-3 font-semibold text-gray-800">
                              {lang === 'fr' ? p.nom_fr : p.nom_ar}
                              <span className="block text-[10px] text-gray-400 font-normal">{p.sigle}</span>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={voixPartis[p.id] || ''}
                                onChange={(e) => setVoixPartis({ ...voixPartis, [p.id]: e.target.value })}
                                required
                                className="w-32 p-2 border border-gray-300 rounded-xl text-center text-sm font-bold text-emerald-700 bg-white shadow-sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-center text-xs font-medium">
                    {lang === 'fr' 
                      ? '⚠️ Aucun parti n’est enregistré en tant que candidat pour cette élection dans cette circonscription.' 
                      : '⚠️ لا توجد أحزاب مسجلة كمرشحين لهذا الاستحقاق في هذه الدائرة.'}
                  </div>
                )}
              </div>
            </div>

            {/* Étape 4 : PV Scanné */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider pb-2 border-b">
                {lang === 'fr' ? '4. Pièce Justificative (Procès-Verbal Scanné)' : '4. مرفق محضر الفرز (صورة PV)'}
              </h2>

              <div className="space-y-3">
                <input
                  key={`${selectedBureau}-${selectedElectionType}`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />

                {pvImage && (
                  <div className="mt-4 p-2 border rounded-xl bg-gray-50 flex flex-col items-center">
                    <p className="text-xs font-bold text-emerald-800 mb-2">{lang === 'fr' ? 'Aperçu du PV joint :' : 'معاينة المحضر المرفق :'}</p>
                    <img src={pvImage} alt="Aperçu PV" className="h-48 object-contain rounded-lg border shadow-sm" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || partis.length === 0}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold transition shadow-lg text-base disabled:opacity-50"
            >
              {saving ? (lang === 'fr' ? 'Enregistrement en cours...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer les Résultats Officiels' : 'حفظ النتائج الرسمية')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}