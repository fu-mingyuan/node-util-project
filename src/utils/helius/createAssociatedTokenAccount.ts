import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { ACCOUNT_SIZE, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { fetchAccounts } from "@/utils/helius/fetchAccounts";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 创建 publicKey 的 ATA
 * @param senderKeypair
 * @param mint spl token
 */
export const createAssociatedTokenAccount = async (senderKeypair: Keypair, mint: PublicKey): Promise<boolean> => {
  try {
    const owner: PublicKey = senderKeypair.publicKey;
    const tokenAccountsResponse = await fetchAccounts(owner);
    const hasMint: boolean | undefined = tokenAccountsResponse?.token_accounts?.some(
      (account) => account.mint === mint.toBase58(),
    );

    // 判断账户是否存在 ATA
    if (hasMint) {
      return true;
    }
    const instructions: TransactionInstruction[] = [];
    const associatedTokenAccount = await fetchAssociatedTokenAddress(owner, mint);
    const heliusClient = HeliusClient.getInstance();
    const assetInfo = await heliusClient.rpc.getAsset({ id: mint.toBase58() });
    if (!assetInfo.token_info?.token_program) {
      throw new Error("token info does not match token_info");
    }
    const programId = new PublicKey(assetInfo.token_info.token_program);

    const createATAInstruction = createAssociatedTokenAccountIdempotentInstruction(
      owner, // 费用支付者
      associatedTokenAccount, // 新创建的 ATA 账户地址
      owner, // 该账户归接收者所有
      mint, // mint publicKey
      programId,
    );
    instructions.push(createATAInstruction);

    const recentBlockHash = await heliusClient.rpc.getLatestBlockhash();

    // 构建交易消息
    const messageV0 = new TransactionMessage({
      payerKey: owner,
      recentBlockhash: recentBlockHash.blockhash,
      instructions,
    }).compileToV0Message();

    const versionedTransaction = new VersionedTransaction(messageV0);
    versionedTransaction.sign([senderKeypair]);

    // 发送交易
    const txSignature = await heliusClient.rpc.sendTransaction(versionedTransaction);
    const confirmedSignature = await pollTransactionConfirmation(txSignature);
    console.log("交易已成功确认:", confirmedSignature);

    return confirmedSignature === txSignature;
  } catch (error) {
    throw new Error(`parseTransactions: ${error}`);
  }
};

/**
 * 轮询请求交易结果
 * @param txtSig
 */
const pollTransactionConfirmation = async (txtSig: TransactionSignature): Promise<TransactionSignature> => {
  const timeout = 22000; // 15 秒超时
  const interval = 3000; // 每 3 秒查询一次
  let elapsed = 0;
  const heliusClient = HeliusClient.getInstance();

  return new Promise<TransactionSignature>((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const status = await heliusClient.connection.getSignatureStatuses([txtSig], { searchTransactionHistory: true });
        const info = status?.value[0];

        if (info?.confirmationStatus === "confirmed" || info?.confirmationStatus === "finalized") {
          clearInterval(intervalId);
          if (info.err) {
            reject(new Error(`Transaction ${txtSig} failed with error: ${JSON.stringify(info.err)}`));
          } else {
            resolve(txtSig);
          }
          return;
        }
      } catch (err) {
        console.warn("⛔ 获取交易状态失败，重试中:", err);
      }

      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(intervalId);
        reject(new Error(`Transaction ${txtSig}'s confirmation timed out`));
      }
    };

    // 立即执行第一次
    checkStatus();

    // 后续每 interval 毫秒执行
    const intervalId = setInterval(checkStatus, interval);
  });
};

/**
 * 估算创建 ata 账户所需手续费
 * @param sender
 * @param mint
 */
export const simulateAssociatedTokenAccountFeeInSOL = async (sender: PublicKey, mint: PublicKey): Promise<number> => {
  try {
    const heliusClient = HeliusClient.getInstance();
    const connection = heliusClient.connection;
    const assetInfo = await heliusClient.rpc.getAsset({ id: mint.toBase58() });
    if (!assetInfo.token_info?.token_program) {
      throw new Error("token info does not match token_info");
    }
    const programId = new PublicKey(assetInfo.token_info.token_program);

    // 1. 获取租金豁免费用（165 bytes）
    const rentExemption = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);

    // 2. 创建一条模拟 ATA 指令
    const ata = await fetchAssociatedTokenAddress(sender, mint);
    const instruction = createAssociatedTokenAccountIdempotentInstruction(sender, ata, sender, mint, programId);

    // 3. 获取最新 blockhash（新的方式）
    const { blockhash } = await connection.getLatestBlockhash();

    // 4. 构建交易消息
    const messageV0 = new TransactionMessage({
      payerKey: sender,
      recentBlockhash: blockhash,
      instructions: [instruction],
    }).compileToV0Message();

    // 5. 估算总交易费（含租金 + 网络费）
    const feeInfo = await connection.getFeeForMessage(messageV0);
    const totalLamports = rentExemption + (feeInfo.value ?? 5000);
    return totalLamports / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
};
