import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

export interface OrgChartUser {
  sub: string;
  name: string;
  email: string;
  title: string;
  department: string;
  managerSub: string | null;
  depth: number;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

export function buildOrgChart(
  users: OrgChartUser[],
  onViewDetail: (sub: string) => void,
): {
  nodes: Node[];
  edges: Edge[];
} {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  for (const user of users) {
    graph.setNode(user.sub, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const user of users) {
    if (user.managerSub) {
      graph.setEdge(user.managerSub, user.sub);
    }
  }

  dagre.layout(graph);

  const nodes: Node[] = users.map((user) => {
    const { x, y } = graph.node(user.sub);
    return {
      id: user.sub,
      type: "orgNode",
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: {
        name: user.name,
        title: user.title,
        department: user.department,
        email: user.email,
        onViewDetail,
      },
    };
  });

  const edges: Edge[] = users
    .filter((u) => u.managerSub)
    .map((user) => ({
      id: `${user.managerSub}-${user.sub}`,
      source: user.managerSub!,
      target: user.sub,
      type: "smoothstep",
    }));

  return { nodes, edges };
}
