import { createFileRoute } from "@tanstack/react-router";
import { FileText, Folder, FolderOpen, FolderTree, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/primitives/card";
import { Label } from "@/ui/primitives/label";
import { Switch } from "@/ui/primitives/switch";
import { Tree, TreeDragHandle, TreeItem, TreeItemLabel } from "@/ui/primitives/tree";
import { TREE_ROOT, useTreeController } from "@/ui/tree-controller";

type Node = { id: string; parentId: string | null; name: string; kind: "root" | "folder" | "file" };

const INITIAL: Node[] = [
  { id: TREE_ROOT, parentId: null, name: "workspace", kind: "root" },
  { id: "src", parentId: TREE_ROOT, name: "src", kind: "folder" },
  { id: "src/ui", parentId: "src", name: "ui", kind: "folder" },
  { id: "src/ui/tree.tsx", parentId: "src/ui", name: "tree.tsx", kind: "file" },
  { id: "src/ui/button.tsx", parentId: "src/ui", name: "button.tsx", kind: "file" },
  { id: "src/server", parentId: "src", name: "server", kind: "folder" },
  { id: "src/server/db.ts", parentId: "src/server", name: "db.ts", kind: "file" },
  { id: "src/readme.md", parentId: "src", name: "readme.md", kind: "file" },
  { id: "tests", parentId: TREE_ROOT, name: "tests", kind: "folder" },
  { id: "tests/tree.test.ts", parentId: "tests", name: "tree.test.ts", kind: "file" },
  { id: "package.json", parentId: TREE_ROOT, name: "package.json", kind: "file" },
];

// Stable identities, so the loader is not rebuilt for nothing on every render.
const getId = (node: Node) => node.id;
const getParentId = (node: Node) => node.parentId;
const getItemName = (node: Node) => node.name;
const isFolder = (node: Node) => node.kind !== "file";

function isAncestor(nodes: Node[], ancestorId: string, id: string): boolean {
  let current = nodes.find((node) => node.id === id)?.parentId ?? null;
  while (current) {
    if (current === ancestorId) return true;
    current = nodes.find((node) => node.id === current)?.parentId ?? null;
  }
  return false;
}

export const Route = createFileRoute("/_app/tree")({
  component: TreePage,
});

/** One flat list in, a tree out: the loader, the root and the features are wired for you. */
function TreePage() {
  const [nodes, setNodes] = useState(INITIAL);
  const [draggable, setDraggable] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  const tree = useTreeController<Node>({
    items: nodes,
    getId,
    getParentId,
    getItemName,
    isFolder,
    selectable: true,
    draggable,
    tree: {
      state: { selectedItems: selected },
      setSelectedItems: (updater) =>
        setSelected(typeof updater === "function" ? updater(selected) : updater),
      // Drop into a folder only, so a drop is a move with no position to work out.
      canReorder: false,
      canDrop: (items, target) => {
        const to = target.item.getId();
        return items.every((item) => item.getId() !== to && !isAncestor(nodes, item.getId(), to));
      },
      onDrop: (items, target) => {
        const to = target.item.getId();
        const moved = new Set(items.map((item) => item.getId()));
        setNodes((prev) =>
          prev.map((node) => (moved.has(node.id) ? { ...node, parentId: to } : node)),
        );
      },
    },
  });

  // The tree reads through the loader; a new loader alone does not make it re-read.
  const structureKey = nodes.map((node) => `${node.id}:${node.parentId}`).join("|");
  useEffect(() => {
    tree.rebuildTree();
  }, [tree, structureKey]);

  const rows = tree.getItems().filter((item) => item.getId() !== TREE_ROOT);

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Example"
        title="Tree"
        description="The tree item: a flat list in, a tree out, and only the data and the actions to own."
      />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1.5">
              <CardTitle>Files</CardTitle>
              <CardDescription>
                Arrow keys move, left and right open and close, and Enter opens. Turn drag off to
                drop the drag handles.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="tree-drag" checked={draggable} onCheckedChange={setDraggable} />
              <Label htmlFor="tree-drag">Drag</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tree
            tree={tree}
            className="rounded-lg bg-inset p-1 shadow-[var(--shadow-border)]"
            aria-label="Files"
          >
            {rows.map((item) => {
              const node = item.getItemData();
              const Icon =
                node.kind === "file" ? FileText : item.isExpanded() ? FolderOpen : Folder;
              return (
                <TreeItem key={item.getId()} item={item}>
                  {draggable ? (
                    <TreeDragHandle item={item} aria-hidden="true">
                      <GripVertical className="size-3.5" />
                    </TreeDragHandle>
                  ) : null}
                  <TreeItemLabel>
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{node.name}</span>
                    {node.kind === "file" ? null : (
                      <span className="ml-auto pr-1 text-xs text-muted-foreground">
                        {item.getChildren().length}
                      </span>
                    )}
                  </TreeItemLabel>
                </TreeItem>
              );
            })}
          </Tree>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Selection</CardTitle>
          <CardDescription>
            <FolderTree className="mr-1 inline size-3.5 align-[-2px]" />
            The same array the tree keeps, so the page can act on it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {selected.length === 0 ? "Nothing selected." : selected.join(", ")}
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
