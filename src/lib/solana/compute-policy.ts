import { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';
export const COMPUTE_PROGRAM = 'ComputeBudget111111111111111111111111111111';
export const COMPUTE_LIMIT = 20_000;
export const PRIORITY_PRICE = 0n;
export function computePolicyInstructions() {
  return [getSetComputeUnitLimitInstruction({ units: COMPUTE_LIMIT }), getSetComputeUnitPriceInstruction({ microLamports: PRIORITY_PRICE })] as const;
}
