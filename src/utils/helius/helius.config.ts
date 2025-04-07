import { Cluster } from "@solana/web3.js";

export interface IHeliusNetworkConfig {
  endpoint: string;
  cluster: string;
}

// Helius API Key
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
if (!HELIUS_API_KEY) {
  throw new Error("Helius API Key is missing. Set HELIUS_API_KEY in your .env file.");
}

// 确保环境变量 SOLANA_CLUSTER 只允许有效值
export const ENV_CLUSTER = process.env.SOLANA_CLUSTER as Cluster | undefined;
export const DEFAULT_CLUSTER_NETWORK: Cluster =
  ENV_CLUSTER && ["mainnet-beta", "devnet"].includes(ENV_CLUSTER) ? ENV_CLUSTER : "devnet";

// 预定义 Helius 网络配置
export const HELIUS_NETWORKS: Record<Cluster, IHeliusNetworkConfig> = {
  "mainnet-beta": {
    endpoint: `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    cluster: "mainnet-beta",
  },
  devnet: {
    endpoint: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    cluster: "devnet",
  },
  testnet: {
    endpoint: `https://testnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    cluster: "testnet",
  },
};
