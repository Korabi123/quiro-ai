import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";

import { type UseFormWatch, type FieldValues, type UseFormTrigger } from "react-hook-form";

interface AutoSubmitProps<T extends FieldValues> {
  trigger: UseFormTrigger<T>;
  watch: UseFormWatch<T>;
  onSubmit: () => void;
  onValidationFailed?: () => void;
  debounceTime?: number;
}

/**
  * Automatically submit data when it's changed
  */

export const useAutoSubmit = <T extends FieldValues>({
  trigger,
  watch,
  onSubmit,
  onValidationFailed,
  debounceTime = 300,
}: AutoSubmitProps<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  //* Rebuilt only when the delay changes. Building it inside `useEffect` would
  //* mean the effect depends on the debounced function, so a new one every
  //* render would resubscribe on every render.
  const debouncedSubmit = useMemo(
    () => debounce(onSubmit, debounceTime),
    [onSubmit, debounceTime]
  );

  useEffect(() => {
    const subscription = watch((_data, info) => {
      if (info?.type !== "change") return;
      setIsSubmitting(true);
      trigger()
        .then((valid) => {
          if (valid) debouncedSubmit();
          else onValidationFailed?.();
        })
        .finally(() => setIsSubmitting(false));
    });

    return () => subscription.unsubscribe();
  }, [watch, trigger, debouncedSubmit, onValidationFailed]);

  return { isSubmitting };
};