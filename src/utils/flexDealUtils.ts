import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// 检查 email 格式
export function checkEmail(email: string) {
  const emailRegex = /^(?![0-9])([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 判断是否是合法的 Solana 公钥
 * @param address Solana 地址
 * @returns boolean
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * 将 BN 格式的 Token 数量转换成可读的 number（失败返回 0）
 * @param rawAmount - 原始 token 数量（BN）
 * @param decimals - token 的精度（如 6、9 等）
 * @returns number - 可读格式的 token 数量（小数），异常时返回 0
 */
export function formatTokenAmount(rawAmount: BN, decimals: number): number {
  try {
    const divisor = new BN(10).pow(new BN(decimals));
    const result = rawAmount.muln(1).divmod(divisor);

    // 获取整数部分和小数部分
    const whole = result.div.toString();
    const fraction = result.mod.toString().padStart(decimals, "0");

    // 拼接成 "x.yyyyyy" 再转成 number
    const formatted = `${whole}.${fraction}`;
    return parseFloat(formatted);
  } catch {
    return 0;
  }
}

/**
 * 格式化价格数值，保留指定小数位数。
 *
 * @param value - 原始价格（number 类型）
 * @param decimals - 要保留的小数位数，默认是 2 位
 * @returns 格式化后的字符串（如 "1.23"），如果发生异常则返回 "0.00"
 */
export function formatPrice(value: number, decimals: number = 2): string {
  const num = Number(value);
  if (isNaN(num)) return "0";

  // 如果值大于等于 0.01，保留指定小数位
  if (Math.abs(num) >= 0.01) {
    return num.toFixed(decimals);
  }

  // 对非常小的值，使用自动精度（最多显示到 8 位，不截断有效位）
  return num.toPrecision(8).replace(/\.?0+$/, ""); // 去除多余的 0
}

export function solMintConversion(mint: string) {
  const SYSTEM_SOL_ADDRESS = "11111111111111111111111111111111";
  const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

  if (mint === SYSTEM_SOL_ADDRESS) return WRAPPED_SOL_MINT;
  if (mint === WRAPPED_SOL_MINT) return SYSTEM_SOL_ADDRESS;
  return mint;
}

/**
 * 将地址进行简化显示，显示前后各一定长度的字符，剩余部分用 `...` 省略。
 *
 * @param address - 要进行简化的地址字符串。
 * @param range - 要显示的前后字符长度，默认为 15。
 * @returns 返回一个简化后的地址字符串，格式为 "前n位...后n位"。
 */
export function shortenAddress(address: string, range: number = 10): string {
  if (!address) return ""; // 如果地址为空，返回空字符串
  return `${address.slice(0, range)}...${address.slice(-range)}`; // 截取前后n个字符并拼接
}
