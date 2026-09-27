import { useId, useState, type ComponentType, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Form rows for the console's grouped cards.
 *
 * A field is a row like any other: label above, value below, a hairline
 * between it and the next. The label sits above rather than beside because
 * half of these are email addresses and sentences, and a two-column form on a
 * phone is a form with a 90px input.
 *
 * Inputs are 17px, which is also the size below which iOS zooms the page on
 * focus — a form that jumps sideways as you tap into it is one people abandon.
 */

/* Focus is shown by the row — a bar in the accent down its leading edge and a
   tinted label — rather than by the site-wide ring, which drawn around a
   borderless input inside a card reads as a second, misplaced box. */
const ROW =
  "group block px-4 py-3 transition-shadow duration-150 focus-within:shadow-[inset_3px_0_0_var(--ui-tint)]";
const LABEL = "block text-[0.8125rem] font-medium leading-tight text-ui-label-2 group-focus-within:text-ui-tint";
const CONTROL =
  "mt-1.5 block w-full bg-transparent text-[1.0625rem] leading-snug text-ui-label placeholder:text-ui-label-3 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60";

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  if (error) {
    return (
      <span id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-rose-500">
        <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
        {error}
      </span>
    );
  }

  return hint ? (
    <span id={id} className="mt-1.5 block text-[0.8125rem] leading-snug text-ui-label-3">
      {hint}
    </span>
  ) : null;
}

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  /** Appended to the label, e.g. "(optional)". */
  aside?: ReactNode;
}

export function TextField({ label, error, hint, aside, className, ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();

  return (
    <label className={cn(ROW, className)}>
      <span className={LABEL}>
        {label} {aside ? <span className="font-normal text-ui-label-3">{aside}</span> : null}
      </span>
      <input
        {...input}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={CONTROL}
      />
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </label>
  );
}

export function TextAreaField({ label, error, hint, aside, className, ...input }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();

  return (
    <label className={cn(ROW, className)}>
      <span className={LABEL}>
        {label} {aside ? <span className="font-normal text-ui-label-3">{aside}</span> : null}
      </span>
      <textarea
        {...input}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={cn(CONTROL, "min-h-[7.5rem] resize-y leading-relaxed")}
      />
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </label>
  );
}

export function SelectField({
  label,
  error,
  hint,
  aside,
  className,
  children,
  ...select
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();

  return (
    <label className={cn(ROW, className)}>
      <span className={LABEL}>
        {label} {aside ? <span className="font-normal text-ui-label-3">{aside}</span> : null}
      </span>
      <span className="relative block">
        <select
          {...select}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(CONTROL, "cursor-pointer appearance-none pr-7")}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-label-3" />
      </span>
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </label>
  );
}

/**
 * Length is what the API enforces and what actually resists cracking, so the
 * meter measures length first and says how many characters are still needed —
 * a number is more use than a red bar.
 */
function strength(password: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (password.length === 0) return { score: 0, label: "" };
  if (password.length < 12) return { score: 0, label: `${12 - password.length} more character${12 - password.length === 1 ? "" : "s"}` };

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const words = password.trim().split(/\s+/).length;

  if (password.length >= 16 || (classes >= 3 && password.length >= 14) || words >= 4) return { score: 3, label: "Strong" };
  if (classes >= 2 || words >= 3) return { score: 2, label: "Good" };
  return { score: 1, label: "Long enough" };
}

const METER = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"];

export function PasswordField({
  label,
  error,
  hint,
  meter = false,
  className,
  value,
  ...input
}: FieldProps & { meter?: boolean } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const text = typeof value === "string" ? value : "";
  const rating = strength(text);

  return (
    <div className={cn(ROW, className)}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <span className="flex items-center gap-2">
        <input
          {...input}
          id={id}
          value={value}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${id}-msg`}
          className={CONTROL}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ui-label-3 transition-colors hover:bg-ui-fill hover:text-ui-label"
        >
          {visible ? <EyeOff className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" /> : <Eye className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />}
        </button>
      </span>

      {meter && text.length > 0 && !error ? (
        <span id={`${id}-msg`} className="mt-2 flex items-center gap-2" aria-live="polite">
          <span aria-hidden="true" className="flex flex-1 gap-1">
            {[0, 1, 2].map((segment) => (
              <span
                key={segment}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-200",
                  rating.score > segment || (rating.score === 0 && segment === 0) ? METER[rating.score] : "bg-ui-fill",
                )}
              />
            ))}
          </span>
          <span className="min-w-[7.5rem] text-right text-[0.8125rem] text-ui-label-2">{rating.label}</span>
        </span>
      ) : (
        <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  busy,
  busyLabel,
  icon: Icon,
  trailingIcon: Trailing,
  className,
  variant = "primary",
  type = "submit",
  ...rest
}: {
  children: ReactNode;
  busy?: boolean;
  /** Said while busy, in place of the label — "Signing in…". */
  busyLabel?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** After the label, nudged forward on hover — an arrow for "go". */
  trailingIcon?: ComponentType<{ className?: string }>;
  variant?: "primary" | "secondary" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inactive = busy || rest.disabled;
  return (
    <button
      type={type}
      disabled={inactive}
      aria-busy={busy || undefined}
      {...rest}
      className={cn(
        "interactive group relative inline-flex min-h-[2.875rem] items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-[0.9375rem] font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        /* The primary button answers every state: it lifts and glows under
           the pointer while its gradient drifts, squeezes when pressed
           (.interactive), shimmers while working, and sits still when it
           cannot be used. */
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-[length:200%_100%] bg-left text-white shadow-lg shadow-indigo-600/25 transition-[background-position,transform,box-shadow] duration-500 dark:from-indigo-500 dark:via-violet-500 dark:to-cyan-400 dark:text-slate-950",
        variant === "primary" && !inactive && "hover:-translate-y-0.5 hover:bg-right hover:shadow-xl hover:shadow-indigo-600/35 focus-visible:bg-right",
        variant === "secondary" && "bg-ui-card text-ui-tint shadow-[0_0_0_1px_var(--ui-separator)] hover:bg-ui-card-hover",
        variant === "danger" && "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500",
        className,
      )}
    >
      {busy && variant === "primary" ? (
        <span aria-hidden="true" className="ck-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      ) : null}
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span className="relative">{busy && busyLabel ? busyLabel : children}</span>
      {Trailing && !busy ? (
        <Trailing aria-hidden="true" className="relative h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1 group-disabled:translate-x-0" />
      ) : null}
    </button>
  );
}

const ALERT = {
  error: { Icon: AlertCircle, className: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  success: { Icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  info: { Icon: Info, className: "bg-indigo-500/10 text-indigo-700 dark:text-cyan-300" },
} as const;

/** One message about the form as a whole — the thing the API said. */
export function FormAlert({ tone = "error", children, className }: { tone?: keyof typeof ALERT; children: ReactNode; className?: string }) {
  const { Icon, className: toneClass } = ALERT[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-ui px-4 py-3 text-[0.9375rem] leading-snug", toneClass, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
