import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import { listItems } from "@/server/api";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { StatusBadge } from "@/ui/status";
import { formatRelative } from "@/ui/utils";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const items = useQuery({ queryKey: ["items"], queryFn: () => listItems() });
  const rows = items.data ?? [];
  const active = rows.filter((item) => item.status === "active").length;
  const failed = rows.filter((item) => item.status === "failed").length;

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Overview"
        title="Dashboard"
        description="The example resource, read through a server function into Kysely."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">{failed}</p>
          </CardContent>
        </Card>
      </div>

      <section className="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Boxes className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Recent items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 5).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    to="/items/$itemId"
                    params={{ itemId: item.id }}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge state={item.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatRelative(Date.parse(item.updatedAt))}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No items yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>
    </PageShell>
  );
}
