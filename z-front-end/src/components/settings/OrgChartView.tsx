import { useCallback, useEffect, useMemo, useState } from "react";
import { Spin, Drawer, Descriptions, Badge, Input } from "antd";
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fetchOrgChart, fetchUserBySub } from "../../api/ticketApi";
import type { UserDetail } from "../../api/types";
import { buildOrgChart } from "../../utils/buildOrgChart";
import type { OrgChartUser } from "../../utils/buildOrgChart";
import OrgNode from "../OrgNode";

const nodeTypes = { orgNode: OrgNode };

// Inner component — must be inside ReactFlowProvider to use useReactFlow()
function OrgChartInner() {
  const [loading, setLoading]             = useState(true);
  const [users, setUsers]                 = useState<OrgChartUser[]>([]);
  const [visibleSubs, setVisibleSubs]     = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser]   = useState<UserDetail | null>(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchValue, setSearchValue]     = useState("");
  const [searchError, setSearchError]     = useState<string | null>(null);

  const { setCenter, getNode } = useReactFlow();

  useEffect(() => {
    fetchOrgChart()
      .then((data) => {
        setUsers(data);
        const initial = new Set(
          data.filter((u) => u.depth <= 1).map((u) => u.sub),
        );
        setVisibleSubs(initial);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExpandToggle = useCallback(
    (nodeId: string) => {
      setVisibleSubs((prev) => {
        const next     = new Set(prev);
        const children = users.filter((u) => u.managerSub === nodeId);
        const alreadyExpanded =
          children.length > 0 && children.every((c) => prev.has(c.sub));

        if (alreadyExpanded) {
          // Collapse — remove all descendants recursively
          const queue = [nodeId];
          while (queue.length) {
            const cur = queue.pop()!;
            users
              .filter((u) => u.managerSub === cur)
              .forEach((u) => {
                next.delete(u.sub);
                queue.push(u.sub);
              });
          }
        } else {
          // Expand — add direct children only
          children.forEach((c) => next.add(c.sub));
        }

        return next;
      });
    },
    [users],
  );

  const handleNodeClick = useCallback(
    (_event: unknown, node: { id: string }) => {
      setDrawerOpen(true);
      setDetailLoading(true);
      setSelectedUser(null);
      fetchUserBySub(node.id)
        .then(setSelectedUser)
        .finally(() => setDetailLoading(false));
    },
    [],
  );

  // Walk up the tree from a sub to collect all ancestor subs
  const getAncestorSubs = useCallback(
    (sub: string): string[] => {
      const ancestors: string[] = [];
      let current = users.find((u) => u.sub === sub);
      while (current?.managerSub) {
        ancestors.push(current.managerSub);
        current = users.find((u) => u.sub === current!.managerSub);
      }
      return ancestors;
    },
    [users],
  );

  const handleSearch = useCallback(
    (value: string) => {
      const sub = value.trim();
      setSearchError(null);

      if (!sub) return;

      const target = users.find((u) => u.sub === sub);

      if (!target) {
        setSearchError(`No user found with sub "${sub}"`);
        return;
      }

      // Expand all ancestors so the target node becomes visible
      const ancestors = getAncestorSubs(sub);
      setVisibleSubs((prev) => {
        const next = new Set(prev);
        [...ancestors, sub].forEach((s) => next.add(s));
        return next;
      });

      // After React Flow re-renders, pan and zoom to the found node
      setTimeout(() => {
        const node = getNode(sub);
        if (node) {
          setCenter(
            node.position.x + (node.measured?.width  ?? 220) / 2,
            node.position.y + (node.measured?.height ?? 90)  / 2,
            { zoom: 1, duration: 600 },
          );
        }
      }, 100);
    },
    [users, getAncestorSubs, getNode, setCenter],
  );

  const { nodes, edges } = useMemo(
    () => buildOrgChart(users, visibleSubs, handleExpandToggle),
    [users, visibleSubs, handleExpandToggle],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-3 max-w-xs">
        <Input.Search
          placeholder="Search by user sub…"
          allowClear
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setSearchError(null);
          }}
          onSearch={handleSearch}
          status={searchError ? "error" : undefined}
        />
        {searchError && (
          <div className="text-red-500 text-xs mt-1">
            {searchError}
          </div>
        )}
      </div>

      <div className="h-[calc(100vh-180px)] min-h-[500px] border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      <Drawer
        title="User Detail"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedUser(null); }}
        styles={{ wrapper: { width: 360 } }}
      >
        {detailLoading ? (
          <div className="flex justify-center pt-12">
            <Spin />
          </div>
        ) : selectedUser ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{selectedUser.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedUser.email ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Title">{selectedUser.title ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Department">{selectedUser.department ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge status="success" text="Active" />
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              <span className="font-mono text-xs">{selectedUser.sub}</span>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </>
  );
}

// Wrap with ReactFlowProvider so useReactFlow() works inside OrgChartInner
export default function OrgChartView() {
  return (
    <ReactFlowProvider>
      <OrgChartInner />
    </ReactFlowProvider>
  );
}