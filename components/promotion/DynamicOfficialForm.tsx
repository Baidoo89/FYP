'use client';

import { Plus, Trash2 } from 'lucide-react';

export type OfficialField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  minimumRows?: number;
  options?: string[];
  columns?: Array<{ id: string; label: string; type?: string; required?: boolean }>;
  rows?: Array<{ id: string; label: string; weight: number }>;
};

export type OfficialFormSchema = {
  title: string;
  instructions?: string;
  declarationText?: string;
  confidential?: boolean;
  sections: Array<{ id: string; title: string; fields: OfficialField[] }>;
};

type Responses = Record<string, unknown>;

type Props = {
  schema: OfficialFormSchema;
  responses: Responses;
  onChange: (responses: Responses) => void;
  readOnly?: boolean;
  errors?: string[];
};

function inputClass(disabled: boolean) {
  return `brand-input mt-1 w-full ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-600' : ''}`;
}

function FieldLabel({ field }: { field: OfficialField }) {
  return (
    <span className="text-sm font-semibold text-gray-800">
      {field.label}
      {field.required ? <span className="ml-1 text-rose-700" aria-label="required">*</span> : null}
    </span>
  );
}

function RepeaterField({
  field,
  value,
  disabled,
  update,
}: {
  field: OfficialField;
  value: unknown;
  disabled: boolean;
  update: (value: unknown) => void;
}) {
  const rows = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];

  function addRow() {
    const row = Object.fromEntries((field.columns || []).map((column) => [column.id, column.type === 'checkbox' ? false : '']));
    update([...rows, row]);
  }

  function updateRow(index: number, columnId: string, nextValue: unknown) {
    update(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [columnId]: nextValue } : row));
  }

  function removeRow(index: number) {
    update(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FieldLabel field={field} />
        {!disabled ? (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-brand-primary/25 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primarySoft"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add entry
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(field.columns || []).map((column) => {
                const columnValue = row[column.id];
                if (column.type === 'checkbox') {
                  return (
                    <label key={column.id} className="flex min-h-11 items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(columnValue)}
                        onChange={(event) => updateRow(index, column.id, event.target.checked)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                      {column.label}
                    </label>
                  );
                }
                return (
                  <label key={column.id} className="block min-w-0">
                    <span className="text-xs font-semibold text-gray-700">
                      {column.label}{column.required ? <span className="ml-1 text-rose-700">*</span> : null}
                    </span>
                    {column.type === 'checkbox' ? <span className="mt-2 flex min-h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={columnValue === true} onChange={(event) => updateRow(index, column.id, event.target.checked)} disabled={disabled} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />{columnValue === true ? 'Yes' : 'No'}</span> : <input
                        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                        value={typeof columnValue === 'string' || typeof columnValue === 'number' ? columnValue : ''}
                        onChange={(event) => updateRow(index, column.id, column.type === 'number' ? event.target.valueAsNumber : event.target.value)}
                        disabled={disabled}
                        className={inputClass(disabled)}
                      />}
                  </label>
                );
              })}
            </div>
            {!disabled ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  title="Remove entry"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  aria-label={`Remove ${field.label} entry ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500">
            No entries recorded.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScoreMatrixField({
  field,
  value,
  disabled,
  update,
}: {
  field: OfficialField;
  value: unknown;
  disabled: boolean;
  update: (value: unknown) => void;
}) {
  const scores = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const total = (field.rows || []).reduce((sum, row) => {
    const score = Number(scores[row.id]);
    return sum + (Number.isFinite(score) ? score : 0);
  }, 0);
  const totalWeight = (field.rows || []).reduce((sum, row) => sum + row.weight, 0);

  return (
    <div>
      <FieldLabel field={field} />
      <div className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-200">
        {(field.rows || []).map((row) => (
          <label key={row.id} className="grid min-w-0 gap-2 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_5rem_7rem] sm:items-center">
            <span className="min-w-0 text-sm leading-5 text-gray-700">{row.label}</span>
            <span className="text-xs font-semibold text-gray-500 sm:text-center">Weight {row.weight}</span>
            <input
              type="number"
              min={0}
              max={row.weight}
              step="0.5"
              value={typeof scores[row.id] === 'number' || typeof scores[row.id] === 'string' ? String(scores[row.id]) : ''}
              onChange={(event) => update({ ...scores, [row.id]: event.target.value === '' ? '' : event.target.valueAsNumber })}
              disabled={disabled}
              className={inputClass(disabled)}
              aria-label={`Score for ${row.label}`}
            />
          </label>
        ))}
        <div className="flex items-center justify-between bg-gray-50 px-3 py-3 text-sm font-bold text-gray-800">
          <span>Total score</span>
          <span>{total} / {totalWeight}</span>
        </div>
      </div>
    </div>
  );
}

function ChecklistField({
  field,
  value,
  disabled,
  update,
}: {
  field: OfficialField;
  value: unknown;
  disabled: boolean;
  update: (value: unknown) => void;
}) {
  const checked = Array.isArray(value) ? value as string[] : [];
  return (
    <fieldset>
      <legend><FieldLabel field={field} /></legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(field.options || []).map((option) => (
          <label key={option} className="flex min-h-11 items-start gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={checked.includes(option)}
              onChange={(event) => update(event.target.checked ? [...checked, option] : checked.filter((item) => item !== option))}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FieldRenderer({
  field,
  value,
  readOnly,
  update,
}: {
  field: OfficialField;
  value: unknown;
  readOnly: boolean;
  update: (value: unknown) => void;
}) {
  const disabled = readOnly || Boolean(field.readOnly);
  if (field.type === 'repeater') return <RepeaterField field={field} value={value} disabled={disabled} update={update} />;
  if (field.type === 'score_matrix') return <ScoreMatrixField field={field} value={value} disabled={disabled} update={update} />;
  if (field.type === 'checklist') return <ChecklistField field={field} value={value} disabled={disabled} update={update} />;

  if (field.type === 'textarea') {
    return (
      <label className="block">
        <FieldLabel field={field} />
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => update(event.target.value)}
          disabled={disabled}
          className={`${inputClass(disabled)} min-h-28 resize-y`}
        />
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="block">
        <FieldLabel field={field} />
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => update(event.target.value)}
          disabled={disabled}
          className={inputClass(disabled)}
        >
          <option value="">Select</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      <FieldLabel field={field} />
      <input
        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(event) => update(field.type === 'number' ? event.target.valueAsNumber : event.target.value)}
        disabled={disabled}
        className={inputClass(disabled)}
      />
    </label>
  );
}

export default function DynamicOfficialForm({ schema, responses, onChange, readOnly = false, errors = [] }: Props) {
  return (
    <div className="min-w-0">
      {errors.length > 0 ? (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3" role="alert">
          <p className="text-sm font-bold text-rose-900">Required information is incomplete</p>
          <ul className="mt-2 space-y-1 text-sm text-rose-800">
            {errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}
          </ul>
          {errors.length > 8 ? <p className="mt-2 text-xs font-semibold text-rose-700">{errors.length - 8} more item(s) require attention.</p> : null}
        </div>
      ) : null}

      <div className="divide-y divide-gray-200 border-y border-gray-200">
        {schema.sections.map((section) => (
          <section key={section.id} className="py-6 first:pt-0 last:pb-0">
            <h3 className="text-base font-bold text-gray-950">{section.title}</h3>
            <div className="mt-4 grid min-w-0 gap-5 lg:grid-cols-2">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={field.type === 'repeater' || field.type === 'score_matrix' || field.type === 'checklist' ? 'min-w-0 lg:col-span-2' : 'min-w-0'}
                >
                  <FieldRenderer
                    field={field}
                    value={responses[field.id]}
                    readOnly={readOnly}
                    update={(value) => onChange({ ...responses, [field.id]: value })}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
