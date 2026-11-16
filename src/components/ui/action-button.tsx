import { CircleNotch, type Icon } from "@phosphor-icons/react";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  // Solid brand fill, white text. Dark mode deepens the brand blue so white text keeps 4.5:1.
  primary:
    "bg-brand text-brand-foreground shadow-sm hover:bg-[color-mix(in_oklab,var(--brand),black_14%)] active:bg-[color-mix(in_oklab,var(--brand),black_22%)] dark:bg-[color-mix(in_oklab,var(--brand),black_16%)] dark:hover:bg-[color-mix(in_oklab,var(--brand),black_26%)] dark:active:bg-[color-mix(in_oklab,var(--brand),black_32%)]",
  secondary:
    "border border-foreground/50 bg-foreground/[0.06] text-foreground hover:border-foreground/75 hover:bg-foreground/[0.1] active:bg-foreground/[0.14]",
  quiet: "text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground active:bg-foreground/[0.12]",
  danger: "bg-negative/15 text-negative hover:bg-negative/25",
};

const sizes: Record<ButtonSize, { base: string; icon: string; glyph: string }> = {
  sm: { base: "h-8 gap-2 px-4 text-[0.8125rem]", icon: "size-8", glyph: "size-4" },
  md: { base: "h-9 gap-2 px-4 text-sm", icon: "size-9", glyph: "size-4" },
};

const base =
  "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,color,scale,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading Phosphor icon. Outline (regular) weight by default. */
  icon?: Icon;
  iconWeight?: "regular" | "fill" | "bold";
  /** Shows a spinner in place of the icon and disables the button. */
  loading?: boolean;
};

export function Button({
  variant = "secondary",
  size = "sm",
  icon: IconComponent,
  iconWeight = "regular",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const glyph = sizes[size].glyph;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, sizes[size].base, variants[variant], className)}
      {...props}
    >
      {loading ? (
        <Spinner className={glyph} />
      ) : (
        IconComponent && (
          <IconComponent weight={iconWeight} className={glyph} aria-hidden="true" />
        )
      )}
      {children}
    </button>
  );
}

export type IconButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  icon: Icon;
  /** Accessible name; icon buttons have no visible text. */
  label: string;
  /**
   * Show our Tooltip instead of the native `title`. `true` uses `label`; pass a
   * node for richer content (e.g. the label plus a key hint).
   */
  tooltip?: React.ReactNode;
  tooltipSide?: "top" | "bottom";
  tooltipAlign?: "start" | "center" | "end";
};

/**
 * Round, icon-only button. `label` becomes its aria-label, and its native title
 * unless a `tooltip` is given (never both, so hints don't double up).
 */
export function IconButton({
  variant = "quiet",
  size = "sm",
  icon: IconComponent,
  iconWeight = "regular",
  label,
  tooltip,
  tooltipSide = "top",
  tooltipAlign = "center",
  loading = false,
  disabled,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  const glyph = sizes[size].glyph;
  const button = (
    <button
      type={type}
      aria-label={label}
      title={tooltip ? undefined : label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, sizes[size].icon, variants[variant], className)}
      {...props}
    >
      {loading ? (
        <Spinner className={glyph} />
      ) : (
        <IconComponent weight={iconWeight} className={glyph} aria-hidden="true" />
      )}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip
      content={tooltip === true ? label : tooltip}
      side={tooltipSide}
      align={tooltipAlign}
    >
      {button}
    </Tooltip>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <CircleNotch
      weight="bold"
      aria-hidden="true"
      className={cn("animate-spin motion-reduce:animate-none", className)}
    />
  );
}
