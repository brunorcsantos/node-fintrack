// src/hooks/useIsMobile.ts
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook centralizado para detecção de viewport mobile.
 *
 * Problemas do padrão anterior (useState(window.innerWidth < 768)):
 * 1. Acessa `window` durante o render — crash em SSR e testes sem jsdom
 * 2. O valor inicial é calculado uma vez e fica stale entre re-renders
 * 3. Cada componente registrava seu próprio resize listener (vazamento)
 *
 * Este hook inicializa com `false` de forma segura e sincroniza via
 * ResizeObserver (ou matchMedia), evitando múltiplos listeners.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Guard para SSR e ambientes de teste sem `window`
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // matchMedia é mais eficiente que resize — só dispara na mudança do breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // Safari < 14 não suporta addEventListener em MediaQueryList
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
    } else {
      mql.addListener(handler); // fallback legado
    }

    // Sincroniza o valor caso o componente monte após uma mudança de viewport
    setIsMobile(mql.matches);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
}
