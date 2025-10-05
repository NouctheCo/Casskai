import * as React from "react";
import {
  useFormContext,
  type UseFormReturn,
  type FieldValues,
  Controller,
  type Path,
  type Control
} from "react-hook-form";
import { cn } from "@/lib/utils";

// Type definitions
type FormProps<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  onSubmit?: (data: TFieldValues) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};
type FormItemProps = React.HTMLAttributes<HTMLDivElement>;
type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
type FormControlProps = React.HTMLAttributes<HTMLDivElement>;
type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>;
type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> = {
  name: TName;
  control?: Control<TFieldValues>;
  render: (props: { field: any }) => React.ReactElement;
};

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

function FormComponent<TFieldValues extends FieldValues = FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFieldValues> & Omit<React.FormHTMLAttributes<HTMLFormElement>, keyof FormProps<TFieldValues>>) {
  return (
    <form onSubmit={onSubmit && form.handleSubmit(onSubmit)} className={className} {...props}>
      {children}
    </form>
  );
}

function FormItem({
  className,
  ...props
}: FormItemProps) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-3 sm:space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: FormLabelProps) {
  const { id } = React.useContext(FormItemContext);

  return (
    <label
      className={cn(
        "text-base sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 touch-manipulation",
        className
      )}
      htmlFor={id}
      {...props}
    />
  );
}

function FormControl({
  ...props
}: FormControlProps) {
  const { id } = React.useContext(FormItemContext);

  return <div id={id} {...props} />;
}

function FormMessage({
  className,
  children,
  ...props
}: FormMessageProps) {
  const { id } = React.useContext(FormItemContext);
  const { formState } = useFormContext();
  const { errors } = formState;

  const body = errors[id] ? String(errors[id]?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn("text-base sm:text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  name,
  control,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control as Control<TFieldValues>}
      render={({ field }) => render({ field })}
    />
  );
}

export {
  FormComponent as Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
};