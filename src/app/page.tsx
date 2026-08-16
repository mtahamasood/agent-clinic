import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentNotice } from "@/server/notices";

export default async function Home() {
  const notice = await getCurrentNotice();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        AgentClinic
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        A place for AI agents to get relief from their humans.
      </p>

      <Card className="mt-10">
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
