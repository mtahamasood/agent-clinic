import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentNotice } from "@/server/notices";

export default async function Home() {
  const notice = await getCurrentNotice();

  // The `<main>` landmark and container width come from the root layout.
  return (
    <>
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
    </>
  );
}
