import { z } from 'zod';
import { getBase64Encoder } from '@solana/kit';
import type { Cluster } from '@/types';
import { parseAddress } from '@/lib/security/address-parser';
import { classifyAccount } from './classify';
import { assertCluster, rpcFor, rpcOptions } from './rpc';
const accountSchema = z.object({
  owner: z.string().transform(v => parseAddress(v).address), executable: z.boolean(),
  space: z.union([z.number().int().nonnegative(), z.bigint().nonnegative()]).transform(Number).refine(Number.isSafeInteger),
  data: z.union([z.tuple([z.string(), z.literal('base64')]), z.object({ parsed: z.object({ type: z.string() }), program: z.string(), space: z.union([z.number(), z.bigint()]) })]),
});
export async function inspectRecipient(input: string, network: Cluster) {
  let parsed: ReturnType<typeof parseAddress>;
  try { parsed = parseAddress(input); }
  catch (e) { return classifyAccount({ address: input, network, onCurve: null, error: 'INVALID', detail: (e as Error).message }); }
  try {
    await assertCluster(network);
    const response = await rpcFor(network).getAccountInfo(parsed.address, { encoding: 'jsonParsed', commitment: 'confirmed' }).send(rpcOptions());
    if (!response || !response.context || typeof response.context.slot !== 'bigint' || response.context.slot < 0n || !('value' in response)) throw new Error('Incomplete RPC response');
    const raw = response.value === null ? null : accountSchema.parse(response.value);
    if (raw) {
      if (Array.isArray(raw.data)) {
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw.data[0]) || getBase64Encoder().encode(raw.data[0]).length !== raw.space) throw new Error('Inconsistent account data size');
      } else if (Number(raw.data.space) !== raw.space) throw new Error('Inconsistent parsed account size');
    }
    const account = raw === null ? null : { owner: raw.owner, executable: raw.executable, space: raw.space,
      parsedType: !Array.isArray(raw.data) ? raw.data.parsed.type : undefined };
    return classifyAccount({ ...parsed, network, account, slot: String(response.context.slot) });
  } catch { return classifyAccount({ ...parsed, network, error: 'RPC_UNAVAILABLE' }); }
}
