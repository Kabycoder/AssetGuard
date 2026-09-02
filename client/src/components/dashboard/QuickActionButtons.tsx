import React, { useState } from 'react';
import {
  PlusCircle,
  PlayCircle,
  CheckCircle2,
  Archive,
  Check,
} from 'lucide-react';
import { QuickAction } from '../../types';

interface QuickActionButtonsProps {
  actions: QuickAction[];
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PlusCircle,
  PlayCircle,
  CheckCircle2,
  Archive,
};

const variantStyles: Record<
  QuickAction['variant'],
  { btn: string; icon: string }
> = {
  primary: {
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20',
    icon: 'text-white',
  },
  secondary: {
    btn: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    icon: 'text-blue-600',
  },
  emerald: {
    btn: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    icon: 'text-emerald-600',
  },
  amber: {
    btn: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    icon: 'text-amber-600',
  },
};

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  actions,
}) => {
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const handleActionClick = (action: QuickAction) => {
    setActiveFeedback(action.id);
    setTimeout(() => {
      setActiveFeedback(null);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Quick Actions</h2>
        <span className="text-xs text-slate-400 font-medium">Workflows</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = actionIcons[action.icon] || PlusCircle;
          const styles = variantStyles[action.variant];
          const isTriggered = activeFeedback === action.id;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(action)}
              className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                styles.btn
              } active:scale-[0.98]`}
            >
              {isTriggered ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                  <span className="text-xs text-slate-600">Ready</span>
                </>
              ) : (
                <>
                  <Icon className={`w-4 h-4 ${styles.icon}`} />
                  <span>{action.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
