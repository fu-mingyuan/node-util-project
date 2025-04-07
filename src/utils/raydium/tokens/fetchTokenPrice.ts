import { httpClients } from "@/utils/httpClients";

/**
 * 获取 token price
 * @param mints token mint
 */
export const fetchTokenPrice = async (mints: string[]) => {
  if (!mints.length) {
    return [];
  }
  const mintsString = mints.join(",");
  try {
    const response = await httpClients.get("https://api-v3.raydium.io/mint/price", { mints: mintsString });
    if (httpClients.isSuccessResponse(response)) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error("Error fetching token price", error);
  }
};
