import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useRevenueStats({ year } = {}) {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!year) return;
    setLoading(true);

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const [{ data: paidInvoices }, { data: allInvoices }, { data: expenses }] = await Promise.all([
      supabase
        .from('invoices')
        .select('total_amount, net_amount, vat_amount, paid_date')
        .eq('type', 'invoice')
        .eq('status', 'paid')
        .gte('paid_date', yearStart)
        .lte('paid_date', yearEnd),
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('type', 'invoice')
        .in('status', ['sent', 'overdue']),
      supabase
        .from('expenses')
        .select('date, category, amount, net_amount, vat_amount')
        .is('deleted_at', null)
        .gte('date', yearStart)
        .lte('date', yearEnd),
    ]);

    const inv = paidInvoices || [];
    const exp = expenses || [];

    // Monthly data (12 months)
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mStr = String(m).padStart(2, '0');
      const prefix = `${year}-${mStr}`;

      const mInv = inv.filter(r => r.paid_date && r.paid_date.startsWith(prefix));
      const mExp = exp.filter(r => r.date && r.date.startsWith(prefix));

      const incomeBrutto = mInv.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0);
      const incomeNetto = mInv.reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);
      const vatCollected = mInv.reduce((s, r) => s + (parseFloat(r.vat_amount) || 0), 0);
      const expensesBrutto = mExp.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const expensesNetto = mExp.reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);
      const vatPaid = mExp.reduce((s, r) => s + (parseFloat(r.vat_amount) || 0), 0);

      return {
        month: m,
        incomeBrutto,
        incomeNetto,
        vatCollected,
        expensesBrutto,
        expensesNetto,
        vatPaid,
        profit: incomeNetto - expensesNetto,
      };
    });
    setMonthlyData(monthly);

    // Quarterly data
    const quarters = [0, 1, 2, 3].map(q => {
      const qMonths = monthly.slice(q * 3, q * 3 + 3);
      return {
        quarter: q + 1,
        incomeBrutto: qMonths.reduce((s, m) => s + m.incomeBrutto, 0),
        incomeNetto: qMonths.reduce((s, m) => s + m.incomeNetto, 0),
        vatCollected: qMonths.reduce((s, m) => s + m.vatCollected, 0),
        expensesBrutto: qMonths.reduce((s, m) => s + m.expensesBrutto, 0),
        expensesNetto: qMonths.reduce((s, m) => s + m.expensesNetto, 0),
        vatPaid: qMonths.reduce((s, m) => s + m.vatPaid, 0),
        profit: qMonths.reduce((s, m) => s + m.profit, 0),
      };
    });
    setQuarterlyData(quarters);

    // Expenses by category
    const catMap = {};
    exp.forEach(e => {
      const cat = e.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + (parseFloat(e.amount) || 0);
    });
    setExpensesByCategory(catMap);

    // Summary stats
    const yearRevenue = inv.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0);
    const yearRevenueNetto = inv.reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);
    const yearExpenses = exp.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const yearExpensesNetto = exp.reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);
    const vatCollectedTotal = inv.reduce((s, r) => s + (parseFloat(r.vat_amount) || 0), 0);
    const vatPaidTotal = exp.reduce((s, r) => s + (parseFloat(r.vat_amount) || 0), 0);
    const openAmount = (allInvoices || []).reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0);

    setStats({
      yearRevenue,
      yearRevenueNetto,
      yearExpenses,
      yearExpensesNetto,
      yearProfit: yearRevenueNetto - yearExpensesNetto,
      openInvoices: openAmount,
      vatCollected: vatCollectedTotal,
      vatPaid: vatPaidTotal,
      vatPayable: vatCollectedTotal - vatPaidTotal,
    });

    setLoading(false);
  }, [year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, monthlyData, quarterlyData, expensesByCategory, loading, refetch: fetch };
}
