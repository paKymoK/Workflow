import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

export interface OrgChartUser {
  sub:        string;
  name:       string;
  email:      string;
  title:      string;
  department: string;
  managerSub: string | null;
  avatar:     string | null;
  depth:      number;
}

const NODE_WIDTH  = 220;
const NODE_HEIGHT = 90;

export function buildOrgChart(
  users:          OrgChartUser[],
  visibleSubs:    Set<string>,
  onExpandToggle: (id: string) => void,
): {
  nodes: Node[];
  edges: Edge[];
} {
  const visible = users.filter((u) => visibleSubs.has(u.sub));

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 70 });

  for (const user of visible) {
    graph.setNode(user.sub, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const user of visible) {
    if (user.managerSub && visibleSubs.has(user.managerSub)) {
      graph.setEdge(user.managerSub, user.sub);
    }
  }

  dagre.layout(graph);

  const nodes: Node[] = visible.map((user) => {
    const { x, y } = graph.node(user.sub);

    const hasChildren  = users.some((u) => u.managerSub === user.sub);
    const children     = users.filter((u) => u.managerSub === user.sub);
    const isExpanded   = children.length > 0 && children.every((c) => visibleSubs.has(c.sub));

    return {
      id:       user.sub,
      type:     "orgNode",
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: {
        name:           user.name,
        title:          user.title,
        department:     user.department,
        email:          user.email,
        avatar:         user.avatar ?? null,
        hasChildren,
        isExpanded,
        onExpandToggle,
      },
    };
  });

  const edges: Edge[] = visible
    .filter((u) => u.managerSub && visibleSubs.has(u.managerSub))
    .map((user) => ({
      id:            `${user.managerSub}-${user.sub}`,
      source:        user.managerSub!,
      target:        user.sub,
      type:          "smoothstep",
      style:         { stroke: "#d1d5db", strokeWidth: 1.5 },
      animated:      false,
    }));

  return { nodes, edges };
}