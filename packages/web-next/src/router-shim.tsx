/**
 * Router shim — maps the react-router API surface used by this app onto
 * Next.js App Router primitives, so page components port over unchanged.
 *
 * Supported: useNavigate, useLocation, useParams, <Link>, <Outlet>,
 * useSearchParams.
 * Anything beyond these should migrate to next/navigation directly.
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter, useParams as useNextParams } from 'next/navigation';
import type { ReactNode } from 'react';

export function useNavigate() {
  const router = useRouter();
  return (to: string | number) => {
    if (typeof to === 'number') {
      // App Router has no history delta API; best effort via history back.
      if (to < 0) window.history.back();
      return;
    }
    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() ?? '/';
  return {
    pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
}

/** Only [docId] dynamic segment exists in this app. */
export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>() {
  const params = useNextParams();
  return (params ?? {}) as T;
}

export { Link };

/**
 * react-router-compat useSearchParams.
 * Avoids next/navigation's useSearchParams to sidestep the Suspense boundary
 * requirement with output:'export'. Reads from window.location directly;
 * router.replace triggers re-render so the hook picks up the new params.
 */
export function useSearchParams(): [URLSearchParams, (params: Record<string, string>) => void] {
  const router = useRouter();
  const pathname = usePathname() ?? '/';

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const sp = new URLSearchParams(search);

  const setSearchParams = (newParams: Record<string, string>) => {
    const qs = new URLSearchParams(newParams).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return [sp, setSearchParams];
}

/** Rendered by the settings layout's nested route group. */
export function Outlet(): ReactNode {
  // Real nesting comes from the app/settings/[section] route files; the
  // SettingsLayout port receives children via its route group instead.
  return null;
}
