import { CPMM_POOL_PROGRAM_ID } from "../../raydium.config";

import Decimal from "decimal.js";
import { PublicKey } from "@solana/web3.js";
import { DEVNET_PROGRAM_ID, getCpmmPdaAmmConfigId, getCpmmPdaPoolId } from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";
import RaydiumClient from "@/utils/raydium/raydiumClient";

export const fetchRpcPoolInfo = async (tokenAMint: PublicKey, tokenBMint: PublicKey) => {
  try {
    const raydium = await RaydiumClient.getInstance();
    // const poolId = await generateCpmmPdaPoolId(tokenAMint, tokenBMint);

    const poolId = '2RRbHfBB8btYaTeFVujsLhSdfWQYPAmG367gV1ZkLBHJ';
    console.log("poolId", poolId);




    const res = await raydium.cpmm.getRpcPoolInfos([poolId]);
    // console.log(JSON.stringify(res, null, 2))
    const pool1Info = res[poolId];

    const mintA = await raydium.token.getTokenInfo(tokenAMint);
    const mintB = await raydium.token.getTokenInfo(tokenBMint);

    const vaultAAmountDecimal = new Decimal(pool1Info.vaultAAmount.toString()).div(10 ** mintA.decimals).toFixed(9);
    const vaultBAmountDecimal = new Decimal(pool1Info.vaultBAmount.toString()).div(10 ** mintB.decimals).toFixed(9);
    const poolPrice = pool1Info.poolPrice;

    console.log(
      `\n\x1b[1m\x1b[34m================ 交易池信息 ================\x1b[0m` +
        `\n PoolId : [\x1b[33m${poolId}\x1b[0m]` +
        `\n mintA: [\x1b[32m${pool1Info.mintA.toBase58()}\x1b[0m]` +
        `\n 余额  : \x1b[33m${vaultAAmountDecimal}\x1b[0m` +
        `\n mintB: [\x1b[36m${pool1Info.mintB.toBase58()}\x1b[0m]` +
        `\n 余额  : \x1b[33m${vaultBAmountDecimal}\x1b[0m` +
        `\n 当前价格: \x1b[35m${poolPrice}\x1b[0m` +
        `\n\x1b[1m\x1b[34m=========================================\x1b[0m\n`,
    );
  } catch (error) {
    throw new Error(`fetchRpcPoolInfo: ${error}`);
  }
};

export const generateCpmmPdaPoolId = async (tokenAMint: PublicKey, tokenBMint: PublicKey) => {
  const raydium = await RaydiumClient.getInstance();

  const isFront = new BN(tokenAMint.toBuffer()).lte(new BN(tokenBMint.toBuffer()));
  const [mintA, mintB] = isFront ? [tokenAMint, tokenBMint] : [tokenBMint, tokenAMint];
  //const [mintAAmount, mintBAmount] = isFront ? [params.mintAAmount, params.mintBAmount] : [params.mintBAmount, params.mintAAmount]

  const feeConfigs = await raydium.api.getCpmmConfigs();
  feeConfigs.forEach((config) => {
    config.id = getCpmmPdaAmmConfigId(CPMM_POOL_PROGRAM_ID, config.index).publicKey.toBase58();
  });
  const ammConfigId = new PublicKey(feeConfigs[0].id);
  return getCpmmPdaPoolId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, ammConfigId, mintA, mintB).publicKey.toBase58();
};
