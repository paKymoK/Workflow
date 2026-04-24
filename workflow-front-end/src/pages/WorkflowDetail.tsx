import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Typography, message } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import {
  ReactFlow, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, Handle, Position, Panel,
  ConnectionLineType,
  type Node, type Edge, type Connection, type NodeProps,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import type { Workflow } from "../api/types";
import { useWorkflow, useUpdateWorkflow } from "../hooks/useWorkflows";

const { Title } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH  = 180;
const NODE_HEIGHT = 70;

const GROUP_STYLES: Record<string, {
  borderColor: string; bg: string; text: string;
  dot: string; handleDot: string; badge: string;
}> = {
  TODO: {
    borderColor: "border-gray-300", bg: "bg-gray-50", text: "text-gray-500",
    dot: "bg-gray-400", handleDot: "!bg-gray-400", badge: "bg-gray-300/30 text-gray-500",
  },
  PROCESSING: {
    borderColor: "border-blue-200", bg: "bg-blue-50", text: "text-blue-500",
    dot: "bg-blue-500", handleDot: "!bg-blue-500", badge: "bg-blue-200/30 text-blue-500",
  },
  DONE: {
    borderColor: "border-green-200", bg: "bg-green-50", text: "text-green-600",
    dot: "bg-green-500", handleDot: "!bg-green-500", badge: "bg-green-200/30 text-green-600",
  },
};
const fallbackStyle = GROUP_STYLES.TODO;

const DOT_COLORS: Record<string, string> = {
  TODO: "#9ca3af", PROCESSING: "#3b82f6", DONE: "#22c55e",
};

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
      if (node.data?.positionSaved) {
        return { ...node, data: { ...node.data, sourcePosition: isHorizontal ? Position.Right : Position.Bottom, targetPosition: isHorizontal ? Position.Left : Position.Top } };
      }
      const { x, y } = g.node(node.id);
      return {
        ...node,
        position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
        data: { ...node.data, sourcePosition: isHorizontal ? Position.Right : Position.Bottom, targetPosition: isHorizontal ? Position.Left : Position.Top },
      };
    }),
    edges,
  };
}

// ─── Custom State Node ────────────────────────────────────────────────────────

