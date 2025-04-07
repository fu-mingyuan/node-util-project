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
  slippage?: number; // in percent, for this example, 0.5 means 0.5%
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

export const simulateSwap = async ({
  inputMint,
  outputMint,
  amount,
  swapType,
  slippage = 0.5,
}: SimulateSwapApiParams) => {
  const apiTrail = swapType === "BaseOut" ? "swap-base-out" : "swap-base-in";
  const slippageBps = new Decimal(slippage * 10000).toFixed(0);

  const mint = swapType === "BaseOut" ? outputMint : inputMint;
  const raydiumClient = await RaydiumClient.getInstance();
  const tokenInfo = await raydiumClient.token.getTokenInfo(mint);
  const decimals = tokenInfo.decimals;
  const amountInSmallestUnit = new Decimal(amount).mul(new Decimal(10).pow(decimals)).toFixed(0);

  const url =
    inputMint && outputMint && !new Decimal(amount.trim() || 0).isZero()
      ? `${API_URLS.SWAP_HOST}/compute/${apiTrail}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInSmallestUnit}&slippageBps=${slippageBps}&txVersion=${TX_VERSION === TxVersion.V0 ? "V0" : "LEGACY"}`
      : null;

  if (!url) {
    return 0;
  }

  const response: AxiosResponse<SimulateSwapApiResult> = await axios.get(url);
  const data = response.data;

  console.log("data", data);
  if (data?.success && data.data) {
    return data.data.outputAmount;
  }
  return 0;
};
