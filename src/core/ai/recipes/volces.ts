import type { Recipe } from '../types.ts';

/**
 * Volcano Engine Ark (火山方舟) Coding Plan. OpenAI-compatible endpoint at
 * ark.cn-beijing.volces.com. Hosts doubao-embedding-vision (2048d) for
 * embedding and GLM-5.1 for chat under a single ARK_API_KEY.
 *
 * doubao-embedding-vision returns 2048-dim vectors, which exceeds pgvector's
 * HNSW cap of PGVECTOR_HNSW_VECTOR_MAX_DIMS=2000 — those brains fall back to
 * exact vector scans. Not Matryoshka-aware, so the dimension cannot be
 * shrunk; users who need HNSW must pick a different embedding model.
 *
 * Reference: https://www.volcengine.com/docs/82379
 */
export const volces: Recipe = {
  id: 'volces',
  name: 'Volcano Engine Ark (火山方舟 Coding Plan)',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://ark.cn-beijing.volces.com/api/coding/v3',
  auth_env: {
    required: ['ARK_API_KEY'],
    setup_url: 'https://www.volcengine.com/docs/82379',
  },
  touchpoints: {
    embedding: {
      models: ['doubao-embedding-vision'],
      default_dims: 2048,
      // No Matryoshka; doubao-embedding-vision is fixed at 2048. HNSW will
      // fall back to exact scan (pgvector cap 2000).
      // Ark hard caps embeddings at 10 inputs per request (a count limit, not
      // a token limit). max_batch_count enforces that cap; max_batch_tokens
      // keeps the token total in check independently. The existing
      // isTokenLimitError regex does not match Ark's "input limit exceeded:
      // max 10, got N" wording, so recursive-halving cannot recover a miss —
      // both caps below must hold on their own.
      max_batch_tokens: 8000,
      max_batch_count: 10,
      // doubao tokenizer is CJK-dense like dashscope; conservative
      // chars_per_token=2 leaves headroom.
      chars_per_token: 2,
    },
    expansion: {
      // GLM-5.1 rejects response_format=json_object. doubao-seed-2-0-mini
      // honors it under the Coding Plan and is the preferred expansion model.
      models: ['doubao-seed-2-0-mini-260428', 'GLM-5.1'],
    },
    chat: {
      models: ['GLM-5.1'],
      supports_tools: true,
      supports_subagent_loop: true,
      supports_prompt_cache: false,
      max_context_tokens: 128000,
    },
  },
  setup_hint:
    'Subscribe to Ark Coding Plan at https://www.volcengine.com/docs/82379, then `export ARK_API_KEY=...`',
};
