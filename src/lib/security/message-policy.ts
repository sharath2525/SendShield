import { getCompiledTransactionMessageDecoder, getCompiledTransactionMessageEncoder, type Transaction } from '@solana/kit';

/** Compare resolved instruction semantics, preserving the exact fee/lifetime policy.
 * No wallet-added programs (including unreviewed compute-budget fees) are permitted.
 */
export function assertReviewedMessage(expected: Transaction, received: Transaction) {
  const decode = (tx: Transaction) => {
    const message = getCompiledTransactionMessageDecoder().decode(tx.messageBytes);
    const canonical = getCompiledTransactionMessageEncoder().encode(message);
    if (canonical.length !== tx.messageBytes.length || canonical.some((b, i) => b !== tx.messageBytes[i])) throw new Error('Noncanonical wallet message');
    if (message.version !== 0 || message.addressTableLookups?.length) throw new Error('Unsupported wallet message or address lookups');
    return {
      version: message.version, lifetime: message.lifetimeToken,
      payer: message.staticAccounts[0], header: message.header,
      accounts: message.staticAccounts.map((key, i) => ({ key,
        signer: i < message.header.numSignerAccounts,
        writable: i < message.header.numSignerAccounts
          ? i < message.header.numSignerAccounts - message.header.numReadonlySignerAccounts
          : i < message.staticAccounts.length - message.header.numReadonlyNonSignerAccounts,
      })).sort((a, b) => a.key.localeCompare(b.key)),
      instructions: message.instructions.map(ix => ({ program: message.staticAccounts[ix.programAddressIndex],
        accounts: ix.accountIndices?.map(i => message.staticAccounts[i]), data: Array.from(ix.data ?? []),
      })),
    };
  };
  if (JSON.stringify(decode(expected)) !== JSON.stringify(decode(received))) throw new Error('Wallet changed the reviewed transaction semantics. Extra instructions, fee changes and changed recipients require a new review.');
}
