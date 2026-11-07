import { AdviceInput, AdviceResponse, EvaluateAdviceInput } from './advice';
import { defineEndpoint } from './endpoint';
import { HealthStatus } from './health';
import { CreateLeadInput, Lead, LeadList } from './leads';
import { SchemeList } from './schemes';
import { RingVoiceInput, RingVoiceResponse, VoiceCall } from './voice';

/**
 * The endpoint registry — the single list of everything web and API agree on.
 * Rules (docs/API_CONTRACTS.md): an endpoint must be here before anyone implements or calls it;
 * IDs never change or get reused; additive changes are cheap, breaking changes need all three devs.
 */
export const endpoints = {
  ringVoiceCall: defineEndpoint({
    id: 'C-08',
    method: 'POST',
    path: '/api/voice/ring',
    auth: false,
    summary: 'Ring an allowlisted demo mobile (HTTP 201); rate limited by the API',
    request: RingVoiceInput,
    response: RingVoiceResponse,
  }),
  getVoiceCall: defineEndpoint({
    id: 'C-09',
    method: 'GET',
    path: '/api/voice/calls/:callSid',
    auth: false,
    summary: 'Poll an in-memory voice call; unknown call returns NOT_FOUND',
    response: VoiceCall,
  }),
  advice: defineEndpoint({
    id: 'C-03',
    method: 'POST',
    path: '/api/advice',
    auth: false,
    summary: 'Extract a farm profile, evaluate scheme rules and explain the results',
    request: AdviceInput,
    response: AdviceResponse,
  }),
  evaluateAdvice: defineEndpoint({
    id: 'C-04',
    method: 'POST',
    path: '/api/advice/evaluate',
    auth: false,
    summary: 'Re-evaluate an edited profile without calling an LLM',
    request: EvaluateAdviceInput,
    response: AdviceResponse,
  }),
  listSchemes: defineEndpoint({
    id: 'C-05',
    method: 'GET',
    path: '/api/schemes',
    auth: false,
    summary: 'List scheme criteria and sources',
    response: SchemeList,
  }),
  createLead: defineEndpoint({
    id: 'C-06',
    method: 'POST',
    path: '/api/leads',
    auth: false,
    summary: 'Save a consented forester lead (HTTP 201)',
    request: CreateLeadInput,
    response: Lead,
  }),
  listLeads: defineEndpoint({
    id: 'C-07',
    method: 'GET',
    path: '/api/leads',
    auth: false,
    summary: 'List forester leads, newest first (local demo only)',
    response: LeadList,
  }),
  health: defineEndpoint({
    id: 'C-00',
    method: 'GET',
    path: '/api/health',
    auth: false,
    summary: 'Liveness and database check',
    response: HealthStatus,
  }),
} as const;

export type Endpoints = typeof endpoints;
export type EndpointName = keyof Endpoints;
