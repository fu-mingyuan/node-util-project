import { CurveCalculator } from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { formatBNToDecimal, getPoolData, PoolData, SimulateSwapParams } from "./swapUtils";
import RaydiumClient from "@/utils/raydium/raydiumClient";

/**
 * 试算 swap 结果（不执行交易）
 * @param tokenAMint 代币A（支付方）
 * @param tokenBMint 代币B（接收方）
 * @param amount 兑换代币数量(单位: 1000000000 lamports)
 * @param raydiumSdk raydiumSdk
 */
export const simulateSwap = async ({ tokenAMint, tokenBMint, amount }: SimulateSwapParams) => {
  const inputAmount = new BN(amount * LAMPORTS_PER_SOL);
  const inputMint = tokenAMint.toBase58();
  const { poolInfo, poolKeys, rpcData }: PoolData = await getPoolData(tokenAMint, tokenBMint);
  if (inputMint !== poolInfo.mintA.address && inputMint !== poolInfo.mintB.address) {
    throw new Error("input mint does not match pool");
  }

  const baseIn = inputMint === poolInfo.mintA.address;

  // 计算 swap 结果
  const swapResult = CurveCalculator.swap(
    inputAmount,
    baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
    baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
    rpcData.configInfo!.tradeFeeRate,
  );

  console.log(
    `\n\x1b[1m\x1b[34m================ 兑换详情 IN ================\x1b[0m` + // 加粗、蓝色
      `\n 支付代币  : \x1b[35m${tokenAMint}\x1b[0m` + // 紫色
      `\n 目标代币  : \x1b[36m${tokenBMint}\x1b[0m` + // 青色
      `\n 兑换数量  : \x1b[32m${amount} \x1b[0m` + // 绿色
      `\n 预计获得  : \x1b[33m${formatBNToDecimal(swapResult.destinationAmountSwapped)} \x1b[0m` + // 黄色
      // `\n 兑换数量  : \x1b[33m${formatBNToDecimal(swapResult.sourceAmountSwapped)} \x1b[0m` + // 黄色
      // `\n 预计获得不含各种手续费  : \x1b[33m${formatBNToDecimal(swapResult.newSwapDestinationAmount)} \x1b[0m` + // 黄色
      // `\n 交易费  : \x1b[33m${swapResult.tradeFee} \x1b[0m` + // 黄色

      `\n\x1b[1m\x1b[34m=========================================\x1b[0m\n`,
  );

  return { poolInfo: poolInfo, poolKeys: poolKeys, baseIn: baseIn, swapResult: swapResult };
};

/**
 * 执行 swap 交易，使用 amount 个 tokenAMint 兑换 tokenBMint
 * @param owner 持有者的 keypair
 * @param tokenAMint 代币A（支付方）
 * @param tokenBMint 代币B（接收方）
 * @param amount 兑换代币数量(单位 1000000000 lam ports)
 * @param slippage 最大滑点
 */
export const swap = async ({ owner, tokenAMint, tokenBMint, amount }: SimulateSwapParams, slippage: number = 0.01) => {
  try {
    const swapInfo = await simulateSwap({ tokenAMint, tokenBMint, amount });
    const inputAmount = new BN(amount * LAMPORTS_PER_SOL);
    const poolInfo = swapInfo.poolInfo;
    const poolKeys = swapInfo.poolKeys;
    const swapResult = swapInfo.swapResult;

    const baseIn = swapInfo.baseIn;

    const raydium = await RaydiumClient.getInstance(owner);
    const { execute } = await raydium.cpmm.swap({
      // poolInfo: 流动性池的信息对象，通常包含池子内的代币（mintA 和 mintB）及其相关信息
      poolInfo,
      // poolKeys: 流动性池的密钥对象，通常包含池子的 vault 地址和相关的公钥
      poolKeys,
      // inputAmount: 输入的代币数量，单位为 Lamports（使用 BN 类型来表示大数）
      inputAmount,
      // swapResult.newSwapDestinationAmount: 交换完成后，你将获得的目标代币数量（交换的结果）
      // swapResult.sourceAmountSwapped(input amount): 交换的源代币数量。即你将投入的代币数量
      // swapResult.destinationAmountSwapped: 从池子中交换得到的目标代币数量
      // swapResult.tradeFee: 本次交易支付的手续费
      swapResult,
      // slippage: 允许的滑点范围，用于控制输入和输出之间的价格偏差
      // 例如，slippage: 0.001 表示最大允许的滑点为 0.1%
      // 容忍的滑点 range: 1 ~ 0.0001, means 100% ~ 0.01%
      slippage: slippage,
      // baseIn: 表示输入的代币（inputMint）是否是基础代币（一般为池中的第一个代币）
      // true: 输入代币是池子的基础代币；false: 输入代币是池子的另一种代币
      baseIn,
      // optional: set up priority fee here
      // 可选的参数：设置计算资源预算，用于指定交易执行时消耗的计算资源
      // computeBudgetConfig: 用于设置交易的计算资源和预算，通常用于计算资源较为密集的交易
      // 单位是计算资源消耗量和微Lamports（费用）
      // 例如，设置交易所需的计算单元数为 600,000，并且计算费用为 4.659150 SOL
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 4659150,
      // },

      // optional: add transfer sol to tip account instruction. e.g sent tip to jito
      // 可选的参数：设置小费支付配置，允许在交易中加入额外的 Solana 小费
      // txTipConfig: 用于指定小费的接收地址和金额
      // 例如，将 0.01 SOL 小费发送到指定地址
      // txTipConfig: {
      //   address: new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'),
      //   amount: new BN(10000000), // 0.01 sol
      // },
    });

    const { txId } = await execute({ sendAndConfirm: true });
    console.log(`swapped: ${poolInfo.mintA.symbol} to ${poolInfo.mintB.symbol}:`, {
      txId: `https://explorer.solana.com/tx/${txId}?cluster=${raydium.cluster}`,
    });
  } catch (error) {
    console.error("ERROR: ", error);
  }
};
