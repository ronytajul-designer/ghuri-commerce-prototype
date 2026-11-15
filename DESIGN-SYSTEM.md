# Design system rules

The prototype follows the live Ghuri Commerce admin: **shadcn/ui (radix, "vega" style) on Tailwind v4, neutral base, radius 0.625rem, system font stack**, plus the product's own `success`, `warning` and `info` colours. Every screen is built from the components listed here. Do not hand-style something a component already does.

## 8px grid

All spacing and control sizes are multiples of 8px. 4px is allowed only between a label and its helper text, or inside a badge.

| Use | Tailwind | px |
|---|---|---|
| Inline gap (icon + text, button groups, chips) | `gap-2` | 8 |
| Gap between fields, list rows | `gap-4` | 16 |
| Gap between cards and page sections | `gap-6` | 24 |
| Card padding | `--card-spacing` (`6`) | 24 |
| Page padding | `px-4 py-6` / `md:px-8 md:py-8` | 16 / 32 |

| Control | Height |
|---|---|
| Button / Input / Select / Toggle, default | 40 (`h-10`) |
| Small (`size="sm"`), table inline inputs | 32 (`h-8`) |
| Large (`size="lg"`), primary checkout action | 48 (`h-12`) |
| Badge | 24 (`h-6`) |
| Table row | 48 min (`h-12`) |
| Top bar | 56 (`h-14`) |

Change from the live admin: controls there are 36px (`h-9`). The prototype moves them to 40px to stay on the 8px grid and meet a larger touch target. Developers should apply the same change in `button`, `input`, `select`, `input-group`, `tabs` and `toggle`.

## Type

| Role | Class |
|---|---|
| Page title | `text-2xl font-semibold tracking-tight` (via `PageHeader`) |
| Card title | `CardTitle` |
| Body | `text-sm` |
| Helper / meta | `text-sm text-muted-foreground`, `text-xs` for second lines in tables |
| Money and numbers | `tabular-nums` (via `Money`) |

## Colour and status

Status uses `Badge` variants only. New variants were added to `badge.tsx`:

| Variant | Meaning |
|---|---|
| `warning` | Needs action now (To confirm, No answer) |
| `info` | In progress (To ship, In transit, courier) |
| `success` | Done / good signal (Delivered, Active, paid) |
| `destructive` | Problem (Returned, high return risk, invalid phone) |
| `muted` | Neutral (Draft, Cancelled, COD amount) |

Text on these badges uses new `--success-foreground`, `--warning-foreground` and `--info-foreground` tokens, so it passes 4.5:1 in light and dark.

## Shared components (`src/components/app/`)

| Component | Use it for |
|---|---|
| `AppShell` | Sidebar, top bar with View store and theme toggle. Every admin page. |
| `Page`, `PageHeader`, `PageGrid`, `PageColumn` | Page padding, title row with back, badges and actions, main + 320px aside layout. |
| `ChoiceCardGroup` | Radio options shown as cards (status, payment, courier, cancel reason). |
| `DescriptionList`, `StatGroup` | Label/value pairs and small number rows in aside cards. |
| `Money`, `MoneyInput`, `parseAmount` | Taka display, ৳ input that accepts Bangla digits. |
| `OrderStatusBadge`, `PaymentBadge`, `RiskBadge` | The only way to show order state. |
| `OrderProgress` | Four-step COD progress bar. |
| `BookCourierDialog`, `CancelOrderDialog` | Order actions used from list and detail. |
| `MobileSaveBar` | Fixed Save/Discard on phones for long forms. |
| `StatCard` | One KPI with change vs previous period; `goodWhen` sets which direction is good. |
| `ShareStoreButton` | Copy link, Facebook, WhatsApp. Used on Home and empty states. |

shadcn/ui components used as is: Chart (recharts), Progress, Card, Table, Tabs, Field, Input, InputGroup, Select, Textarea, Checkbox, RadioGroup, Switch, ToggleGroup, Badge, Button, Alert, Dialog, AlertDialog, Empty, Sidebar, DropdownMenu, Sonner.

## Layout patterns

- **List pages**: `PageHeader` → `Tabs` → toolbar (search, bulk actions) → `Card` with `Table` (desktop) or stacked rows (phone) → count.
- **Detail and form pages**: `PageHeader` with back and actions → `PageGrid` with cards in the main column and summary cards in the aside.
- **Next action first**: the first card on a detail page says what to do next, with the progress bar and the primary action in its footer.
