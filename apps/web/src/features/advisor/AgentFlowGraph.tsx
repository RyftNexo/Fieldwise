import type { AdviceResponse } from '@app/shared';
import { Background, type Edge, MarkerType, type Node, Position, ReactFlow } from '@xyflow/react';
import { Check, Circle, LoaderCircle } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Pill } from '@/components/ui/Badge';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  type AgentNodeId,
  type AgentNodeStatus,
  agentEdgeStatus,
  agentNodeStatuses,
  SCHEME_DATASETS,
  SCHEME_STEP_MS,
} from './agentFlow';
import { PIPELINE_STAGES, type PipelineStage, type Stage } from './pipeline';

const PANEL_ID = 'agent-flow-step-data';

const STEP_INFO: Record<PipelineStage, { label: string; ai: boolean }> = {
  extract: { label: 'Understand', ai: true },
  rules: { label: 'Scheme rules', ai: false },
  explain: { label: 'Explain', ai: true },
};

const FLOW_POSITIONS: Record<AgentNodeId, { x: number; y: number }> = {
  farmer: { x: 0, y: 202 },
  understand: { x: 205, y: 202 },
  profile: { x: 410, y: 202 },
  ntas: { x: 625, y: 0 },
  anc: { x: 625, y: 82 },
  biss: { x: 625, y: 164 },
  acres: { x: 625, y: 246 },
  scis: { x: 625, y: 328 },
  awnss: { x: 625, y: 410 },
  explain: { x: 845, y: 202 },
  report: { x: 1050, y: 202 },
};

const EDGE_PAIRS: ReadonlyArray<readonly [AgentNodeId, AgentNodeId]> = [
  ['farmer', 'understand'],
  ['understand', 'profile'],
  ...SCHEME_DATASETS.map((scheme) => ['profile', scheme.id] as const),
  ...SCHEME_DATASETS.map((scheme) => [scheme.id, 'explain'] as const),
  ['explain', 'report'],
];

const STATUS_LABEL: Record<AgentNodeStatus, string> = {
  pending: 'Waiting',
  active: 'Working',
  done: 'Done',
};

type AgentFlowNode = Node<{ label: ReactNode }>;

