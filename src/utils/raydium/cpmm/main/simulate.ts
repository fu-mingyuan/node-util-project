import { TX_VERSION } from "@/utils/raydium/raydium.config";
import { API_URLS, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { PublicKey, Keypair } from "@solana/web3.js";
import Decimal from "decimal.js";
import axios, { AxiosResponse } from "axios";
import RaydiumClient from "@/utils/raydium/raydiumClient";

export interface SimulateSwapApiParams {
  inputMint: PublicKey;
  outputMint: PublicKey;
  amount: string;
  swapType: "BaseOut" | "BaseIn";
  owner?: Keypair;
  slippage?: number; // in percent, e.g. 0.5 means 0.5%
}

interface SimulateSwapApiResult {
  id: string;
  success: true;
  version: "V0" | "V1";
  openTime?: undefined;
  msg: undefined;
  data: {
    swapType: "BaseIn" | "BaseOut";
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
    otherAmountThreshold: string;
    slippageBps: number;
    priceImpactPct: number;
    referrerAmount: "0";
    routePlan: {
      poolId: string;
      inputMint: string;
      outputMint: string;
      feeMint: string;
      feeRate: number;
      feeAmount: string;
    }[];
  };
}

export interface SimulateSwapResult {
  amount: string;
  raw: SimulateSwapApiResult["data"];
}

/**
 * 交易试算（模拟 swap）
 * @param inputMint 卖出代币 mint
 * @param outputMint 买入代币 mint
 * @param amount 卖出/买入的数量（字符串）
 * @param swapType 交易类型：BaseIn（卖出）或 BaseOut（买入）
 * @param slippage 最大滑点（默认 0.5%）
 * @returns 返回模拟计算的兑换数量和原始数据
 */
export const simulate = async ({
  inputMint,
  outputMint,
  amount,
  swapType,
  slippage = 0.5,
}: SimulateSwapApiParams): Promise<SimulateSwapResult | 0> => {
  // 参数校验：提前中断
  if (!inputMint || !outputMint || new Decimal(amount.trim() || 0).isZero()) {
    console.warn("Invalid simulateSwap parameters");
    return 0;
  }

  try {
    const BPS_MULTIPLIER = 10000;
    const slippageBps = new Decimal(slippage * BPS_MULTIPLIER).toFixed(0);

    const mint = swapType === "BaseOut" ? outputMint : inputMint;
    const raydiumClient = await RaydiumClient.getInstance();
    const tokenInfo = await raydiumClient.token.getTokenInfo(mint);
    const decimals = tokenInfo.decimals;

    const amountInSmallestUnit = new Decimal(amount).mul(new Decimal(10).pow(decimals)).toFixed(0);

    const apiTrail = swapType === "BaseOut" ? "swap-base-out" : "swap-base-in";

    const url = `${API_URLS.SWAP_HOST}/compute/${apiTrail}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInSmallestUnit}&slippageBps=${slippageBps}&txVersion=${
      TX_VERSION === TxVersion.V0 ? "V0" : "LEGACY"
    }`;

    const response: AxiosResponse<SimulateSwapApiResult> = await axios.get(url);
    const data = response.data;
    if (data?.success && data.data) {
      return {
        amount:
          swapType === "BaseOut"
            ? new Decimal(data.data.inputAmount).div(new Decimal(10).pow(decimals)).toString()
            : new Decimal(data.data.outputAmount).div(new Decimal(10).pow(decimals)).toString(),
        raw: data.data,
      };
    }

    console.warn("simulateSwap failed: no data");
    return 0;
  } catch (error) {
    console.error("simulateSwap error:", error);
    return 0;
  }
};
