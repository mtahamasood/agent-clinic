import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentNotice } from "@/server/notices";

// Task group 5 turns this into the clinic's home page. For now it proves the
// path from database to rendered page, which is what Phase 0 is for.
export default async function Home() {
  const notice = await getCurrentNotice();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Notice board</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {notice
              ? notice.message
              : "The board is bare. Someone has taken the notices down again."}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
