import { useState, useCallback } from 'preact/hooks';
import { useDeals, updateDealStage } from '../hooks/useDeals.js';
import { DealCard } from '../components/DealCard.jsx';
import { STAGES } from '../lib/helpers.js';
import { useToast } from '../components/Toast.jsx';
import { route } from 'preact-router';

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export function Pipeline() {
  const { deals, loading, refetch } = useDeals();
  const toast = useToast();
  const [dragOverStage, setDragOverStage] = useState(null);

  const dealsByStage = {};
  for (const stage of PIPELINE_STAGES) {
    dealsByStage[stage] = deals.filter(d => d.stage === stage);
  }

  const handleDrop = useCallback(async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    const { error } = await updateDealStage(dealId, targetStage, deal.stage, deal.contact_id);
    if (error) {
      toast.error('Fehler beim Aendern der Stage');
    } else {
      toast.success(`Deal nach "${STAGES[targetStage].label}" verschoben`);
      refetch();
    }
  }, [deals, refetch, toast]);

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Pipeline</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Pipeline</h1>
        <button class="btn btn-primary btn-sm" onClick={() => route('/crm/deals/new')}>
          + Neuer Deal
        </button>
      </div>

      <div class="page-body">
        <div class="pipeline">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} class="pipeline-column">
              <div class="pipeline-column-header" style={`border-top: 3px solid ${STAGES[stage].color}`}>
                <span>{STAGES[stage].label}</span>
                <span class="pipeline-column-count">{dealsByStage[stage].length}</span>
              </div>
              <div
                class={`pipeline-column-body ${dragOverStage === stage ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {dealsByStage[stage].length === 0 ? (
                  <div style="text-align:center;padding:1rem;color:var(--text-dim);font-size:0.8rem">
                    Keine Deals
                  </div>
                ) : (
                  dealsByStage[stage].map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => route(`/crm/deals/${deal.id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
