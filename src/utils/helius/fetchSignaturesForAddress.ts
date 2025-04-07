import { PublicKey } from "@solana/web3.js";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { httpClients } from "@/utils/httpClients";
import { SignaturesInfo } from "@/utils/helius/fetchTransactionHistory";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 获取 publicKey 的交易签名数据
 * @param publicKey wallet address
 * @param limit 查询参数：查询结果条数
 * @param beforeSignature 查询参数：起始签名数据
 * @param mint 要查询的 spl token mint address
 */
export const fetchSignaturesForAddress = async (
  publicKey: PublicKey,
  beforeSignature: string | null = null,
  limit: number = 20,
  mint: PublicKey,
): Promise<SignaturesInfo[]> => {
  try {
    const options: { limit: number; commitment: string; before?: string } = {
      limit: limit,
      commitment: "confirmed",
    };

    if (beforeSignature) {
      options.before = beforeSignature;
    }

    const tokenAccount = await fetchAssociatedTokenAddress(publicKey, mint);
    const response = await httpClients.post<SignaturesInfo[]>(HeliusClient.getCurrentNetwork().endpoint, {
      jsonrpc: "2.0",
      id: "1",
      method: "getSignaturesForAddress",
      params: [tokenAccount.toBase58(), options],
    });

    if (!httpClients.isSuccessResponse(response)) {
      throw new Error(JSON.stringify(response.error));
    }

    return response.data;
  } catch (error) {
    throw new Error(`fetchSignaturesForAddress: ${error}`);
  }
};
