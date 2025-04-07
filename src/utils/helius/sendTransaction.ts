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
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMemoInstruction } from "@solana/spl-memo";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { fetchAccounts } from "@/utils/helius/fetchAccounts";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 发送交易
 * @param senderKeypair 转账发送方 wallet address
 * @param recipientPublicKey 转账接收方 wallet address
 * @param amount 转账金额
 * @param memo 附言
 * @param token_mint 转账的代币类型
 */
export const sendTransaction = async (
  senderKeypair: Keypair,
  recipientPublicKey: PublicKey,
  amount: number,
  token_mint: PublicKey,
  memo?: string,
) => {
  try {
    const heliusSdkClient = HeliusClient.getInstance();
    const recentBlockHash = await heliusSdkClient.rpc.getLatestBlockhash();
    const isNativeSOL = token_mint?.equals(NATIVE_MINT);
    const tokenProgram = isNativeSOL ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

    const senderATAAddress = await fetchAssociatedTokenAddress(senderKeypair.publicKey, token_mint);
    const recipientATAAddress = await fetchAssociatedTokenAddress(recipientPublicKey, token_mint);

    const instructions = [];
    amount = amount * LAMPORTS_PER_SOL;

    if (isNativeSOL) {
      // 原生 SOL 转账
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amount,
      });
      instructions.push(transferInstruction);
    } else {
      // 检查接收方是否已经存在 ATA 账户
      const tokenAccountsResponse = await fetchAccounts(recipientPublicKey);
      const hasMint: boolean | undefined = tokenAccountsResponse?.token_accounts?.some(
        (account) => account.mint === token_mint.toBase58(),
      );

      if (!hasMint) {
        console.log("接收方没有 ATA 账户，创建 ATA 账户...");
        const createATAInstruction = createAssociatedTokenAccountIdempotentInstruction(
          senderKeypair.publicKey, // 费用支付者
          recipientATAAddress, // 新创建的 ATA 账户地址
          recipientPublicKey, // 该账户归接收者所有
          new PublicKey(token_mint), // mint address
          tokenProgram, //代币程序 ID
          ASSOCIATED_TOKEN_PROGRAM_ID, // 关联账户程序 ID
        );
        instructions.push(createATAInstruction);
      }

      console.log("创建代币转账指令...");
      const transferInstruction = createTransferInstruction(
        senderATAAddress, // 发送方 ATA 地址
        recipientATAAddress, // 接收方 ATA 地址
        senderKeypair.publicKey, // 发送方的 publicKey
        amount, // 转账金额
        [], // 可选的签名者（如果有的话）
        TOKEN_2022_PROGRAM_ID, // Token-2022 代币程序 ID
      );
      instructions.push(transferInstruction);
    }

    // 添加 memo
    if (memo) {
      const memoInstruction = createMemoInstruction(memo, [senderKeypair.publicKey]);
      instructions.push(memoInstruction);
    }

    // 构建交易
    const messageV0 = new TransactionMessage({
      payerKey: senderKeypair.publicKey,
      recentBlockhash: recentBlockHash.blockhash,
      instructions,
    }).compileToV0Message();

    const versionedTransaction = new VersionedTransaction(messageV0);
    versionedTransaction.sign([senderKeypair]);

    // 发送交易
    const txSignature = await heliusSdkClient.rpc.sendTransaction(versionedTransaction);
    const confirmedSignature = await heliusSdkClient.rpc.pollTransactionConfirmation(txSignature);

    console.log("交易已成功确认:", confirmedSignature);
    return confirmedSignature === txSignature ? confirmedSignature : null;
  } catch (error) {
    console.error(`发送交易时发生错误: ${error}`);
    throw "Transaction failed";
  }
};
