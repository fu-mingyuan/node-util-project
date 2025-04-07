import { PublicKey } from "@solana/web3.js";
import RaydiumClient from "@/utils/raydium/raydiumClient";
import { ApiResponse, httpClients } from "@/utils/httpClients";
import { formatTokenAmount, solMintConversion } from "@/utils/flexDealUtils";

export interface TokenAccountInfo {
  owner: string;
  mint: string;
  balance: number;
  name: string;
  symbol: string;
  logo: string;
  price: number;
  decimals: number;
}

/**
 * 获取 publicKey 下所有token account 账户信息
 * @param publicKey wallet address
 * @param mint 查询指定的 SPL Token
 */
export const fetchTokenAccountsInfo = async (publicKey: PublicKey, mint?: PublicKey): Promise<TokenAccountInfo[]> => {
  try {
    const raydiumClient = await RaydiumClient.getInstance(publicKey, { loadToken: true });
    // 所有token account info
    const walletTokenAccountsFull = await raydiumClient.account.fetchWalletTokenAccounts();
    const walletTokenAccounts = walletTokenAccountsFull?.tokenAccounts || [];
    const tokenAccounts = mint
      ? walletTokenAccounts.filter(({ mint: tokenMint }) => tokenMint?.equals(mint))
      : walletTokenAccounts;

    if (tokenAccounts.length === 0) {
      return [];
    }

    // 排序 按照金额从大到小
    const sortedTokenAccounts = tokenAccounts.slice().sort((a, b) => {
      return b.amount.cmp(a.amount); // b > a => 正数；升序反过来就降序
    });

    let tokenPrice: { [mint: string]: number | null } = {};
    try {
      const tokenList = sortedTokenAccounts.map(({ mint }) => {
        const mintBase58 = mint?.toBase58() || "";
        return solMintConversion(mintBase58);
      });

      const tokenListStr = tokenList.join(",");
      const tokenPriceResponse: ApiResponse<{ [mint: string]: number | null }> = await httpClients.get<{
        [mint: string]: number | null;
      }>("https://api-v3.raydium.io/mint/price", { mints: tokenListStr });

      if (httpClients.isSuccessResponse(tokenPriceResponse)) {
        tokenPrice = tokenPriceResponse.data;
      }
    } catch (error) {
      console.error("Error fetching token prices:", error);
    }

    return await Promise.all(
      sortedTokenAccounts.map(async (tokenAccount) => {
        // 获取 token 信息
        const tokenInfo = await raydiumClient.token.getTokenInfo(tokenAccount.mint);
        // 获取 tokenPrice
        const price = tokenPrice[solMintConversion(tokenAccount.mint.toBase58())] ?? 0;
        const amount = formatTokenAmount(tokenAccount.amount, tokenInfo.decimals);
        return {
          owner: publicKey.toBase58(),
          mint: solMintConversion(tokenAccount.mint.toBase58()),
          balance: amount,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          logo: tokenInfo.logoURI,
          price,
          decimals: tokenInfo.decimals,
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching token accounts and asset info:", error);
    return [];
  }
};
