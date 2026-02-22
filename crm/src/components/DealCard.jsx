import { formatCurrency } from '../lib/helpers.js';

export function DealCard({ deal, onDragStart, onClick }) {
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
    </div>
  );
}
