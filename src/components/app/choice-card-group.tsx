import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export type Choice<T extends string> = { value: T; title: React.ReactNode; description?: React.ReactNode }

/** shadcn "choice card" pattern: a RadioGroup whose options are bordered, fully clickable cards. */
export function ChoiceCardGroup<T extends string>({
  name, value, onValueChange, choices, columns = 1, className, "aria-label": ariaLabel,
}: {
  name: string
  value: T
  onValueChange: (v: T) => void
  choices: Choice<T>[]
  columns?: 1 | 2
  className?: string
  "aria-label"?: string
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={ariaLabel}
      className={cn("grid gap-2", columns === 2 && "grid-cols-2", className)}
    >
      {choices.map((c) => (
        <FieldLabel key={c.value} htmlFor={`${name}-${c.value}`}>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{c.title}</FieldTitle>
              {c.description && <FieldDescription>{c.description}</FieldDescription>}
            </FieldContent>
            <RadioGroupItem id={`${name}-${c.value}`} value={c.value} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}
