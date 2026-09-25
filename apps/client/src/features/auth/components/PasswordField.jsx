import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

const PasswordField = ({
  label = "Mot de passe",
  error,
  id = "password",
  ref,
  className,
  ...props
}) => {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id} className="text-sm font-medium">
        {label}
      </FieldLabel>
      <div className="relative">
        <LockKeyhole
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full rounded-lg pl-10 pr-12 text-base ${className ?? ""}`}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-1 my-auto size-9 rounded-md"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      <FieldError id={errorId}>{error?.message}</FieldError>
    </Field>
  );
};

export default PasswordField;
