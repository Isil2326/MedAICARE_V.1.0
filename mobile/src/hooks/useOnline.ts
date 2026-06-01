/**
 * Détection minimale de l'état en ligne / hors-ligne.
 *
 * - Web : `navigator.onLine` + événements online/offline (preview principal).
 * - Natif : sans dépendance NetInfo (non installée), on suppose « en ligne » et
 *   on s'appuie sur la gestion d'erreurs réseau du client API. Limite documentée.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const nav = (globalThis as any).navigator;
    if (nav && typeof nav.onLine === 'boolean') setOnline(nav.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
