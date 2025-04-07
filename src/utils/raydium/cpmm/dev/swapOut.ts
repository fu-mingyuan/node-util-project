import { CurveCalculator } from "@raydium-io/raydium-sdk-v2";
import { TX_VERSION } from "../../raydium.config";
import BN from "bn.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { formatBNToDecimal, getPoolData, PoolData, SimulateSwapParams } from "./swapUtils";
import RaydiumClient from "@/utils/raydium/raydiumClient";

/**
 * 试算 swap 结果（不执行交易）
 * @param tokenAMint 代币A（支付方）
 * @param tokenBMint 代币B（接收方）
 * @param amount 兑换代币数量(单位: 1000000000 lamports)
 * @param raydium SDK 实例
 */
export const simulateSwapOut = async ({ tokenAMint, tokenBMint, amount }: SimulateSwapParams) => {
  const outputAmount = new BN(amount * LAMPORTS_PER_SOL);
  const outputMint = tokenBMint.toBase58();
  const { poolInfo, poolKeys, rpcData }: PoolData = await getPoolData(tokenAMint, tokenBMint);

  if (outputMint !== poolInfo.mintA.address && outputMint !== poolInfo.mintB.address) {
    throw new Error("input mint does not match pool");
  }

  const baseIn = outputMint === poolInfo.mintB.address;

  // swap pool mintA for mintB
  const swapResult = CurveCalculator.swapBaseOut({
    poolMintA: poolInfo.mintA,
    poolMintB: poolInfo.mintB,
    tradeFeeRate: rpcData.configInfo!.tradeFeeRate,
    baseReserve: rpcData.baseReserve,
    quoteReserve: rpcData.quoteReserve,
    outputMint,
    outputAmount,
  });

  console.log(
    `\n\x1b[1m\x1b[34m================ 兑换详情 OUT ================\x1b[0m` + // 加粗、蓝色
      `\n 支付代币  : \x1b[35m${tokenAMint}\x1b[0m` + // 紫色
      `\n 目标代币  : \x1b[36m${tokenBMint}\x1b[0m` + // 青色
      `\n 兑换数量  : \x1b[32m${amount} \x1b[0m` + // 绿色
      `\n 预计花费  : \x1b[33m${formatBNToDecimal(swapResult.amountIn)} \x1b[0m` + // 黄色
      // `\n 预计花费1  : \x1b[33m${formatBNToDecimal(swapResult.amountRealOut)} \x1b[0m` + // 黄色
      // `\n 预计花费2  : \x1b[33m${formatBNToDecimal(swapResult.amountInWithoutFee)} \x1b[0m` + // 黄色
      // `\n 预计花费3  : \x1b[33m${swapResult.tradeFee} \x1b[0m` + // 黄色
      `\n\x1b[1m\x1b[34m=========================================\x1b[0m\n`,
  );

  return { poolInfo: poolInfo, poolKeys: poolKeys, baseIn: baseIn, swapResult: swapResult };
};

/**
 * 执行 swap 交易，使用 tokenAMint 兑换 amount 个 tokenBMint
 * @param owner 持有者的 keypair
 * @param tokenAMint 代币A（支付方）
 * @param tokenBMint 代币B（接收方）
 * @param amount 兑换代币数量(单位 1000000000 lam ports)
 * @param slippage 最大滑点
 */
export const swapOut = async (
  { owner, tokenAMint, tokenBMint, amount }: SimulateSwapParams,
  slippage: number = 0.01,
) => {
  try {
    const raydium = await RaydiumClient.getInstance(owner);
    const swapInfo = await simulateSwapOut({ tokenAMint, tokenBMint, amount });

    const poolInfo = swapInfo.poolInfo;
    const poolKeys = swapInfo.poolKeys;
    const swapResult = swapInfo.swapResult;
    const outputAmount = new BN(amount * LAMPORTS_PER_SOL);
    const baseIn = swapInfo.baseIn;

    const { execute } = await raydium.cpmm.swap({
      poolInfo,
      poolKeys,
      inputAmount: new BN(0), // if set fixedOut to true, this arguments won't be used
      fixedOut: true,
      swapResult: {
        sourceAmountSwapped: swapResult.amountIn,
        destinationAmountSwapped: outputAmount,
      },
      slippage: slippage, // range: 1 ~ 0.0001, means 100% ~ 0.01%
      baseIn,
      txVersion: TX_VERSION,

      // optional: set up priority fee here
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 465915,
      // },

      // optional: add transfer sol to tip account instruction. e.g sent tip to jito
      // 可选的参数：设置小费支付配置，允许在交易中加入额外的 Solana 小费
      // txTipConfig: 用于指定小费的接收地址和金额
      // 例如，将 0.01 SOL 小费发送到指定地址
      // txTipConfig: {
      //   address: new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'),
      //   amount: new BN(10000000), // 0.01 sol
      // },
      // feePayer: new PublicKey("7ny7xMRuLF5zpGi14DZLBBepNR7uzv1XNUTnidHhCBsk")
    });

    const { txId } = await execute({ sendAndConfirm: true });
    console.log(`swapped: ${poolInfo.mintA.symbol} to ${poolInfo.mintB.symbol}:`, {
      txId: `https://explorer.solana.com/tx/${txId}?cluster=${raydium.cluster}`,
    });
  } catch (error) {
    console.error("ERROR: ", error);
  }
};
