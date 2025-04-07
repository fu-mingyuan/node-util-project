import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { DAS } from "helius-sdk";
import TokenAccounts = DAS.TokenAccounts;
import { fetchSolBalance } from "@/utils/helius/fetchSolBalance";
import HeliusClient from "@/utils/helius/heliusClient";

type TokenAccountInfo = {
  owner: string;
  mint: string;
  balance: number;
  name: string;
  logo: string;
  symbol: string;
  price?: number;
  value?: number;
};

/**
 * 获取 publicKey 下所有token account 账户信息
 * @param publicKey wallet address
 * @param mint 查询指定的 SPL Token
 */
export const fetchTokenAccountsInfoByOwner = async (
  publicKey: PublicKey,
  mint?: PublicKey,
): Promise<TokenAccountInfo[]> => {
  try {
    const heliusClient = HeliusClient.getInstance();

    // 获取该钱包的所有 token 账户
    const tokenAccountsResponse = await heliusClient.rpc.getTokenAccounts({
      owner: publicKey.toBase58(),
      options: {
        showZeroBalance: true, // 是否显示零余额账户
      },
    });

    const allTokenAccounts = tokenAccountsResponse.token_accounts || [];

    // 如果有 mint 只查询 mint，否则查询账户下所有且追加 SOL
    const tokenAccounts = mint
      ? allTokenAccounts.filter((account) => account.mint === mint.toBase58())
      : [
          ...allTokenAccounts,
          {
            address: publicKey.toBase58(),
            mint: NATIVE_MINT.toBase58(),
            owner: publicKey.toBase58(),
            amount: parseFloat((await fetchSolBalance(publicKey, false)).toFixed(9)),
            delegated_amount: 0,
            frozen: false,
            token_extensions: null,
          },
        ];

    if (tokenAccounts.length === 0) return [];

    // 获取资产详情
    const fetchAssetInfo = async (tokenAccount: TokenAccounts) => {
      try {
        const assetInfo = await heliusClient.rpc.getAsset({ id: tokenAccount.mint as string });
        return {
          owner: tokenAccount.owner!,
          mint: tokenAccount.mint!,
          balance: parseFloat(((tokenAccount.amount ?? 0) / LAMPORTS_PER_SOL).toFixed(9)),
          symbol: assetInfo?.content?.metadata?.symbol || "Unknown Token",
          name: assetInfo?.content?.metadata?.name || "--",
          logo: assetInfo?.content?.links?.image || "",
        };
      } catch {
        return {
          owner: tokenAccount.owner!,
          mint: tokenAccount.mint!,
          balance: parseFloat(((tokenAccount.amount ?? 0) / LAMPORTS_PER_SOL).toFixed(9)),
          symbol: "Unknown Token",
          name: "--",
          logo: "",
        };
      }
    };

    return await Promise.all(tokenAccounts.map(fetchAssetInfo));
  } catch (error) {
    console.error("Error fetching token accounts and asset info:", error);
    return [];
  }
};
