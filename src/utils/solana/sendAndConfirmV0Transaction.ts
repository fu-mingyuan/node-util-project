import { BlockhashWithExpiryBlockHeight, Connection, VersionedTransaction, Keypair } from "@solana/web3.js";

interface SendAndConfirmOptions {
  connection: Connection;
  transaction: VersionedTransaction;
  signer: Keypair;
  maxRetries?: number;
  logPrefix?: string;
}

export const sendAndConfirmV0Transaction = async ({
  connection,
  transaction,
  signer,
  maxRetries = 2,
  logPrefix = "",
}: SendAndConfirmOptions): Promise<string> => {
  let retry = 0;

  while (retry <= maxRetries) {
    try {
      const latest: BlockhashWithExpiryBlockHeight = await connection.getLatestBlockhash("finalized");
      transaction.message.recentBlockhash = latest.blockhash;

      transaction.sign([signer]);

      const txId = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
      });

      console.log(`${logPrefix} 🚀 [Retry ${retry}] Transaction sent: ${txId}`);

      // 加超时机制
      await Promise.race([
        connection.confirmTransaction(
          {
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
            signature: txId,
          },
          "confirmed",
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${logPrefix} ⏱️ Transaction confirmation timeout`)), 15000),
        ),
      ]);

      console.log(`${logPrefix} ✅ Transaction confirmed: ${txId}`);
      return txId;
    } catch (err) {
      console.warn(`${logPrefix} ⚠️ [Retry ${retry}] Transaction failed:`, err);
      retry++;
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  throw new Error(`${logPrefix} ❌ Transaction failed after ${maxRetries} retries.`);
};
