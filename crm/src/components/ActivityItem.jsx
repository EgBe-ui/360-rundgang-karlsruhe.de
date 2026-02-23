import { ACTIVITY_TYPES } from '../lib/helpers.js';
import { timeAgo } from '../lib/helpers.js';

export function ActivityItem({ activity }) {
  const typeInfo = ACTIVITY_TYPES[activity.type] || { label: activity.type, icon: '📌' };

  return (
    <div class="timeline-item">
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-icon">{typeInfo.icon}</span>
          <span class="timeline-type">{typeInfo.label}</span>
          <span class="timeline-time">{timeAgo(activity.created_at)}</span>
        </div>
        <div class="timeline-text">{activity.description}</div>
      </div>
    </div>
  );
}
