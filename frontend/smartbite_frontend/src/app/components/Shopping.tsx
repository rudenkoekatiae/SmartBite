import React from 'react';
import { useMeal } from '../meal-context';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export const Shopping = () => {
  const { plan } = useMeal();

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} className="text-green-600" />
        </div>
        <h2 className="text-xl font-black text-green-900 mb-2">Shopping List</h2>
        <p className="text-green-700/60">Generate a plan first to see what you need to buy!</p>
      </div>
    );
  }

  const totalCal   = plan.weekly_totals.cal;
  const totalPro   = plan.weekly_totals.pro;
  const budgetUsed = plan.weekly_totals.cost_est;

  return (
    <div className="px-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-green-900">Grocery List</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <p className="text-sm font-bold text-green-600">
            Total est: ₴{Math.round(plan.shopping_total_uah_est)}
          </p>
          <div className="w-1 h-1 bg-green-300 rounded-full" />
          <p className="text-sm font-bold text-green-600">
            {plan.shopping_list.length} items
          </p>
          <div className="w-1 h-1 bg-green-300 rounded-full" />
          <p className="text-sm font-bold text-green-600">
            Budget: ₴{Math.round(budgetUsed)} / ₴{plan.week_budget_uah}
          </p>
        </div>
      </header>

      {/* Weekly summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Kcal / week', val: Math.round(totalCal) },
          { label: 'Protein / week', val: Math.round(totalPro) + 'g' },
          { label: 'Budget left', val: '₴' + Math.round(plan.week_budget_uah - budgetUsed) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center border border-green-50 shadow-sm">
            <p className="text-[9px] font-black text-green-600/50 uppercase tracking-widest">{s.label}</p>
            <p className="text-sm font-black text-green-900">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 pb-8">
        {plan.shopping_list.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 shadow-sm border border-green-50 flex items-center justify-between group hover:border-green-300 transition-all"
          >
            <div className="flex-1">
              {/* Українська назва з нового бекенду */}
              <p className="text-sm font-bold text-green-900">{item.name_ua}</p>
              <p className="text-xs text-green-600/60 mt-0.5">
                {item.grams_needed}g · used {item.uses_in_week}× this week
              </p>
            </div>
            <div className="text-right flex items-center gap-3">
              <span className="text-sm font-black text-green-900">
                ₴{item.cost_uah_est.toFixed(2)}
              </span>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-400 group-hover:bg-green-600 group-hover:text-white transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};