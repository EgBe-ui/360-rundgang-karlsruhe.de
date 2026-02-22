export function LineItemsEditor({ items, onChange }) {
  function updateItem(index, field, value) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  }

  function addItem() {
    onChange([...items, { description: '', sub_description: '', quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function formatEur(val) {
    const n = parseFloat(val) || 0;
    return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
  }

  return (
    <div>
      <div class="table-wrapper">
        <table class="line-items-table">
          <thead>
            <tr>
              <th style="width:40%">Bezeichnung</th>
              <th style="width:15%">Menge</th>
              <th style="width:20%">Einzelpreis</th>
              <th style="width:15%;text-align:right">Gesamt</th>
              <th style="width:10%" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
              return (
                <tr key={i}>
                  <td>
                    <input
                      value={item.description}
                      onInput={e => updateItem(i, 'description', e.target.value)}
                      placeholder="Leistung / Produkt"
                      required
                    />
                    <input
                      value={item.sub_description || ''}
                      onInput={e => updateItem(i, 'sub_description', e.target.value)}
                      placeholder="Zusatzinfo (optional)"
                      style="margin-top:0.25rem;font-size:0.8rem;color:var(--text-muted)"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onInput={e => updateItem(i, 'quantity', e.target.value)}
                      style="text-align:right"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onInput={e => updateItem(i, 'unit_price', e.target.value)}
                      style="text-align:right"
                    />
                  </td>
                  <td style="text-align:right;white-space:nowrap;font-weight:500">
                    {formatEur(lineTotal)}
                  </td>
                  <td style="text-align:center">
                    <button
                      type="button"
                      class="btn btn-danger btn-sm"
                      onClick={() => removeItem(i)}
                      title="Entfernen"
                    >
                      x
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" onClick={addItem} style="margin-top:0.75rem">
        + Position
      </button>
    </div>
  );
}
