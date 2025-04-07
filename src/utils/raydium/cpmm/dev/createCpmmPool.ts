import { getCpmmPdaAmmConfigId } from "@raydium-io/raydium-sdk-v2";
import { CPMM_POOL_FEE_ACC_ACCOUNT, CPMM_POOL_PROGRAM_ID, TX_VERSION } from "../../raydium.config";
import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import RaydiumClient from "@/utils/raydium/raydiumClient";

/**
 * 在 CPMM（x*y=k）自动做市商（AMM）的模型下，创建一个新的流动性池
 * @param owner 流动性池的创建者
 * @param tokenAMint 代币 A Mint Address（池子的第一个代币，通常是自定义代币）
 * @param tokenBMint 代币 B Mint Address（池子的第二个代币，通常是 SOL 或 流通性较好的代币）
 * @param tokenAAmount 代币 A（tokenAMint）的初始资金量
 * @param tokenBAmount 代币 B（tokenBMint）的初始资金量
 */
export const createPool = async (
  owner: Keypair,
  tokenAMint: PublicKey,
  tokenBMint: PublicKey,
  tokenAAmount: number,
  tokenBAmount: number,
) => {
  try {
    const raydium = await RaydiumClient.getInstance(owner, { loadToken: true });
    const mintA = await raydium.token.getTokenInfo(tokenAMint);
    const mintB = await raydium.token.getTokenInfo(tokenBMint);

    const feeConfigs = await raydium.api.getCpmmConfigs();
    feeConfigs.forEach((config) => {
      config.id = getCpmmPdaAmmConfigId(CPMM_POOL_PROGRAM_ID, config.index).publicKey.toBase58();
    });

    const { execute, extInfo } = await raydium.cpmm.createPool({
      programId: CPMM_POOL_PROGRAM_ID,
      poolFeeAccount: CPMM_POOL_FEE_ACC_ACCOUNT,
      mintA,
      mintB,
      mintAAmount: new BN(tokenAAmount * LAMPORTS_PER_SOL),
      mintBAmount: new BN(tokenBAmount * LAMPORTS_PER_SOL),
      startTime: new BN(0),
      feeConfig: feeConfigs[0],
      associatedOnly: false,
      ownerInfo: {
        useSOLBalance: true,
      },
      txVersion: TX_VERSION,
      // optional: set up priority fee here
      // computeBudgetConfig: {
      //   units: 600000, // 增加计算资源
      //   microLamports: 46591500, // 作为优先费用（额外给的费用，用于提高交易成功率）
      // },
    });

    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = await execute({ sendAndConfirm: true });
    console.log("pool created", {
      txId,
      poolKeys: Object.keys(extInfo.address).reduce(
        (acc, cur) => ({
          ...acc,
          [cur]: extInfo.address[cur as keyof typeof extInfo.address].toString(),
        }),
        {},
      ),
    });
  } catch (error) {
    console.error("ERROR 1: ", error);
  }
};
