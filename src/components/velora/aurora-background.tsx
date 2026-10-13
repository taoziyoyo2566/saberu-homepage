// Adapted from Velora UI (MIT); see THIRD_PARTY_NOTICES.md.
import { cx } from "./cx";

/**
 * Three blurred blobs in the brand ramp that drift slowly. Absolutely
 * positioned: place it inside a `relative overflow-hidden` element.
 */
export function AuroraBackground({
  className,
}: {
  readonly className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-25 dark:opacity-20",
        className,
      )}
    >
      <div className="absolute -top-1/4 left-[10%] size-[44rem] rounded-full bg-brand-from blur-[120px] will-change-transform motion-safe:animate-aurora-1" />
      <div className="absolute top-[5%] right-[5%] size-[38rem] rounded-full bg-brand-via blur-[130px] will-change-transform motion-safe:animate-aurora-2" />
      <div className="absolute -bottom-1/4 left-[35%] size-[40rem] rounded-full bg-brand-to blur-[140px] will-change-transform motion-safe:animate-aurora-3" />
    </div>
  );
}
