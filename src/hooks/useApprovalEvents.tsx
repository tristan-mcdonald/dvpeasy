import { approvalEventsManager, type ApprovalEvent } from '../lib/approval-events';
import { logger } from '../lib/logger';
import { useCallback, useEffect, useState } from 'react';

export function useApprovalEvents (settlementId: string | undefined) {
  const [approvalEvents, setApprovalEvents] = useState<ApprovalEvent[]>([]);
  const [loadingApprovalEvents, setLoadingApprovalEvents] = useState(false);

  const fetchApprovalEvents = useCallback(async () => {
    if (!settlementId) return;

    setLoadingApprovalEvents(true);
    try {
      const events = await approvalEventsManager.settlementApprovalEvents(settlementId);
      setApprovalEvents(events);
    } catch (error) {
      logger.error('Failed to fetch approval events:', error);
    } finally {
      setLoadingApprovalEvents(false);
    }
  }, [settlementId]);

  useEffect(() => {
    fetchApprovalEvents();
  }, [fetchApprovalEvents]);

  return {
    approvalEvents,
    loadingApprovalEvents,
    refetchApprovalEvents: fetchApprovalEvents,
  };
}
