import { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button, Spin, Typography, message, Modal, Form, Input, Select, Popconfirm,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import {
  ReactFlow, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, Handle, Position, Panel,
  ConnectionLineType,
  type Node, type Edge, type Connection, type NodeProps,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import type { Workflow, WorkflowStatus, FunctionResponse } from "../api/types";
import { useWorkflow, useUpdateWorkflow, useValidators, usePostFunctions } from "../hooks/useWorkflows";
import { useStatuses } from "../hooks/useTickets";

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

function StateNode({ data, id }: NodeProps) {
  const s         = GROUP_STYLES[data.group as string] ?? fallbackStyle;
  const sourcePos = (data.sourcePosition as Position) ?? Position.Right;
  const targetPos = (data.targetPosition as Position) ?? Position.Left;
  const onDelete  = data.onDelete as ((id: string) => void) | undefined;
  return (
    <>
      <Handle type="target" position={targetPos} className={`${s.handleDot} !border-2 !border-white !w-2.5 !h-2.5`} />
      <div className={`relative w-[180px] h-[70px] border-[1.5px] ${s.borderColor} ${s.bg} rounded-[10px] shadow-sm flex flex-col items-center justify-center gap-1`}>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="absolute top-1 right-1.5 text-gray-300 hover:text-red-400 bg-transparent border-none cursor-pointer text-[11px] leading-none p-0 transition-colors"
          >
            ✕
          </button>
        )}
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

// ─── Build nodes / edges from server data ─────────────────────────────────────

function buildElements(workflow: Workflow, onDelete: (id: string) => void): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = workflow.statuses.map((s) => ({
    id: String(s.id), type: "stateNode",
    position: { x: s.x ?? 0, y: s.y ?? 0 },
    data: { label: s.name, group: s.group, color: s.color, positionSaved: s.x != null && s.y != null, onDelete },
  }));
  const edges: Edge[] = workflow.transitions.map((t, i) => makeEdge(`e-${i}`, String(t.from.id), String(t.to.id), t.name, t.validator ?? [], t.postFunctions ?? []));
  return { nodes, edges };
}

function makeEdge(id: string, source: string, target: string, name: string, validators: string[], postFunctions: string[]): Edge {
  return {
    id, source, target,
    type: ConnectionLineType.SmoothStep, animated: true, label: name,
    labelStyle:          { fontFamily: "monospace", fontSize: 10, fill: "#6366f1", letterSpacing: "0.06em" },
    labelBgStyle:        { fill: "#eef2ff", fillOpacity: 1 },
    labelBgPadding:      [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    data: { validators, postFunctions, transitionName: name },
  };
}

// ─── Detail Panel (editable) ──────────────────────────────────────────────────

function DetailPanel({
  edge, availableValidators, availablePostFunctions, onClose, onUpdate, onDelete,
}: {
  edge: Edge | null;
  availableValidators:    FunctionResponse[];
  availablePostFunctions: FunctionResponse[];
  onClose:  () => void;
  onUpdate: (edgeId: string, name: string, validators: string[], postFunctions: string[]) => void;
  onDelete: (edgeId: string) => void;
}) {
  const [name,      setName]      = useState("");
  const [vals,      setVals]      = useState<string[]>([]);
  const [postFns,   setPostFns]   = useState<string[]>([]);

  useEffect(() => {
    if (!edge) return;
    setName((edge.data?.transitionName as string) ?? (edge.label as string) ?? "");
    setVals((edge.data?.validators    as string[]) ?? []);
    setPostFns((edge.data?.postFunctions as string[]) ?? []);
  }, [edge?.id]);

  if (!edge) return null;

  const shortName = (s: string) => s.includes(".") ? s.split(".").pop()! : s;

  return (
    <div
      className="absolute top-3 right-3 z-10 rounded-[10px] px-[18px] py-4 w-72 shadow-lg flex flex-col gap-3 border"
      style={{ background: "var(--dark)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex justify-between items-start">
        <div
          className="font-mono text-[9px] tracking-[0.15em] uppercase"
          style={{ color: "var(--neon-yellow)" }}
        >
          Transition
        </div>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-lg leading-none p-0"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>

      <div>
        <div
          className="font-mono text-[9px] uppercase tracking-[0.12em] mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Name
        </div>
        <Input
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Transition name"
        />
      </div>

      <div>
        <div
          className="font-mono text-[9px] uppercase tracking-[0.12em] mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Validators
        </div>
        <Select
          mode="multiple"
          size="small"
          className="w-full"
          value={vals}
          onChange={setVals}
          placeholder="Add validators"
          options={availableValidators.map((v) => ({ label: v.name, value: v.value }))}
          optionRender={(opt) => (
            <span className="font-mono text-[11px]" style={{ color: "var(--neon-yellow)" }}>
              {shortName(opt.value as string)}
            </span>
          )}
          tagRender={({ label, closable, onClose: onTagClose }) => (
            <span
              className="font-mono text-[10px] rounded px-1.5 py-px mr-1 flex items-center gap-1 border"
              style={{ color: "var(--neon-yellow)", background: "rgba(0,207,255,0.1)", borderColor: "var(--border-subtle)" }}
            >
              <span className="opacity-50 text-[9px]">V</span>{label}
              {closable && <span onClick={onTagClose} className="cursor-pointer opacity-50 hover:opacity-100">✕</span>}
            </span>
          )}
        />
      </div>

      <div>
        <div
          className="font-mono text-[9px] uppercase tracking-[0.12em] mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Post Functions
        </div>
        <Select
          mode="multiple"
          size="small"
          className="w-full"
          value={postFns}
          onChange={setPostFns}
          placeholder="Add post functions"
          options={availablePostFunctions.map((f) => ({ label: f.name, value: f.value }))}
          optionRender={(opt) => (
            <span className="font-mono text-[11px]" style={{ color: "var(--neon-cyan)" }}>
              {shortName(opt.value as string)}
            </span>
          )}
          tagRender={({ label, closable, onClose: onTagClose }) => (
            <span
              className="font-mono text-[10px] rounded px-1.5 py-px mr-1 flex items-center gap-1 border"
              style={{ color: "var(--neon-cyan)", background: "rgba(0,245,196,0.1)", borderColor: "rgba(0,245,196,0.25)" }}
            >
              <span className="opacity-50 text-[9px]">F</span>{label}
              {closable && <span onClick={onTagClose} className="cursor-pointer opacity-50 hover:opacity-100">✕</span>}
            </span>
          )}
        />
      </div>

      <div
        className="flex justify-between items-center pt-1 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Popconfirm title="Remove this transition?" onConfirm={() => onDelete(edge.id)} okText="Remove" okButtonProps={{ danger: true }}>
          <Button size="small" danger type="text">Remove</Button>
        </Popconfirm>
        <Button size="small" type="primary" onClick={() => onUpdate(edge.id, name, vals, postFns)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDirty,      setIsDirty]      = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Pending connection waiting for a name
  const [pendingConn,      setPendingConn]      = useState<Connection | null>(null);
  const [transitionName,   setTransitionName]   = useState("");

  // Add-status picker
  const [addStatusOpen, setAddStatusOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: workflow, isLoading }           = useWorkflow(id);
  const { data: allStatuses = [] }              = useStatuses();
  const { data: availableValidators = [] }      = useValidators();
  const { data: availablePostFunctions = [] }   = usePostFunctions();
  const updateMutation                          = useUpdateWorkflow();
  const saving                                  = updateMutation.isPending;

  // ── Node delete callback (stable ref so we don't recreate nodes on re-render)
  const onDeleteNodeRef = useRef<(id: string) => void>(() => {});
  const onDeleteNode = useCallback((nodeId: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== nodeId));
    setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedEdge((sel) => (sel?.source === nodeId || sel?.target === nodeId) ? null : sel);
    setIsDirty(true);
  }, [setNodes, setEdges]);
  onDeleteNodeRef.current = onDeleteNode;

  // ── Initialise canvas when workflow loads ─────────────────────────────────
  useEffect(() => {
    if (!workflow) return;
    const deleteWrapper = (id: string) => onDeleteNodeRef.current(id);
    const { nodes: n, edges: e } = buildElements(workflow, deleteWrapper);
    const { nodes: ln, edges: le } = getLayoutedElements(n, e, "LR");
    setNodes(ln);
    setEdges(le);
  }, [workflow, setNodes, setEdges]);

  // ── Connection → ask for name ─────────────────────────────────────────────
  const onConnect = useCallback((c: Connection) => {
    setPendingConn(c);
    setTransitionName("");
  }, []);

  const onConfirmTransition = useCallback(() => {
    if (!pendingConn || !transitionName.trim()) return;
    const edge = makeEdge(`e-${Date.now()}`, pendingConn.source!, pendingConn.target!, transitionName.trim(), [], []);
    setEdges((eds) => addEdge(edge, eds));
    setPendingConn(null);
    setIsDirty(true);
  }, [pendingConn, transitionName, setEdges]);

  // ── Edge click → open detail panel ───────────────────────────────────────
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => setSelectedEdge(edge), []);

  // ── Update edge data from detail panel ────────────────────────────────────
  const onUpdateEdge = useCallback((edgeId: string, name: string, validators: string[], postFunctions: string[]) => {
    setEdges((eds) => eds.map((e) => e.id !== edgeId ? e : {
      ...e, label: name,
      data: { ...e.data, transitionName: name, validators, postFunctions },
    }));
    setSelectedEdge((sel) => sel?.id !== edgeId ? sel : {
      ...sel!, label: name,
      data: { ...sel!.data, transitionName: name, validators, postFunctions },
    });
    setIsDirty(true);
  }, [setEdges]);

  // ── Delete edge from detail panel ─────────────────────────────────────────
  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
    setIsDirty(true);
  }, [setEdges]);

  const onNodeDragStop = useCallback(() => setIsDirty(true), []);

  // ── Add status to canvas ──────────────────────────────────────────────────
  const statusesInCanvas = new Set(nodes.map((n) => Number(n.id)));
  const addableStatuses  = allStatuses.filter((s) => !statusesInCanvas.has(s.id));

  const onAddStatus = useCallback((status: WorkflowStatus) => {
    const newNode: Node = {
      id: String(status.id), type: "stateNode",
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 },
      data: {
        label: status.name, group: status.group, color: status.color,
        positionSaved: false,
        onDelete: (id: string) => onDeleteNodeRef.current(id),
      },
    };
    setNodes((ns) => [...ns, newNode]);
    setIsDirty(true);
    setAddStatusOpen(false);
  }, [setNodes]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const onSave = useCallback(async () => {
    if (!id || !workflow) return;
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const statuses = currentNodes.map((n) => ({
      id:    Number(n.id),
      name:  n.data.label  as string,
      color: n.data.color  as string,
      group: n.data.group  as string,
      x:     Math.round(n.position.x),
      y:     Math.round(n.position.y),
    }));

    const transitions = currentEdges.map((e) => ({
      name:          (e.data?.transitionName as string) ?? (e.label as string) ?? "",
      from:          Number(e.source),
      to:            Number(e.target),
      validator:     (e.data?.validators    as string[]) ?? [],
      postFunctions: (e.data?.postFunctions as string[]) ?? [],
    }));

    try {
      await updateMutation.mutateAsync({ id: workflow.id, name: workflow.name, statuses, transitions });
      setIsDirty(false);
      messageApi.success("Workflow saved");
    } catch {
      messageApi.error("Failed to save workflow");
    }
  }, [id, workflow, updateMutation, messageApi]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <div className="text-center py-20"><Spin size="large" /></div>;
  if (!workflow)  return <span className="text-red-500">Workflow not found.</span>;

  return (
    <>
      {contextHolder}

      {/* Transition name modal */}
      <Modal
        title="New Transition"
        open={pendingConn !== null}
        onOk={onConfirmTransition}
        onCancel={() => setPendingConn(null)}
        okText="Add"
        okButtonProps={{ disabled: !transitionName.trim() }}
      >
        <Form layout="vertical" className="mt-3">
          <Form.Item label="Transition Name" required>
            <Input
              value={transitionName}
              onChange={(e) => setTransitionName(e.target.value)}
              onPressEnter={onConfirmTransition}
              placeholder="e.g. Send to Finance"
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add status modal */}
      <Modal
        title="Add Status to Workflow"
        open={addStatusOpen}
        onCancel={() => setAddStatusOpen(false)}
        footer={null}
      >
        {addableStatuses.length === 0 ? (
          <p className="text-gray-400 text-sm">All statuses are already in this workflow.</p>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {addableStatuses.map((s) => (
              <button
                key={s.id}
                onClick={() => onAddStatus(s)}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer bg-white text-left transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
                <span className="text-sm font-medium text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-400 font-mono ml-auto">{s.group}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <div className="flex flex-col h-full">
        <div className="pt-3 pb-4 flex items-end justify-between">
          <div>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate("/settings")} className="!pl-0 !mb-2">
              Back to Settings
            </Button>
            <Title level={3} className="!m-0">{workflow.name}</Title>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<PlusOutlined />} onClick={() => setAddStatusOpen(true)}>
              Add Status
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!isDirty} onClick={onSave}>
              Save
            </Button>
          </div>
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
              <Panel position="top-left">
                <div className="bg-amber-50 border border-amber-200 rounded px-2.5 py-[5px] font-mono text-[10px] text-amber-600">
                  Unsaved changes
                </div>
              </Panel>
            )}
          </ReactFlow>

          <DetailPanel
            edge={selectedEdge}
            availableValidators={availableValidators}
            availablePostFunctions={availablePostFunctions}
            onClose={() => setSelectedEdge(null)}
            onUpdate={onUpdateEdge}
            onDelete={onDeleteEdge}
          />
        </div>
      </div>
    </>
  );
}
