import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 获取 token account address
 * @param publicKey wallet address
 * @param mint spl token mint address
 */
export const fetchAssociatedTokenAddress = async (publicKey: PublicKey, mint: PublicKey) => {
  const heliusClient = HeliusClient.getInstance();
  const assetInfo = await heliusClient.rpc.getAsset({ id: mint.toBase58() });
  if (!assetInfo.token_info?.token_program) {
    throw new Error("token info does not match token_info");
  }
  const programId = new PublicKey(assetInfo.token_info.token_program);

  return await getAssociatedTokenAddress(mint, publicKey, false, programId);
};
