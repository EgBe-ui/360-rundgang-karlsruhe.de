import { useState } from 'preact/hooks';
import { ACTIVITY_TYPES } from '../lib/helpers.js';
import { timeAgo } from '../lib/helpers.js';

export function ActivityItem({ activity }) {
  const typeInfo = ACTIVITY_TYPES[activity.type] || { label: activity.type, icon: '📌' };
  const changes = activity.metadata?.changes;
  const hasDetails = activity.description || (changes && changes.length > 0);
  const [open, setOpen] = useState(false);

  return (
    <div class="timeline-item">
      <div class="timeline-content">
        <div
          class="timeline-header"
          style={hasDetails ? 'cursor:pointer;user-select:none' : ''}
          onClick={() => hasDetails && setOpen(!open)}
        >
          <span class="timeline-icon">{typeInfo.icon}</span>
          <span class="timeline-type">{typeInfo.label}</span>
          <span class="timeline-time">{timeAgo(activity.created_at)}</span>
          {hasDetails && (
            <span style="margin-left:auto;font-size:0.75rem;color:var(--text-dim)">{open ? '▲' : '▼'}</span>
          )}
        </div>
        {open && (
          <div style="margin-top:0.5rem">
            {changes && changes.length > 0 && (
              <div style="font-size:0.8rem;display:flex;flex-direction:column;gap:0.25rem">
                {changes.map((ch, i) => (
                  <div key={i} style="display:flex;gap:0.5rem;align-items:baseline;padding:0.2rem 0;border-bottom:1px solid var(--border)">
                    <span style="font-weight:600;min-width:120px;color:var(--text-dim)">{ch.field}</span>
                    <span style="color:#ef4444;text-decoration:line-through;word-break:break-word">{ch.from || '–'}</span>
                    <span style="color:var(--text-dim)">→</span>
                    <span style="color:#10b981;word-break:break-word">{ch.to || '–'}</span>
                  </div>
                ))}
              </div>
            )}
            {activity.description && (
              <div class="timeline-text" style={changes ? 'margin-top:0.5rem' : ''}>{activity.description}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
