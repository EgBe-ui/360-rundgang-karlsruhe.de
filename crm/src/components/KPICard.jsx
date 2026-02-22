export function KPICard({ label, value, color }) {
  return (
    <div class="card">
      <div class="kpi-value" style={color ? `color: ${color}` : ''}>
        {value}
      </div>
      <div class="kpi-label">{label}</div>
    </div>
  );
}
