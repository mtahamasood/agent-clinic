import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNoticeBoardAilment } from "@/server/ailments";

export default async function Home() {
  const ailment = await getNoticeBoardAilment();

  // The `<main>` landmark and container width come from the root layout.
  //
  // One ailment, no list, no counts, no links: the roster is Phase 2 and the
  // dashboard is Phase 7 (D1). What this page has to prove is that the clinic
  // is identifiable and that what it shows comes out of the database.
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
          <CardTitle>
            {ailment ? `On the board: ${ailment.name}` : "Notice board"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {ailment
              ? ailment.summary
              : "The board is bare. Someone has taken the notices down again."}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
