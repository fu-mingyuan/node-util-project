import { Keypair, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { checkDirectPool, formatBNToDecimal } from "./swapUtils";
import { simulateSwap, swap } from "./swap";

/**
 * 试算：
 * 通过路径实现跨代币兑换：使用 amount 个代币 A 可以兑换多少个代币 B
 * - 如果 tokenA 和 tokenB 有交易对，则直接兑换
 * - 如果没有直接交易对，则查询 tokenA 和 tokenB 是否与 routeTokenMint 有交易对，有则通过 routeTokenMint 作为中介兑换
 *
 * - 交易/试算过程
 * -  1、计算兑换 x 个 tokenA 可以兑换多少个 routeTokenMint (假设 x 个)
 * -  2、计算 x 个 routeTokenMint 可以兑换多少个 tokenB
 * 通过路径实现跨代币兑换：使用代币 A 兑换 amount 个代币 B 需要多少代币A
 * @param tokenAMint
 * @param tokenBMint
 * @param amount
 * @param routeTokenMint
 */
export const simulateSwapWithRouteToken = async (
  tokenAMint: PublicKey,
  tokenBMint: PublicKey,
  amount: number,
  routeTokenMint: PublicKey = NATIVE_MINT,
) => {
  const hasDirectPool = await checkDirectPool(tokenAMint, tokenBMint);
  if (hasDirectPool) {
    const { swapResult } = await simulateSwap({ tokenAMint, tokenBMint, amount });
    return Number(formatBNToDecimal(swapResult.destinationAmountSwapped));
  }

  // 通过 routeTokenMint 进行路径交换
  console.log(`\x1b[1m\x1b[32m 交易池不存在，检查通过 [${routeTokenMint}] 是否可以交易\x1b[0m`);

  const hasDirectPoolTokenA = await checkDirectPool(tokenAMint, routeTokenMint);
  const hasDirectPoolTokenB = await checkDirectPool(tokenBMint, routeTokenMint);

  if (!hasDirectPoolTokenA || !hasDirectPoolTokenB) {
    console.log(
      `\n 代币: [\x1b[36m${tokenAMint}\x1b[0m] : [\x1b[35m${tokenBMint}\x1b[0m]` +
        `\n \x1b[1m\x1b[32m 与[\x1b[36m${routeTokenMint}\x1b[0m]，不存在交易对，无法交易\x1b[0m`,
    );
    throw new Error("There is no trading pair, and the transaction cannot be made");
  }

  // 计算兑换 amount 个 token 可以兑换多少个 routeToken
  const { swapResult: routeTokenOut } = await simulateSwap({
    tokenAMint: tokenAMint,
    tokenBMint: routeTokenMint,
    amount,
  });

  // 兑换的 routeToken 数量
  const routeTokenAmount = Number(formatBNToDecimal(routeTokenOut.destinationAmountSwapped));

  // 计算 routeTokenAmount 个 routeToken 可以兑换多少  tokenB
  const { swapResult: tokenAOut } = await simulateSwap({
    tokenAMint: routeTokenMint,
    tokenBMint: tokenBMint,
    amount: routeTokenAmount,
  });

  // 兑换 tokenB 的数量
  const tokenBAmount = Number(formatBNToDecimal(tokenAOut.destinationAmountSwapped));
  console.log(`\x1b[1m\x1b[32m 预计获得tokenB数量：${tokenBAmount} \x1b[0m`);
  return tokenBAmount;
};

/**
 * 交易：
 * 通过路径实现跨代币兑换：使用 amount 个代币 A 兑换代币 B
 * - 如果 tokenA 和 tokenB 有交易对，则直接兑换
 * - 如果没有直接交易对，则查询 tokenA 和 tokenB 是否与 routeTokenMint 有交易对，有则通过 routeTokenMint 作为中介兑换
 *
 * - 交易/试算过程
 * -  1、计算兑换 x 个 tokenA 可以兑换多少个 routeTokenMint (假设 x 个)
 * -  2、计算 x 个 routeTokenMint 可以兑换多少个 tokenB
 *
 * @param owner 持有者的 keypair
 * @param tokenAMint 代币A（支付方）
 * @param tokenBMint 代币B（接收方）
 * @param amount 兑换数量（单位：lamports）
 * @param slippage 最大滑点
 * @param routeTokenMint 中间路由代币，默认为 SOL
 */
export const swapWithRouteToken = async (
  owner: Keypair,
  tokenAMint: PublicKey,
  tokenBMint: PublicKey,
  amount: number,
  slippage: number = 0.01,
  routeTokenMint: PublicKey = NATIVE_MINT,
) => {
  const hasDirectPool = await checkDirectPool(tokenAMint, tokenBMint);
  if (hasDirectPool) {
    return await swap({ owner, tokenAMint, tokenBMint, amount });
  }

  // 计算兑换 amount 个 tokenA 可以兑换多少 routeToken
  const { swapResult: routeTokenOut } = await simulateSwap({
    tokenAMint: tokenAMint,
    tokenBMint: routeTokenMint,
    amount,
  });

  // 兑换的 routeToken 数量
  const routeTokenAmount = Number(formatBNToDecimal(routeTokenOut.sourceAmountSwapped));
  // console.log("routeTokenAmount", routeTokenAmount)

  // 计算 routeTokenAmount 个 routeToken 可以兑换多少  tokenB
  // const { swapResult: tokenAOut } = await simulateSwap({
  //   tokenAMint: routeTokenMint,
  //   tokenBMint: tokenBMint,
  //   amount: routeTokenAmount,
  // })

  // 所需 tokenA 数量
  // const tokenAAmount = Number(formatBNToDecimal(tokenAOut.amountIn))
  // console.log("tokenAAmount", tokenAAmount)

  // 执行 A -> routeToken
  await swap({ owner: owner, tokenAMint, tokenBMint: routeTokenMint, amount }, slippage);

  // 执行 routeToken -> B
  await swap({ owner: owner, tokenAMint: routeTokenMint, tokenBMint: tokenBMint, amount: routeTokenAmount }, slippage);
};
