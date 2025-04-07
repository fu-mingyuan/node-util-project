import { PublicKey } from "@solana/web3.js";
import { retryRequest } from "@/utils/httpClients";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

/**
 * 获取 token account address
 * @param publicKey wallet address
 * @param mintAddress spl token mint address
 */
export const fetchAssociatedTokenAddress = async (publicKey: PublicKey, mintAddress: PublicKey) => {
  return await retryRequest(
    () => getAssociatedTokenAddress(mintAddress, publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
    "fetchAssociatedTokenAddress",
  );
};
