import { useState } from 'react';
import { OralAdmission } from '@/types';
import { api } from '@/services/api';
import { Save, Users } from 'lucide-react';

interface OralAdmissionFormProps {
  candidatId: string;
  existingOral?: OralAdmission;
  onSaved?: (oral: OralAdmission) => void;
}

function NoteInput({
  label,
  value,
  onChange,
  max = 3,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  max?: number;
}) {
  const steps = [];
  for (let i = 0; i <= max * 2; i++) {
    steps.push(i / 2);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-shine-text-secondary flex-1">{label}</span>
      <div className="flex items-center gap-1">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
              value === step
                ? 'bg-primary-500 text-white shadow-sm scale-105'
                : 'bg-slate-100 text-shine-text-secondary hover:bg-slate-200'
            }`}
          >
            {step}
          </button>
        ))}
      </div>
      <span className="text-sm font-bold text-shine-text-primary w-12 text-right">{value}/{max}</span>
    </div>
  );
}

export function OralAdmissionForm({ candidatId, existingOral, onSaved }: OralAdmissionFormProps) {
  const [form, setForm] = useState({
    noteParticipationCollectif: existingOral?.noteParticipationCollectif ?? 0,
    noteExpressionEmotions: existingOral?.noteExpressionEmotions ?? 0,
    noteAnalyseTS: existingOral?.noteAnalyseTS ?? 0,
    notePresentationIndividuelle: existingOral?.notePresentationIndividuelle ?? 0,
    jury1Nom: existingOral?.jury1Nom ?? '',
    jury2Nom: existingOral?.jury2Nom ?? '',
    commentaires: existingOral?.commentaires ?? '',
    pointsVigilance: existingOral?.pointsVigilance ?? '',
  });
  const [saving, setSaving] = useState(false);

  const total = form.noteParticipationCollectif + form.noteExpressionEmotions +
    form.noteAnalyseTS + form.notePresentationIndividuelle;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.saveOralAdmission(candidatId, {
        ...form,
        dateOral: new Date().toISOString(),
      });
      onSaved?.(result);
    } catch (error) {
      console.error('Erreur sauvegarde oral:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-shine-text-primary">Oral d'admission</h3>
        </div>
        <div className="text-center">
          <span className={`text-2xl font-bold ${
            total >= 9 ? 'text-emerald-600' : total >= 6 ? 'text-amber-600' : 'text-red-500'
          }`}>{total}</span>
          <span className="text-sm text-shine-text-tertiary">/12</span>
        </div>
      </div>

      {/* Jury */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-shine-text-secondary mb-1 block">Jury 1</label>
          <input
            type="text"
            value={form.jury1Nom}
            onChange={(e) => setForm({ ...form, jury1Nom: e.target.value })}
            className="input text-sm"
            placeholder="Nom du jury 1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-shine-text-secondary mb-1 block">Jury 2</label>
          <input
            type="text"
            value={form.jury2Nom}
            onChange={(e) => setForm({ ...form, jury2Nom: e.target.value })}
            className="input text-sm"
            placeholder="Nom du jury 2"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3 border border-shine-border rounded-xl p-4">
        <NoteInput
          label="Participation dans le collectif"
          value={form.noteParticipationCollectif}
          onChange={(val) => setForm({ ...form, noteParticipationCollectif: val })}
        />
        <NoteInput
          label="Capacité d'expression / gestion des émotions"
          value={form.noteExpressionEmotions}
          onChange={(val) => setForm({ ...form, noteExpressionEmotions: val })}
        />
        <NoteInput
          label="Capacité d'analyse et mise en lien avec le TS"
          value={form.noteAnalyseTS}
          onChange={(val) => setForm({ ...form, noteAnalyseTS: val })}
        />
        <NoteInput
          label="Présentation individuelle (parcours, motivation)"
          value={form.notePresentationIndividuelle}
          onChange={(val) => setForm({ ...form, notePresentationIndividuelle: val })}
        />
      </div>

      {/* Commentaires */}
      <div>
        <label className="text-xs font-medium text-shine-text-secondary mb-1 block">Commentaires</label>
        <textarea
          value={form.commentaires}
          onChange={(e) => setForm({ ...form, commentaires: e.target.value })}
          className="input text-sm min-h-[80px] resize-y"
          placeholder="Observations du jury..."
        />
      </div>

      <div>
        <label className="text-xs font-medium text-shine-text-secondary mb-1 block">Points de vigilance</label>
        <textarea
          value={form.pointsVigilance}
          onChange={(e) => setForm({ ...form, pointsVigilance: e.target.value })}
          className="input text-sm min-h-[60px] resize-y"
          placeholder="Points de vigilance..."
        />
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Enregistrement...' : 'Enregistrer les notes d\'oral'}
      </button>
    </div>
  );
}
