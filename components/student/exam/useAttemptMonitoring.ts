'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  browserMonitoringEnvironment,
  createAttemptMonitoring,
  type AttemptMonitoringController,
} from '@/lib/client/attempt-monitoring';

export function useAttemptMonitoring({ attemptId, active }: { attemptId: string; active: boolean }) {
  const controllerRef = useRef<AttemptMonitoringController | null>(null);

  useEffect(() => {
    if (!active) {
      try { controllerRef.current?.stop(); } catch { /* Expiry is independent. */ }
      return;
    }
    try {
      const controller = createAttemptMonitoring(attemptId, browserMonitoringEnvironment());
      controllerRef.current = controller;
      controller.start();
      return () => { try { controller.dispose(); } catch { /* Cleanup is independent. */ } };
    } catch {
      // Unsupported storage / browser APIs must never prevent taking the exam.
    }
  }, [attemptId, active]);

  return useCallback(() => {
    try { controllerRef.current?.stop(); } catch { /* Exam completion is independent. */ }
  }, []);
}
