import { formatCurrency, STAGES } from '../lib/helpers.js';

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export function DealCard({ deal, onDragStart, onClick, onStageChange }) {
  return (
    <div
      class="deal-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', deal.id);
        e.currentTarget.classList.add('dragging');
        if (onDragStart) onDragStart(deal);
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('dragging')}
      onClick={() => onClick && onClick(deal)}
    >
      <div class="deal-card-title">{deal.title}</div>
      <div class="deal-card-meta">
        <span>{deal.contact_name || '–'}</span>
        <span>{deal.value ? formatCurrency(deal.value) : ''}</span>
      </div>
      {onStageChange && (
        <select
          class="deal-card-stage-select"
          value={deal.stage}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onStageChange(deal, e.target.value);
          }}
        >
          {PIPELINE_STAGES.map(s => (
            <option key={s} value={s}>{STAGES[s].label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
