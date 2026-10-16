import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
  Tree,
  TreeDragHandle,
  TreeItem,
  TreeItemLabel,
  type ItemInstance,
  type TreeItemLabelProps,
  type TreeItemProps,
  type TreeProps,
} from "@/ui/primitives/tree";
import { TREE_ROOT, useTreeController } from "@/ui/tree-controller";

/**
 * This starter renders every page on the server, and the tree is the one item that leans
 * on the DOM. Render it the way the server does, so a change that reaches for `document`
 * fails here rather than at request time.
 */

type Probe = { id: string; parentId: string | null; name: string };

// `createElement` cannot infer a generic component's parameter, so pin it here.
const TreeOf = Tree as ComponentType<TreeProps<Probe>>;
const TreeItemOf = TreeItem as ComponentType<TreeItemProps<Probe>>;
const TreeLabelOf = TreeItemLabel as ComponentType<TreeItemLabelProps<Probe>>;
const TreeHandleOf = TreeDragHandle as ComponentType<{ item: ItemInstance<Probe> }>;

const items: Probe[] = [
  { id: TREE_ROOT, parentId: null, name: "All" },
  { id: "a", parentId: TREE_ROOT, name: "A" },
  { id: "b", parentId: "a", name: "B" },
];

function Probe() {
  const tree = useTreeController<Probe>({
    items,
    getId: (node) => node.id,
    getParentId: (node) => node.parentId,
    getItemName: (node) => node.name,
    selectable: true,
    draggable: true,
  });
  return createElement(
    TreeOf,
    { tree },
    tree
      .getItems()
      .map((item) =>
        createElement(
          TreeItemOf,
          { key: item.getId(), item },
          createElement(TreeHandleOf, { item }),
          createElement(TreeLabelOf),
        ),
      ),
  );
}

it("renders on the server without touching the DOM", () => {
  const html = renderToString(createElement(Probe));
  expect(html).toContain("relative flex flex-col");
});
