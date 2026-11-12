import { Spinner } from "@/components/ui";

/** A centred spinner shown while a page (or part of one) is getting ready. */
export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-primary">
      <Spinner size="lg" label={label} />
    </div>
  );
}
