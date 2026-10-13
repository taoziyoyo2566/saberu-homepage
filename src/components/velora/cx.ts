/** Joins class names, skipping empty values. */
export function cx(
  ...classes: ReadonlyArray<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}
