'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem('paisaos_visited')) {
      router.replace('/dashboard');
    }
  }, [router]);
  return null;
}
