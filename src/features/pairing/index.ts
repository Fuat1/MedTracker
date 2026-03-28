export {
  useGenerateInvite,
  useAcceptInvite,
  useRevokeRelationship,
  useRelationships,
  useUpdateSharingConfig,
  RELATIONSHIPS_QUERY_KEY,
} from './lib/use-pairing';
export type { GenerateInviteResult, UseRelationshipsResult } from './lib/use-pairing';
export { generateInviteCode, computeExpiresAt, isInviteValid, normalizeInviteCode } from './lib/invite-code';
