import { PublicKey } from "@solana/web3.js";
import RaydiumClient from "@/utils/raydium/raydiumClient";

/**
 * 获取 publicKey 下所有token account 账户信息
 * @param publicKey wallet address
 */
export const existTokenAccount = async (publicKey: PublicKey) => {
  try {
    const raydiumClient = await RaydiumClient.getInstance(publicKey, { loadToken: true });
    // 所有token account info
    const walletTokenAccountsFull = await raydiumClient.account.fetchWalletTokenAccounts();
    console.log(JSON.stringify(walletTokenAccountsFull, null, 2));
  } catch (error) {
    console.error("Error fetching token accounts and asset info:", error);
    return [];
  }
};
