import type { Stage } from './pipeline';

export const SCHEME_STEP_MS = 220;

export const SCHEME_DATASETS = [
  { id: 'ntas', label: 'NTAS', detail: 'Native trees' },
  { id: 'anc', label: 'ANC', detail: 'Constraint areas' },
  { id: 'biss', label: 'BISS', detail: 'Farm income' },
  { id: 'acres', label: 'ACRES', detail: 'Climate actions' },
  { id: 'scis', label: 'SCIS', detail: 'Solar investment' },
  { id: 'awnss', label: 'AWNSS', detail: 'Farm buildings' },
] as const;

/** A fast fixture response still leaves enough time for every dataset to light once. */
export const RULES_STAGE_MIN_MS = SCHEME_STEP_MS * SCHEME_DATASETS.length + 100;

export type SchemeNodeId = (typeof SCHEME_DATASETS)[number]['id'];
export type AgentNodeId = 'farmer' | 'understand' | 'profile' | SchemeNodeId | 'explain' | 'report';
export type AgentNodeStatus = 'pending' | 'active' | 'done';

export const AGENT_NODE_IDS: readonly AgentNodeId[] = [
  'farmer',
  'understand',
  'profile',
  ...SCHEME_DATASETS.map((scheme) => scheme.id),
  'explain',
  'report',
];

/** Turns the three API stages into the more detailed story shown by the agent graph. */
export function agentNodeStatuses(
  stage: Stage,
  activeScheme = 0,
): Record<AgentNodeId, AgentNodeStatus> {
  const statuses = Object.fromEntries(
    AGENT_NODE_IDS.map((id) => [id, 'pending'] as const),
  ) as Record<AgentNodeId, AgentNodeStatus>;

  if (stage === 'idle' || stage === 'error') return statuses;
  statuses.farmer = 'done';

  if (stage === 'extract') {
    statuses.understand = 'active';
    return statuses;
  }

  statuses.understand = 'done';
  statuses.profile = 'done';

  if (stage === 'rules') {
    const current = Math.max(0, Math.min(activeScheme, SCHEME_DATASETS.length - 1));
    SCHEME_DATASETS.forEach((scheme, index) => {
      if (index < current) statuses[scheme.id] = 'done';
      if (index === current) statuses[scheme.id] = 'active';
    });
    return statuses;
  }

  for (const scheme of SCHEME_DATASETS) statuses[scheme.id] = 'done';
  if (stage === 'explain') {
    statuses.explain = 'active';
    return statuses;
  }

  statuses.explain = 'done';
  statuses.report = 'done';
  return statuses;
}

export function agentEdgeStatus(
  source: AgentNodeId,
  target: AgentNodeId,
  statuses: Record<AgentNodeId, AgentNodeStatus>,
): AgentNodeStatus {
  if (statuses[target] === 'active') return 'active';
  if (statuses[source] === 'done' && statuses[target] === 'done') return 'done';
  return 'pending';
}
