import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder page for task group 2 — proves the styling toolchain renders.
// Task group 4 replaces the body copy with a row read from the database, and
// task group 5 turns this into the clinic's home page.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Notice board</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The styling toolchain is wired: Tailwind and one shadcn/ui primitive.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
