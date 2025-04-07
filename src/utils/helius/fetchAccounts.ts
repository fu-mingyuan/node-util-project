import { DAS } from "helius-sdk";
import { PublicKey } from "@solana/web3.js";
import { retryRequest } from "@/utils/httpClients";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 查询 publicKey 基本信息
 * @param publicKey wallet address
 */
export const fetchAccounts = async (publicKey: PublicKey): Promise<DAS.GetTokenAccountsResponse> => {
  return await retryRequest(
    () =>
      HeliusClient.getInstance().rpc.getTokenAccounts({
        page: 1,
        limit: 10,
        options: { showZeroBalance: false },
        owner: publicKey.toBase58(),
      }),
    "fetchTokenAccounts",
  );
};
