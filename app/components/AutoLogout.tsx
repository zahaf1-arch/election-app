'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Temps d'inactivité en millisecondes (ex: 15 minutes = 15 * 60 * 1000)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export default function AutoLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    // Vérifier si un utilisateur est connecté
    const user = localStorage.getItem('user');
    if (user) {
      localStorage.removeItem('user');
      alert('⚠️ Session expirée suite à une longue période d\'inactivité.');
      router.push('/login');
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Activer le compte à rebours uniquement si un utilisateur est connecté
    if (typeof window !== 'undefined' && localStorage.getItem('user')) {
      timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    // Événements écoutés pour réinitialiser le chronomètre d'inactivité
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Attacher les écouteurs d'événements
    events.forEach((event) => window.addEventListener(event, handleActivity));

    // Démarrer le premier timer
    resetTimer();

    // Nettoyage lors du démontage du composant
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [pathname]);

  return null; // Composant invisible qui fonctionne en arrière-plan
}