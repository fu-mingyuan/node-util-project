import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  NATIVE_MINT,
} from "@solana/spl-token";
import { createMemoInstruction } from "@solana/spl-memo";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { fetchAccounts } from "@/utils/helius/fetchAccounts";
import HeliusClient from "@/utils/helius/heliusClient";
import Decimal from "decimal.js";
import RaydiumClient from "@/utils/raydium/raydiumClient";

/**
 * 发送交易
 * @param senderKeypair 转账发送方 wallet address
 * @param recipientPublicKey 转账接收方 wallet address
 * @param amount 转账金额
 * @param memo 附言
 * @param tokenMint 转账的代币类型
 */
export const sendTransaction = async (
  senderKeypair: Keypair,
  recipientPublicKey: PublicKey,
  amount: number,
  tokenMint: PublicKey,
  memo?: string,
) => {
  try {
    const heliusSdkClient = HeliusClient.getInstance();
    const recentBlockHash = await heliusSdkClient.rpc.getLatestBlockhash();
    const isNativeSOL = tokenMint?.equals(NATIVE_MINT);
    const senderATAAddress = await fetchAssociatedTokenAddress(senderKeypair.publicKey, tokenMint);
    const recipientATAAddress = await fetchAssociatedTokenAddress(recipientPublicKey, tokenMint);
    const instructions = [];

    if (isNativeSOL) {
      // 原生 SOL 转账
      // amount = amount * LAMPORTS_PER_SOL;

      const rawAmount = new Decimal(amount).mul(LAMPORTS_PER_SOL).toFixed(0);
      const finalAmount = BigInt(rawAmount);
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: finalAmount,
      });
      instructions.push(transferInstruction);
    } else {
      const raydiumClient = await RaydiumClient.getInstance();
      const tokenInfo = await raydiumClient.token.getTokenInfo(tokenMint);
      const decimals = tokenInfo.decimals;
      const rawAmount = new Decimal(amount).mul(new Decimal(10).pow(decimals)).toFixed(0);
      const finalAmount = BigInt(rawAmount);
      // 检查接收方是否已经存在 ATA 账户
      const tokenAccountsResponse = await fetchAccounts(recipientPublicKey);
      const hasMint: boolean | undefined = tokenAccountsResponse?.token_accounts?.some(
        (account) => account.mint === tokenMint.toBase58(),
      );

      if (!hasMint) {
        console.log("接收方没有 ATA 账户，创建 ATA 账户...");
        const createATAInstruction = createAssociatedTokenAccountIdempotentInstruction(
          senderKeypair.publicKey, // 费用支付者
          recipientATAAddress, // 新创建的 ATA 账户地址
          recipientPublicKey, // 该账户归接收者所有
          new PublicKey(tokenMint), // mint address
          new PublicKey(tokenInfo.programId), //代币程序 ID
          ASSOCIATED_TOKEN_PROGRAM_ID, // 关联账户程序 ID
        );
        instructions.push(createATAInstruction);
      }

      console.log("接收方存在 ATA 账户, 开始构建代币交易 transferInstruction ...");
      const transferInstruction = createTransferInstruction(
        senderATAAddress, // 发送方 ATA 地址
        recipientATAAddress, // 接收方 ATA 地址
        senderKeypair.publicKey, // 发送方的 publicKey
        finalAmount, // 转账金额
        [senderKeypair], // 可选的签名者（如果有的话）
        new PublicKey(tokenInfo.programId), // Token-2022 代币程序 ID
      );
      instructions.push(transferInstruction);
    }

    // 添加 memo
    if (memo) {
      console.log("添加memo...");
      const memoInstruction = createMemoInstruction(memo, [senderKeypair.publicKey]);
      instructions.push(memoInstruction);
    }

    // 构建交易
    console.log("构建 messageV0 ...");
    const messageV0 = new TransactionMessage({
      payerKey: senderKeypair.publicKey,
      recentBlockhash: recentBlockHash.blockhash,
      instructions,
    }).compileToV0Message();

    console.log("构建 versionedTransaction ...");
    const versionedTransaction = new VersionedTransaction(messageV0);
    versionedTransaction.sign([senderKeypair]);

    // 发送交易
    console.log("发送交易 ...");
    const txSignature = await heliusSdkClient.rpc.sendTransaction(versionedTransaction);
    console.log("请求交易结果 ...");
    const confirmedSignature = await heliusSdkClient.rpc.pollTransactionConfirmation(txSignature);

    console.log("交易已成功确认:", confirmedSignature);
    return confirmedSignature === txSignature ? confirmedSignature : null;
  } catch (error) {
    console.error(`发送交易时发生错误: ${error}`);
    throw "Transaction failed";
  }
};
