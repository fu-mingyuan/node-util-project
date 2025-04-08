import axios from "axios";
import { API_URLS, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { CONNECTION, TX_VERSION } from "@/utils/raydium/raydium.config";
import { Keypair, VersionedTransaction, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { fetchTokenAccountData } from "@/utils/raydium/raydiumClient";
import { NATIVE_MINT } from "@solana/spl-token";
import { simulate, SimulateResult, SwapParams } from "@/utils/raydium/cpmm/main/simulate";
import { sendAndConfirmV0Transaction } from "@/utils/solana/sendAndConfirmV0Transaction";

export const swap = async (owner: Keypair, { inputMint, outputMint, amount, swapType, slippage = 0.5 }: SwapParams) => {
  const simulateResult: SimulateResult | 0 = await simulate({ inputMint, outputMint, amount, swapType, slippage });

  if (simulateResult == 0 || !simulateResult?.raw) {
    return;
  }

  // 试算结果
  const swapResponse = simulateResult.raw;

  // get statistical transaction fee from api
  /**
   * vh: very high
   * h: high
   * m: medium
   */
  const { data } = await axios.get<{
    id: string;
    success: boolean;
    data: { default: { vh: number; h: number; m: number } };
  }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`);

  const [isInputSol, isOutputSol] = [
    inputMint.toBase58() === NATIVE_MINT.toBase58(),
    outputMint.toBase58() === NATIVE_MINT.toBase58(),
  ];

  const apiTrail = swapType === "BaseOut" ? "swap-base-out" : "swap-base-in";
  const txVersion = TX_VERSION === TxVersion.V0 ? "V0" : "LEGACY";
  const isV0Tx = txVersion === "V0";
  const { tokenAccounts } = await fetchTokenAccountData(owner.publicKey);
  const inputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === inputMint.toBase58())?.publicKey;
  const outputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === outputMint.toBase58())?.publicKey;

  const { data: swapTransactions } = await axios.post<{
    id: string;
    version: string;
    success: boolean;
    data: { transaction: string }[];
  }>(`${API_URLS.SWAP_HOST}/transaction/${apiTrail}`, {
    computeUnitPriceMicroLamports: String(data.data.default.h),
    swapResponse,
    txVersion,
    wallet: owner.publicKey.toBase58(),
    wrapSol: isInputSol,
    unwrapSol: isOutputSol, // true means output mint receive sol, false means output mint received wsol
    inputAccount: isInputSol ? undefined : inputTokenAcc?.toBase58(),
    outputAccount: isOutputSol ? undefined : outputTokenAcc?.toBase58(),
  });

  const allTxBuf = swapTransactions.data.map((tx) => Buffer.from(tx.transaction, "base64"));
  const allTransactions = allTxBuf.map((txBuf) =>
    isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf),
  );

  // console.log(`total ${allTransactions.length} transactions`, swapTransactions);

  let idx = 0;
  const txIds: string[] = [];

  if (!isV0Tx) {
    for (const tx of allTransactions) {
      console.log(`${++idx} transaction sending...`);
      const transaction = tx as Transaction;
      transaction.sign(owner);
      const txId = await sendAndConfirmTransaction(CONNECTION, transaction, [owner], { skipPreflight: true });
      console.log(`${++idx} transaction confirmed, txId: ${txId}`);
      txIds.push(txId);
    }
  } else {
    for (const [i, tx] of allTransactions.entries()) {
      const idx = i + 1;
      const transaction = tx as VersionedTransaction;

      const txId = await sendAndConfirmV0Transaction({
        connection: CONNECTION,
        transaction,
        signer: owner,
        maxRetries: 2,
        logPrefix: `[Tx ${idx}]`,
      });

      txIds.push(txId);
    }
  }

  return txIds;
};
