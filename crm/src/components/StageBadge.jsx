import { STAGES } from '../lib/helpers.js';

export function StageBadge({ stage }) {
  const info = STAGES[stage] || { label: stage, color: '#64748b' };

  return (
    <span
      class="stage-badge"
      style={`color: ${info.color}; background: ${info.color}1a`}
    >
      {info.label}
    </span>
  );
}