function StateNode({ data }: NodeProps) {
  const s         = GROUP_STYLES[data.group as string] ?? fallbackStyle;
  const sourcePos = (data.sourcePosition as Position) ?? Position.Right;
  const targetPos = (data.targetPosition as Position) ?? Position.Left;
  return (
    <>
      <Handle type="target" position={targetPos} className={`${s.handleDot} !border-2 !border-white !w-2.5 !h-2.5`} />
      <div className={`w-[180px] h-[70px] border-[1.5px] ${s.borderColor} ${s.bg} rounded-[10px] shadow-sm flex flex-col items-center justify-center gap-1`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-gray-900 font-semibold text-[13px]">{data.label as string}</span>
        </div>
        <span className={`font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-px rounded-[3px] ${s.badge}`}>
          {data.group as string}
        </span>
      </div>
      <Handle type="source" position={sourcePos} className={`${s.handleDot} !border-2 !border-white !w-2.5 !h-2.5`} />
    </>
  );
}

const nodeTypes = { stateNode: StateNode };

// ─── Build nodes / edges ──────────────────────────────────────────────────────

function buildElements(workflow: Workflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = workflow.statuses.map((s) => ({
    id: String(s.id), type: "stateNode",
    position: { x: s.x ?? 0, y: s.y ?? 0 },
    data: { label: s.name, group: s.group, color: s.color, positionSaved: s.x != null && s.y != null },
  }));
  const edges: Edge[] = workflow.transitions.map((t, i) => ({
    id: `e-${i}`, source: String(t.from.id), target: String(t.to.id),
    type: ConnectionLineType.SmoothStep, animated: true, label: t.name,
    labelStyle:          { fontFamily: "monospace", fontSize: 10, fill: "#6366f1", letterSpacing: "0.06em" },
    labelBgStyle:        { fill: "#eef2ff", fillOpacity: 1 },
    labelBgPadding:      [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    data: { validators: t.validator ?? [], postFunctions: t.postFunctions ?? [], transitionName: t.name },
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
    <div className="absolute top-3 right-3 z-10 bg-white border border-gray-200 rounded-[10px] px-[18px] py-4 w-64 shadow-lg">
      <div className="flex justify-between items-start mb-3.5">
        <div>
          <div className="font-mono text-[9px] text-indigo-500 tracking-[0.15em] uppercase mb-[3px]">Transition</div>
          <div className="text-gray-900 font-bold text-sm">{edge.data?.transitionName as string ?? edge.label as string}</div>
          <div className="font-mono text-[10px] text-gray-400 mt-0.5">{edge.source} → {edge.target}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 bg-transparent border-none cursor-pointer text-lg leading-none p-0 mt-0.5">✕</button>
      </div>
      <Section label="Validators">
        {validators.length > 0 ? validators.map((v, i) => <Chip key={i} label={shortName(v)} variant="validator" />) : <EmptyChip />}
      </Section>
      <Section label="Post Functions" className="mt-3">
        {postFunctions.length > 0 ? postFunctions.map((f, i) => <Chip key={i} label={shortName(f)} variant="postfn" />) : <EmptyChip />}
      </Section>
    </div>
  );
}

function Section({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="font-mono text-[9px] text-gray-400 uppercase tracking-[0.12em] mb-1.5">{label}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Chip({ label, variant }: { label: string; variant: "validator" | "postfn" }) {
  const isV = variant === "validator";
  return (
    <div className={`font-mono text-[10px] rounded px-2 py-[3px] flex items-center gap-[5px] border ${
      isV ? "text-amber-600 bg-amber-100 border-amber-200" : "text-violet-600 bg-violet-100 border-violet-200"
    }`}>
      <span className="opacity-50 text-[9px]">{isV ? "V" : "F"}</span>
      {label}
    </div>
  );
}

function EmptyChip() {
  return <div className="font-mono text-[10px] text-gray-300">— none</div>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDirty,      setIsDirty]      = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Keep a ref to nodes so onSave can read current positions without a stale closure
  const nodesRef = useRef<Node[]>(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // ── Queries / mutations ───────────────────────────────────────────────────
  const { data: workflow, isLoading }  = useWorkflow(id);
  const updateMutation                 = useUpdateWorkflow();
  const saving                         = updateMutation.isPending;

  // Initialise ReactFlow when workflow data arrives (or changes)
  useEffect(() => {
    if (!workflow) return;
    const { nodes: n, edges: e } = buildElements(workflow);
    const { nodes: ln, edges: le } = getLayoutedElements(n, e, "LR");
    setNodes(ln);
    setEdges(le);
  }, [workflow, setNodes, setEdges]);

  const onConnect     = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);
  const onEdgeClick   = useCallback((_: React.MouseEvent, edge: Edge) => setSelectedEdge(edge), []);
  const onNodeDragStop = useCallback(() => setIsDirty(true), []);

  const onSave = useCallback(async () => {
    if (!id || !workflow) return;
    const currentNodes = nodesRef.current;
    const statuses = workflow.statuses.map((s) => {
      const node = currentNodes.find((n) => n.id === String(s.id));
      return { id: s.id, name: s.name, color: s.color, group: s.group, x: Math.round(node?.position.x ?? s.x ?? 0), y: Math.round(node?.position.y ?? s.y ?? 0) };
    });
    const transitions = workflow.transitions.map((t) => ({
      name: t.name, from: t.from.id, to: t.to.id,
      validator: t.validator ?? [], postFunctions: t.postFunctions ?? [],
    }));
    try {
      await updateMutation.mutateAsync({ id: workflow.id, name: workflow.name, statuses, transitions });
      setIsDirty(false);
      messageApi.success("Layout saved");
    } catch {
      messageApi.error("Failed to save layout");
    }
  }, [id, workflow, updateMutation, messageApi]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <div className="text-center py-20"><Spin size="large" /></div>;
  if (!workflow) return <span className="text-red-500">Workflow not found.</span>;

  return (
    <>
      {contextHolder}
      <div className="flex flex-col h-full">
        <div className="pt-3 pb-4 flex items-end justify-between">
          <div>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate("/settings")} className="!pl-0 !mb-2">
              Back to Settings
            </Button>
            <Title level={3} className="!m-0">{workflow.name}</Title>
          </div>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!isDirty} onClick={onSave}>
            Save Layout
          </Button>
        </div>

        <div className="flex-1 min-h-[520px] rounded-xl overflow-hidden border border-gray-200 relative shadow-sm">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onEdgeClick={onEdgeClick}
            onPaneClick={() => setSelectedEdge(null)} onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes} connectionLineType={ConnectionLineType.SmoothStep}
            fitView fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }} className="bg-slate-50"
          >
            <Controls className="bg-white border border-gray-200 shadow-sm" />
            <MiniMap nodeColor={(n) => DOT_COLORS[n.data?.group as string] ?? "#9ca3af"} className="bg-white border border-gray-200" />
            {isDirty && (
              <Panel position="top-right">
                <div className="bg-amber-50 border border-amber-200 rounded px-2.5 py-[5px] font-mono text-[10px] text-amber-600">
                  Unsaved changes
                </div>
              </Panel>
            )}
          </ReactFlow>
          <DetailPanel edge={selectedEdge} onClose={() => setSelectedEdge(null)} />
        </div>
      </div>
    </>
  );
}
