import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 转 SOL 给对方 wallet
 * @param senderKeypair 转账发送方 wallet address
 * @param recipientPublicKey 转账接收方 wallet address
 * @param amount 转账金额
 */
export const sendSOL = async (senderKeypair: Keypair, recipientPublicKey: PublicKey, amount: number) => {
  try {
    const heliusSdkClient = HeliusClient.getInstance();
    const recentBlockHash = await heliusSdkClient.rpc.getLatestBlockhash();
    const instructions = [];
    amount = amount * LAMPORTS_PER_SOL;
    // 原生 SOL 转账
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: recipientPublicKey,
      lamports: amount,
    });
    instructions.push(transferInstruction);

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
