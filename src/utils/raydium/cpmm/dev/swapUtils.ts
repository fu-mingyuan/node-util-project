import { Keypair, PublicKey } from "@solana/web3.js";
import { generateCpmmPdaPoolId } from "./fetchRpcPoolInfo";
import { ApiV3PoolInfoStandardItemCpmm, CpmmKeys, CpmmRpcData } from "@raydium-io/raydium-sdk-v2";
import { isValidCpmm } from "./utils";
import Decimal from "decimal.js";
import BN from "bn.js";
import RaydiumClient from "@/utils/raydium/raydiumClient";

export interface SimulateSwapParams {
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  amount: number;
  owner?: Keypair;
}

export interface PoolData {
  poolInfo: ApiV3PoolInfoStandardItemCpmm;
  poolKeys: CpmmKeys | undefined;
  rpcData: CpmmRpcData;
}

/**
 * 检查是否存在交易对
 * @param tokenAMint 代币A
 * @param tokenBMint 代币B
 */
export const checkDirectPool = async (tokenAMint: PublicKey, tokenBMint: PublicKey): Promise<boolean> => {
  const raydium = await RaydiumClient.getInstance();
  let hasDirectPool = false;
  const poolId = await generateCpmmPdaPoolId(tokenAMint, tokenBMint);
  try {
    const res = await raydium.cpmm.getRpcPoolInfos([poolId]);
    const pool1Info = res[poolId];
    const poolPrice = pool1Info.poolPrice;
    hasDirectPool = !!poolPrice;
    console.log(
      `代币: [\x1b[36m${tokenAMint}\x1b[0m] : [\x1b[35m${tokenBMint}\x1b[0m] 存在交易池，PoolId: [\x1b[33m${poolId}\x1b[0m]`,
    );
  } catch {
    console.log(
      `代币: [\x1b[36m${tokenAMint}\x1b[0m] : [\x1b[35m${tokenBMint}\x1b[0m] 不存在交易池，PoolId: [\x1b[33m${poolId}\x1b[0m]`,
    );
  }
  return hasDirectPool;
};

export const getPoolData = async (tokenAMint: PublicKey, tokenBMint: PublicKey): Promise<PoolData> => {
  const poolData: PoolData = {
    poolInfo: {} as ApiV3PoolInfoStandardItemCpmm,
    poolKeys: undefined,
    rpcData: {} as CpmmRpcData,
  };
  const poolId = await generateCpmmPdaPoolId(tokenAMint, tokenBMint);

  const raydium = await RaydiumClient.getInstance();
  if (raydium.cluster === "mainnet") {
    // note: api doesn't support get devnet pool info, so in devnet else we go rpc method
    // if you wish to get pool info from rpc, also can modify logic to go rpc method directly
    const data = await raydium.api.fetchPoolById({ ids: poolId });
    poolData.poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm;
    if (!isValidCpmm(poolData.poolInfo.programId)) throw new Error("target pool is not CPMM pool");
    poolData.rpcData = await raydium.cpmm.getRpcPoolInfo(poolData.poolInfo.id, true);
  } else {
    const data = await raydium.cpmm.getPoolInfoFromRpc(poolId);
    poolData.poolInfo = data.poolInfo;
    poolData.poolKeys = data.poolKeys;
    poolData.rpcData = data.rpcData;
  }

  return poolData;
};

/**
 * 将 BN 类型的 lamports 转换为 SOL 单位，并格式化为可读的小数
 * @param value BN 类型的数值
 * @param decimalPlaces 保留的小数位数，默认为 9（SOL 单位）
 * @returns 格式化后的 Decimal 数值
 */
export const formatBNToDecimal = (value: BN, decimalPlaces: number = 9): string => {
  return new Decimal(value.toString()).div(1e9).toFixed(decimalPlaces);
};
