import type { ReactNode } from 'react'
// ─── Toggle switch ────────────────────────────────────────────────────────────
export function Toggle({ value, onChange, disabled }: { value?: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
    return (
        <button
            className={`sp-toggle ${value ? 'on' : 'off'}${disabled ? ' disabled' : ''}`}
            onClick={() => !disabled && onChange(!value)}
            type="button"
        >
            <div className="sp-toggle-knob"></div>
        </button>
    )
}

// ─── Setting row ──────────────────────────────────────────────────────────────
export function Row({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children?: ReactNode; className?: string }) {
    return (
        <div className={`sp-row${className ? ' ' + className : ''}`}>
            <div className="sp-row-label">
                <span className="sp-row-name">{label}</span>
                {hint && <span className="sp-row-hint">{hint}</span>}
            </div>
            <div className="sp-row-control">{children}</div>
        </div>
    )
}

// ─── Path row (with text input + browse button) ───────────────────────────────
export function PathRow({ label, hint, value, onChange, onBrowse, placeholder }: { label: ReactNode; hint?: ReactNode; value?: string; onChange: (value: string) => void; onBrowse: () => void | Promise<void>; placeholder?: string }) {
    return (
        <div className="sp-row sp-row--path">
            <div className="sp-row-label">
                <span className="sp-row-name">{label}</span>
                {hint && <span className="sp-row-hint">{hint}</span>}
            </div>
            <div className="sp-row-control sp-path-control">
                <input
                    className="sp-path-input"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    spellCheck={false}
                />
                <button className="sp-browse-btn" onClick={onBrowse} type="button" title="Выбрать">
                    <i className="bi bi-folder2-open"></i>
                </button>
            </div>
        </div>
    )
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <div className="sp-section-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
    )
}

