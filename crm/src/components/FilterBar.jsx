export function FilterBar({ filters, active, onSelect }) {
  return (
    <div class="filter-pills">
      <button
        class={`filter-pill ${!active ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        Alle
      </button>
      {filters.map(f => (
        <button
          key={f.value}
          class={`filter-pill ${active === f.value ? 'active' : ''}`}
          onClick={() => onSelect(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
