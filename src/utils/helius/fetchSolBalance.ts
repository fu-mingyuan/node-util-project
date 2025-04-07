import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { httpClients, retryRequest } from "@/utils/httpClients";
import HeliusClient from "@/utils/helius/heliusClient";

/**
 * 获取 publicKey SOL 余额
 * @param publicKey wallet address
 * @param conversion 是否转换单位(LAMPORTS_PER_SOL -- > SOL)
 */
export const fetchSolBalance = async (publicKey: PublicKey, conversion: boolean = true): Promise<number> => {
  return await retryRequest(async () => {
    try {
      const response = await httpClients.post<{
        context: object;
        value: number;
      }>(HeliusClient.getCurrentNetwork().endpoint, {
        jsonrpc: "2.0",
        id: "1",
        method: "getBalance",
        params: [publicKey.toBase58()],
      });

      if (httpClients.isSuccessResponse(response)) {
        const balanceLamPorts = response.data.value;
        return conversion ? balanceLamPorts / LAMPORTS_PER_SOL : balanceLamPorts;
      } else {
        throw JSON.stringify(response.error);
      }
    } catch (error) {
      throw `getSolBalance: ${error}`;
    }
  }, "getSolBalance");
};
