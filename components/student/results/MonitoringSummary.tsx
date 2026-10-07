import { readAttemptMonitoringSummary } from '@/lib/attempts/monitoring';
import { MONITORING_EVENT_LABELS } from '@/lib/attempts/monitoring-contract';

/** Independent, read-only server component; unavailable monitoring stays unobtrusive. */
export default async function MonitoringSummary({ attemptId, studentId }: {
  attemptId: string;
  studentId: string;
}) {
  const summary = await readAttemptMonitoringSummary(attemptId, studentId);
  if (!summary) return null;

  const format = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <section aria-label="Monitoring summary" className="mt-5 rounded-xl border border-border px-4 py-3 text-sm">
      <p className="font-medium text-textPrimary">Monitoring events: {summary.count}</p>
      <p className="mt-1 text-xs text-textSecondary">Browser signals do not change your score. One action may produce several events.</p>
      {summary.events.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-textSecondary">View monitoring history</summary>
          <p className="mt-2 text-xs text-textSecondary">Latest {summary.events.length} events. Times shown in IST.</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr><th scope="col" className="py-2 pr-4">Time</th><th scope="col" className="py-2">Event</th></tr></thead>
              <tbody>
                {summary.events.map(event => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="whitespace-nowrap py-2 pr-4"><time dateTime={event.recordedAt.toISOString()}>{format.format(event.recordedAt)}</time></td>
                    <td className="py-2">{MONITORING_EVENT_LABELS[event.eventType]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </section>
  );
}
