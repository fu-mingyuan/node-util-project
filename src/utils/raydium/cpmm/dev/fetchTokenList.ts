import { ApiV3Token } from "@raydium-io/raydium-sdk-v2";
import { TokenInfo } from "@solana/spl-token-registry/dist/main/lib/tokenlist";
import RaydiumClient from "@/utils/raydium/raydiumClient";

export interface TokenListResponse {
  mintList: ApiV3Token[];
  blacklist: string[];
  whiteList: string[];
}

/**
 * 获取 token list
 */
export const fetchTokenListByRaydium = async () => {
  try {
    const raydium = await RaydiumClient.getInstance(undefined, { loadToken: true });
    const tokenListResponse: TokenListResponse = await raydium.api.getTokenList();
    return tokenListResponse;
  } catch (error) {
    throw new Error(`fetchToken list failed: ${error}`);
  }
};

export const fetchTokenList = async () => {
  try {
    // const { cluster } = HeliusClient.getCurrentNetwork();
    // const env = cluster === "mainnet-beta" ? 101 : 103 // 103：devnet | 101：mainnet
    // const tokens = await new TokenListProvider().resolve()
    // const tokenListResponse: TokenInfo[] = tokens.filterByChainId(env).getList()
    const tokenListResponse: TokenInfo[] = [];

    // const raydium = await RaydiumClient.getInstance();
    // const tokenListResponse: TokenInfo[] = raydium.token.tokenList;

    // 自定义的 Token 信息
    const customToken: TokenInfo[] = [
      {
        chainId: 0,
        address: "AAUktMuxhC4US7oajnZyhE8aXa3MU5FqJAYLuu6jddoa",
        symbol: "M-GOLD",
        name: "M-GOLD Token",
        decimals: 9,
        logoURI: "https://fu-mingyuan.github.io/blockchain-file/m-gold-logo.svg",
        extensions: {},
      },
      {
        chainId: 0,
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "SOL Token",
        decimals: 9,
        logoURI:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        extensions: {},
      },
      {
        chainId: 0,
        address: "kgmtSDFhF3DKbe6nB24GZzecv1ajyQwKuUBKyUA3NAA",
        symbol: "KGOLD",
        name: "KGOLD Token",
        decimals: 9,
        logoURI: "https://github-raw.s3.ap-northeast-1.amazonaws.com/icon2_512.png",
        extensions: {},
      },
    ];

    // 将自定义 Token 插入到列表的最前面
    tokenListResponse.push(...customToken);
    return tokenListResponse;
  } catch (error) {
    throw new Error(`fetchToken list failed: ${error}`);
  }
};
