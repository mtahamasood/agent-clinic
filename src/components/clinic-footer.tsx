/**
 * The foot of every page.
 *
 * Text only, deliberately. A footer is where links collect, and every route
 * beyond `/` is Phase 2 or later — the same D5 reasoning that keeps the header
 * free of navigation applies here.
 */
export function ClinicFooter() {
  return (
    <footer className="border-t border-foreground/10">
      <div className="mx-auto w-full max-w-2xl px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Open all hours. Our patients neither sleep nor stop complaining.
        </p>
      </div>
    </footer>
  );
}
