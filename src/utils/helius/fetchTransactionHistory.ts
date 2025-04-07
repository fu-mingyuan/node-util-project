import { LAMPORTS_PER_SOL, PublicKey, type TransactionError } from "@solana/web3.js";
import HeliusClient from "@/utils/helius/heliusClient";

export interface SignaturesInfo {
  blockTime: number;
  confirmationStatus: string;
  err: string;
  memo: string;
  signature: string;
  slot: number;
}

export interface TransactionInfo {
  signature: string;
  from: string;
  to: string;
  amount: number;
  memo: string | undefined;
  status: string;
  blockTime: number;
  sol: number;
  err: TransactionError | null;
}

/**
 * 根据签名信息查询交易详情
 * @param signaturesInfo[] 签名数据
 * @param splTokenMint  过滤条件
 */
export const fetchTransactionHistory = async (
  signaturesInfo: SignaturesInfo[],
  splTokenMint?: PublicKey,
): Promise<TransactionInfo[]> => {
  try {
    const signaturesMemoMap = new Map(signaturesInfo.map((item) => [item.signature, item.memo]));
    const signaturesAddresses = signaturesInfo.map((address) => address.signature);

    const heliusClient = HeliusClient.getInstance();
    const parseTransactionsResponse = await heliusClient.parseTransactions({
      transactions: signaturesAddresses,
    });

    const filteredTransactions = splTokenMint
      ? parseTransactionsResponse.filter((tx) => {
          // 筛选数据，只保留 K 币交易数据(mint === KGOLD_MINT_ADDRESS ) 且有效交易数据(有交易金额的：tokenBalanceChanges.length > 0)
          return tx.accountData.some(
            (account) =>
              account.tokenBalanceChanges &&
              account.tokenBalanceChanges.length > 0 &&
              account.tokenBalanceChanges.some((change) => change.mint === splTokenMint.toBase58()),
          );
        })
      : parseTransactionsResponse;

    return filteredTransactions.map((tx) => {
      const status = tx.transactionError ? "FAILED" : "SUCCESS";
      const blockTime = tx.timestamp;
      const sol = tx.fee / LAMPORTS_PER_SOL;
      const memo = signaturesMemoMap.get(tx.signature);
      const err = tx.transactionError || null;

      const { from, to, amount } = tx.accountData.reduce(
        (acc, account) => {
          account.tokenBalanceChanges?.forEach((change) => {
            const tokenAmount = BigInt(change.rawTokenAmount.tokenAmount);
            if (tokenAmount < 0) {
              acc.from = change.userAccount;
            } else if (tokenAmount > 0) {
              acc.to = change.userAccount;
              acc.amount = Number(change.rawTokenAmount.tokenAmount) / LAMPORTS_PER_SOL;
            }
          });
          return acc;
        },
        { from: "", to: "", amount: 0 },
      );

      return { signature: tx.signature, from, to, amount, memo, status, blockTime, sol, err };
    });
  } catch (error) {
    throw new Error(`parseTransactions: ${error}`);
  }
};
