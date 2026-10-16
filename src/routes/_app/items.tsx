import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createItem, deleteItem, listItems, type Item } from "@/server/api";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { Field } from "@/ui/form";
import { ListFilterBar } from "@/ui/list-filter-bar";
import { notify } from "@/ui/notify";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/dialog";
import { Input } from "@/ui/primitives/input";
import { Select } from "@/ui/primitives/select";
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

const EMPTY: { name: string; description: string; status: Item["status"] } = {
  name: "",
  description: "",
  status: "active",
};

function CreateItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      notify.created(item.name);
      setForm(EMPTY);
      setError(null);
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Create failed"),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ data: form });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>An item is the smallest thing the app tracks.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nightly ingest"
              aria-label="Name"
            />
          </Field>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What it does"
              aria-label="Description"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as Item["status"] })
              }
              aria-label="Status"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
            </Select>
          </Field>
          {error ? <p className="text-sm text-danger-fg">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/_app/items")({
  component: ItemsPage,
});

function ItemsPage() {
  const queryClient = useQueryClient();
  const items = useQuery({ queryKey: ["items"], queryFn: () => listItems() });
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const remove = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      notify.deleted(pendingDelete?.name ?? "Item");
      setPendingDelete(null);
    },
    onError: (err) => notify.error(err),
  });

  const query = filter.trim().toLowerCase();
  const rows = query
    ? (items.data ?? []).filter((item) => item.name.toLowerCase().includes(query))
    : (items.data ?? []);

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Items"
        title="Items"
        description="The example CRUD resource: UI → server function → Kysely."
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            New item
          </Button>
        }
      />

      <div className="grid gap-3">
        <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter items…" />
        <div className="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
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
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Delete ${item.name}`}
                      title={`Delete ${item.name}`}
                      onClick={() => setPendingDelete(item)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {filter ? `Nothing matches “${filter}”.` : "No items yet."}
            </p>
          ) : null}
        </div>
      </div>

      <CreateItemDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "item"}?`}
        description="The item is removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) remove.mutate({ data: { id: pendingDelete.id } });
        }}
      />
    </PageShell>
  );
}
