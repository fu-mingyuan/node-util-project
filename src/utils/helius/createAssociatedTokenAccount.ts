import { PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { retryRequest } from "@/utils/httpClients";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { fetchAccounts } from "@/utils/helius/fetchAccounts";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 创建 publicKey 的 ATA
 * @param owner publicKey
 * @param mint spl token
 */
export const createAssociatedTokenAccount = async (owner: PublicKey, mint: PublicKey): Promise<boolean> => {
  return await retryRequest(async () => {
    try {
      const tokenAccountsResponse = await fetchAccounts(owner);
      const hasMint: boolean | undefined = tokenAccountsResponse?.token_accounts?.some(
        (account) => account.mint === mint.toBase58(),
      );

      // 判断账户是否存在 K 币的 ATA
      if (hasMint) {
        return true;
      }

      // const feePayerKeypair = Keypair.fromSecretKey(Buffer.from(TRANSACTION_FEE_PAYER_PRIVATE_KEY, "hex"));

      const instructions: TransactionInstruction[] = [];
      const associatedTokenAccount = await fetchAssociatedTokenAddress(owner, mint);
      const createATAInstruction = createAssociatedTokenAccountIdempotentInstruction(
        owner, // 费用支付者
        associatedTokenAccount, // 新创建的 ATA 账户地址
        owner, // 该账户归接收者所有
        new PublicKey(mint), // mint publicKey
        TOKEN_2022_PROGRAM_ID, // Token-2022 代币程序 ID
        ASSOCIATED_TOKEN_PROGRAM_ID, // 关联账户程序 ID
      );
      instructions.push(createATAInstruction);

      const heliusClient = HeliusClient.getInstance();

      const recentBlockHash = await heliusClient.rpc.getLatestBlockhash();

      // 构建交易消息
      const messageV0 = new TransactionMessage({
        payerKey: owner,
        recentBlockhash: recentBlockHash.blockhash,
        instructions,
      }).compileToV0Message();

      const versionedTransaction = new VersionedTransaction(messageV0);

      // todo:
      // versionedTransaction.sign([feePayerKeypair]);

      // 发送交易
      const txSignature = await heliusClient.rpc.sendTransaction(versionedTransaction);
      const confirmedSignature = await heliusClient.rpc.pollTransactionConfirmation(txSignature);

      console.log("交易已成功确认:", confirmedSignature);
      return confirmedSignature === txSignature;
    } catch (error) {
      throw new Error(`parseTransactions: ${error}`);
    }
  }, "createAssociatedTokenAccount");
};