export function AgentFlowGraph({
  stage,
  advice,
  question,
}: {
  stage: Stage;
  advice?: AdviceResponse;
  question: string;
}) {
  const [activeScheme, setActiveScheme] = useState(0);
  const [openStep, setOpenStep] = useState<PipelineStage | null>(null);

  useEffect(() => {
    if (stage !== 'rules') return;
    setActiveScheme(0);
    const timer = window.setInterval(() => {
      setActiveScheme((current) => {
        if (current >= SCHEME_DATASETS.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, SCHEME_STEP_MS);
    return () => window.clearInterval(timer);
  }, [stage]);

  const statuses = useMemo(() => agentNodeStatuses(stage, activeScheme), [stage, activeScheme]);
  const nodes = useMemo(() => buildNodes(statuses, question, advice), [statuses, question, advice]);
  const edges = useMemo(() => buildEdges(statuses), [statuses]);
  const steps = stage === 'done' ? advice?.steps : undefined;

  return (
    <section aria-labelledby="agent-flow-heading" className={cardClasses('surface', 'p-5 sm:p-6')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold tracking-wider text-brand-600 uppercase">Agent flow</p>
          <h2 id="agent-flow-heading" className="mt-1 text-xl font-semibold text-brand-900">
            How your report is being built
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-soil-600" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-harvest-400" /> Working
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand-600" /> Complete
          </span>
        </div>
      </div>

      <AgentFlowList statuses={statuses} />

      <div
        className="agent-flow mt-5 hidden h-[34rem] overflow-hidden rounded-2xl border border-brand-100 bg-cream-50 md:block"
        aria-hidden="true"
      >
        <ReactFlow<AgentFlowNode, Edge>
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.08, minZoom: 0.64, maxZoom: 1 }}
          minZoom={0.55}
          maxZoom={1.4}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll
        >
          <Background color="var(--color-brand-100)" gap={24} size={1} />
        </ReactFlow>
      </div>

      {steps && (
        <div className="mt-5 border-t border-soil-100 pt-5">
          <p className="text-sm font-semibold text-soil-700">
            Inspect what passed through each stage
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((step) => {
              const info = STEP_INFO[step];
              const isOpen = openStep === step;
              return (
                <button
                  key={step}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={PANEL_ID}
                  onClick={() => setOpenStep(isOpen ? null : step)}
                  className={cn(
                    'focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                    isOpen
                      ? 'border-brand-300 bg-brand-50 text-brand-900'
                      : 'border-soil-200 bg-white text-soil-700 hover:border-brand-200 hover:bg-brand-50',
                  )}
                >
                  {isOpen ? 'Hide' : 'See'} {info.label.toLowerCase()} data
                  <Pill tone={info.ai ? 'ai' : 'code'}>{info.ai ? 'AI' : 'No AI'}</Pill>
                </button>
              );
            })}
          </div>
          {openStep && (
            <pre
              id={PANEL_ID}
              className="mt-4 max-h-80 overflow-auto rounded-2xl bg-brand-950 p-4 font-mono text-xs leading-relaxed text-brand-100"
            >
              {JSON.stringify(steps[openStep], null, 2)}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function buildNodes(
  statuses: Record<AgentNodeId, AgentNodeStatus>,
  question: string,
  advice?: AdviceResponse,
): AgentFlowNode[] {
  const definitions: Array<{
    id: AgentNodeId;
    title: string;
    detail: string;
    badge?: 'AI' | 'No AI';
    type?: 'input' | 'output';
  }> = [
    { id: 'farmer', title: 'Your words', detail: compact(question, 48), type: 'input' },
    { id: 'understand', title: 'Understand', detail: 'Turns speech into farm facts', badge: 'AI' },
    {
      id: 'profile',
      title: 'Farm profile',
      detail: advice
        ? `${advice.profile.hectares} ha · ${advice.profile.enterprise}`
        : 'Structured facts',
    },
    ...SCHEME_DATASETS.map((scheme) => ({
      id: scheme.id,
      title: scheme.label,
      detail: scheme.detail,
      badge: 'No AI' as const,
    })),
    { id: 'explain', title: 'Explain', detail: 'Writes from rule results only', badge: 'AI' },
    {
      id: 'report',
      title: 'Your report',
      detail: advice ? 'Ready below' : 'Grant cards and next steps',
      type: 'output',
    },
  ];

  return definitions.map((definition) => ({
    id: definition.id,
    position: FLOW_POSITIONS[definition.id],
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    type: definition.type,
    className: `agent-flow-node agent-flow-node--${statuses[definition.id]}`,
    data: {
      label: (
        <NodeLabel
          title={definition.title}
          detail={definition.detail}
          badge={definition.badge}
          status={statuses[definition.id]}
        />
      ),
    },
  }));
}

function buildEdges(statuses: Record<AgentNodeId, AgentNodeStatus>): Edge[] {
  return EDGE_PAIRS.map(([source, target]) => {
    const status = agentEdgeStatus(source, target, statuses);
    const color =
      status === 'active'
        ? 'var(--color-harvest-500)'
        : status === 'done'
          ? 'var(--color-brand-600)'
          : 'var(--color-soil-200)';
    return {
      id: `${source}-${target}`,
      source,
      target,
      animated: status === 'active',
      style: { stroke: color, strokeWidth: status === 'pending' ? 1.5 : 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
    };
  });
}

function NodeLabel({
  title,
  detail,
  badge,
  status,
}: {
  title: string;
  detail: string;
  badge?: 'AI' | 'No AI';
  status: AgentNodeStatus;
}) {
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <StatusIcon status={status} />
        <span className="font-display text-sm font-semibold text-brand-950">{title}</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-soil-600">{detail}</p>
      {badge && (
        <span
          className={cn(
            'mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold',
            badge === 'AI' ? 'bg-violet-100 text-violet-800' : 'bg-brand-100 text-brand-800',
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function AgentFlowList({ statuses }: { statuses: Record<AgentNodeId, AgentNodeStatus> }) {
  const items: Array<{ id: AgentNodeId; label: string }> = [
    { id: 'farmer', label: 'Your words' },
    { id: 'understand', label: 'Understand (AI)' },
    { id: 'profile', label: 'Farm profile' },
    ...SCHEME_DATASETS.map((scheme) => ({ id: scheme.id, label: `${scheme.label} rules` })),
    { id: 'explain', label: 'Explain (AI)' },
    { id: 'report', label: 'Your report' },
  ];
  return (
    <ol className="mt-5 grid gap-2 md:sr-only">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold',
            statuses[item.id] === 'done' && 'border-brand-200 bg-brand-50 text-brand-900',
            statuses[item.id] === 'active' &&
              'border-harvest-300 bg-harvest-50 text-harvest-900 motion-safe:animate-pulse',
            statuses[item.id] === 'pending' && 'border-soil-100 bg-soil-50 text-soil-500',
          )}
        >
          <StatusIcon status={statuses[item.id]} />
          <span className="flex-1">{item.label}</span>
          <span className="text-xs">{STATUS_LABEL[statuses[item.id]]}</span>
        </li>
      ))}
    </ol>
  );
}

function StatusIcon({ status }: { status: AgentNodeStatus }) {
  if (status === 'done') return <Check className="size-4 shrink-0 text-brand-700" aria-hidden />;
  if (status === 'active')
    return (
      <LoaderCircle
        className="size-4 shrink-0 text-harvest-700 motion-safe:animate-spin"
        aria-hidden
      />
    );
  return <Circle className="size-4 shrink-0 text-soil-300" aria-hidden />;
}

function compact(value: string, max: number): string {
  const clean = value.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}
