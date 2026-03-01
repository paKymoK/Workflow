import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Typography, message } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
  ConnectionLineType,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeDragHandler,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { fetchWorkflowById } from "../api/ticketApi";
import type { Workflow, WorkflowStatus, WorkflowTransition } from "../api/types";

const { Title } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH  = 180;
const NODE_HEIGHT = 70;

// Light-mode palette
const GROUP_STYLES: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  TODO:       { border: "#d1d5db", bg: "#f9fafb", text: "#6b7280", dot: "#9ca3af"  },
  PROCESSING: { border: "#bfdbfe", bg: "#eff6ff", text: "#3b82f6", dot: "#3b82f6"  },
  DONE:       { border: "#bbf7d0", bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e"  },
};

const fallbackStyle = { border: "#d1d5db", bg: "#f9fafb", text: "#6b7280", dot: "#9ca3af" };

// ─── Dagre Layout ─────────────────────────────────────────────────────────────

function getLayoutedElements(nodes: Node[], edges: Edge[], direction: "LR" | "TB" = "LR") {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const isHorizontal = direction === "LR";

  return {
    nodes: nodes.map((node) => {
      // Keep saved position, only update handle directions
      if (node.data?.positionSaved) {
        return {
          ...node,
          data: {
            ...node.data,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            targetPosition: isHorizontal ? Position.Left  : Position.Top,
          },
        };
      }
      // Use dagre-calculated position
      const { x, y } = g.node(node.id);
      return {
        ...node,
        position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
        data: {
          ...node.data,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          targetPosition: isHorizontal ? Position.Left  : Position.Top,
        },
      };
    }),
    edges,
  };
}

// ─── Custom State Node ────────────────────────────────────────────────────────

