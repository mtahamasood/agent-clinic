import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * What the roster looks like while it is still being fetched.
 *
 * Honest about its own reach (D6): `/agents` is statically prerendered, exactly
 * as `/` is, so in production this appears only in the window where a
 * client-side navigation is fetching the segment's payload and the router has
 * not already prefetched it. On a warm prefetch that window is nil. Phase 6 is
 * where the rendering strategy changes and where this starts earning its keep —
 * it is here now because the roadmap asks for the state, and because a UI gap
 * is a bad thing for Phase 6 to inherit alongside a rendering change.
 *
 * No `Skeleton` primitive and no animation library: the cap on primitives is
 * still one per phase, and this needs none of its own (D7).
 */
export default function LoadingRoster() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Patients on the books
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        Fetching the files. The clinic keeps good records and slow drawers.
      </p>

      {/* The same grid as the roster itself, so nothing jumps when the real
          cards arrive. */}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2" aria-hidden="true">
        {[0, 1, 2, 3].map((slot) => (
          <li key={slot}>
            <Card>
              <CardHeader>
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="mt-2 h-3 w-16 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-1.5">
                  <div className="h-5 w-20 rounded-4xl bg-muted" />
                  <div className="h-5 w-16 rounded-4xl bg-muted" />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
