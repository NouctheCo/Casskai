import { type FieldValues, type Path } from "react-hook-form";

export interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> {
  name: TName;
}

export type FormItemContextValue = {
  id: string;
}
