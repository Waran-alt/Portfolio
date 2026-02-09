'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { Vat, VatStatus } from '@/types/vat';

interface QuickUpdateFormProps {
  vat: Vat | null;
  onSave: (updates: { status?: VatStatus; notes?: string }) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: VatStatus; label: string }[] = [
  { value: 'empty', label: 'Empty' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'full', label: 'Full' },
  { value: 'cleaning', label: 'Cleaning' },
];

export default function QuickUpdateForm({
  vat,
  onSave,
  onClose,
}: QuickUpdateFormProps) {
  const [status, setStatus] = useState<VatStatus>(vat?.status ?? 'empty');
  const [notes, setNotes] = useState(vat?.notes ?? '');

  if (!vat) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ status, notes });
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-cellar-surface p-4 shadow-lg sm:inset-auto sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm sm:rounded-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {vat.label} – Quick Update
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-white/80">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VatStatus)}
            className="w-full rounded-lg border border-white/20 bg-cellar-accent px-3 py-2 text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-white/80">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className="w-full rounded-lg border border-white/20 bg-cellar-accent px-3 py-2 text-white placeholder-white/40"
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cellar-highlight px-4 py-3 font-medium text-white hover:opacity-90"
        >
          <Save size={18} />
          Save
        </button>
      </div>
    </form>
  );
}