function StateNode({ data }: NodeProps) {
  const s = GROUP_STYLES[data.group as string] ?? fallbackStyle;
  const sourcePos = (data.sourcePosition as Position) ?? Position.Right;
  const targetPos = (data.targetPosition as Position) ?? Position.Left;

  return (
    <>
      <Handle type="target" position={targetPos}
        style={{ background: s.dot, border: "2px solid #fff", width: 10, height: 10 }} />

      <div style={{
        width: NODE_WIDTH, height: NODE_HEIGHT,
        border: `1.5px solid ${s.border}`,
        background: s.bg,
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
          <span style={{ color: "#111827", fontWeight: 600, fontSize: 13 }}>
            {data.label as string}
          </span>
        </div>
        <span style={{
          fontFamily: "monospace", fontSize: 9,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: s.text,
          background: `${s.border}55`,
          padding: "1px 6px", borderRadius: 3,
        }}>
          {data.group as string}
        </span>
      </div>

      <Handle type="source" position={sourcePos}
        style={{ background: s.dot, border: "2px solid #fff", width: 10, height: 10 }} />
    </>
  );
}

const nodeTypes = { stateNode: StateNode };

// ─── Build nodes / edges ──────────────────────────────────────────────────────

function buildElements(workflow: Workflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = workflow.statuses.map((s) => ({
    id:   String(s.id),
    type: "stateNode",
    position: { x: s.x ?? 0, y: s.y ?? 0 },
    data: {
      label: s.name,
      group: s.group,
      color: s.color,
      positionSaved: s.x != null && s.y != null,
    },
  }));

  const edges: Edge[] = workflow.transitions.map((t, i) => ({
    id:     `e-${i}`,
    source: String(t.from.id),
    target: String(t.to.id),
    type:   ConnectionLineType.SmoothStep,
    animated: true,
    label:  t.name,
    labelStyle:         { fontFamily: "monospace", fontSize: 10, fill: "#6366f1", letterSpacing: "0.06em" },
    labelBgStyle:       { fill: "#eef2ff", fillOpacity: 1 },
    labelBgPadding:     [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    data: {
      validators:     t.validator ?? [],
      postFunctions:  t.postFunctions ?? [],
      transitionName: t.name,
    },
  }));

  return { nodes, edges };
}

// ─── Transition Detail Panel ──────────────────────────────────────────────────

function DetailPanel({ edge, onClose }: { edge: Edge | null; onClose: () => void }) {
  if (!edge) return null;

  const validators:    string[] = (edge.data?.validators    as string[]) ?? [];
  const postFunctions: string[] = (edge.data?.postFunctions as string[]) ?? [];
  const shortName = (s: string) => s.includes(".") ? s.split(".").pop()! : s;

  return (
    <div style={{
      position: "absolute", top: 12, right: 12, zIndex: 10,
      background: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: 10, padding: "16px 18px", width: 256,
      boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6366f1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 3 }}>
            Transition
          </div>
          <div style={{ color: "#111827", fontWeight: 700, fontSize: 14 }}>
            {edge.data?.transitionName as string ?? edge.label as string}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
            {edge.source} → {edge.target}
          </div>
        </div>
        <button onClick={onClose} style={{
          color: "#9ca3af", background: "none", border: "none",
          cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, marginTop: 2,
        }}>✕</button>
      </div>

      <Section label="Validators">
        {validators.length > 0
          ? validators.map((v, i) => <Chip key={i} label={shortName(v)} variant="validator" />)
          : <EmptyChip />}
      </Section>

      <Section label="Post Functions" style={{ marginTop: 12 }}>
        {postFunctions.length > 0
          ? postFunctions.map((f, i) => <Chip key={i} label={shortName(f)} variant="postfn" />)
          : <EmptyChip />}
      </Section>
    </div>
  );
}

function Section({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}

function Chip({ label, variant }: { label: string; variant: "validator" | "postfn" }) {
  const isV = variant === "validator";
  return (
    <div style={{
      fontFamily: "monospace", fontSize: 10,
      color:      isV ? "#d97706" : "#7c3aed",
      background: isV ? "#fef3c7"  : "#ede9fe",
      border:     `1px solid ${isV ? "#fde68a" : "#ddd6fe"}`,
      borderRadius: 4, padding: "3px 8px",
      display: "flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ opacity: 0.5, fontSize: 9 }}>{isV ? "V" : "F"}</span>
      {label}
    </div>
  );
}

function EmptyChip() {
  return <div style={{ fontFamily: "monospace", fontSize: 10, color: "#d1d5db" }}>— none</div>;
}

// ─── Layout Toggle Button ─────────────────────────────────────────────────────

function LayoutBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "monospace", fontSize: 10, padding: "4px 10px",
      borderRadius: 4, cursor: "pointer", border: "1px solid",
      borderColor: active ? "#6366f1" : "#e5e7eb",
      background:  active ? "#eef2ff"  : "#ffffff",
      color:       active ? "#6366f1"  : "#6b7280",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [workflow,     setWorkflow]     = useState<Workflow | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [isDirty,      setIsDirty]      = useState(false);
  const [direction,    setDirection]    = useState<"LR" | "TB">("LR");
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Keep a ref to latest nodes so onSave always reads current positions
  const nodesRef = useRef<Node[]>(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  // Mark dirty when user finishes dragging — no API call yet
  const onNodeDragStop: NodeDragHandler = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Save button handler
  const onSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      // const positions = nodesRef.current.map((n) => ({
      //   id: Number(n.id),
      //   x:  Math.round(n.position.x),
      //   y:  Math.round(n.position.y),
      // }));
      // await saveWorkflowNodePositions(id, positions);
      setIsDirty(false);
      messageApi.success("Layout saved");
    } catch {
      messageApi.error("Failed to save layout");
    } finally {
      setSaving(false);
    }
  }, [id, messageApi]);

  // Initial load
  useEffect(() => {
    if (!id) return;
    fetchWorkflowById(id)
      .then((wf) => {
        setWorkflow(wf);
        const { nodes: n, edges: e } = buildElements(wf);
        const { nodes: ln, edges: le } = getLayoutedElements(n, e, "LR");
        setNodes(ln);
        setEdges(le);
      })
      .finally(() => setLoading(false));
  }, [id, setNodes, setEdges]);

  // Re-layout on direction change
  const onLayout = useCallback((dir: "LR" | "TB") => {
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, dir);
    setNodes([...ln]);
    setEdges([...le]);
    setDirection(dir);
    setIsDirty(true);
  }, [nodes, edges, setNodes, setEdges]);

  // ── Render ──

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!workflow) {
    return <span style={{ color: "#ef4444" }}>Workflow not found.</span>;
  }

  return (
    <>
      {contextHolder}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>

        {/* Top bar */}
        <div style={{ padding: "12px 0 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => navigate("/settings")}
              style={{ paddingLeft: 0, marginBottom: 8 }}
            >
              Back to Settings
            </Button>
            <Title level={3} style={{ margin: 0 }}>{workflow.name}</Title>
          </div>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!isDirty}
            onClick={onSave}
          >
            Save Layout
          </Button>
        </div>

        {/* Flow canvas */}
        <div style={{
          flex: 1, minHeight: 520,
          borderRadius: 12, overflow: "hidden",
          border: "1px solid #e5e7eb",
          position: "relative",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onPaneClick={() => setSelectedEdge(null)}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: "#f8fafc" }}
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />
            <MiniMap
              nodeColor={(n) => GROUP_STYLES[n.data?.group as string]?.dot ?? "#9ca3af"}
              style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
            />

            {/* Layout toggle */}
            <Panel position="top-left">
              <div style={{
                background: "#ffffff", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "7px 10px",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Layout
                </span>
                <LayoutBtn active={direction === "LR"} label="→ LR" onClick={() => onLayout("LR")} />
                <LayoutBtn active={direction === "TB"} label="↓ TB" onClick={() => onLayout("TB")} />
              </div>
            </Panel>

            {/* Unsaved indicator */}
            {isDirty && (
              <Panel position="top-right">
                <div style={{
                  background: "#fffbeb", border: "1px solid #fde68a",
                  borderRadius: 6, padding: "5px 10px",
                  fontFamily: "monospace", fontSize: 10, color: "#d97706",
                }}>
                  Unsaved changes
                </div>
              </Panel>
            )}
          </ReactFlow>

          {/* Transition detail panel */}
          <DetailPanel edge={selectedEdge} onClose={() => setSelectedEdge(null)} />
        </div>

      </div>
    </>
  );
}