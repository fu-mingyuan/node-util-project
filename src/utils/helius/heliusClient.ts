// Helius 连接管理器（单例模式）
import {
  DEFAULT_CLUSTER_NETWORK,
  HELIUS_API_KEY,
  HELIUS_NETWORKS,
  IHeliusNetworkConfig,
} from "@/utils/helius/helius.config";
import { Helius } from "helius-sdk";
import { Cluster } from "@solana/web3.js";

class HeliusClient {
  private static instance: Helius;
  private static network: IHeliusNetworkConfig;

  // 获取 Helius SDK 客户端
  public static getInstance(cluster?: Cluster): Helius {
    if (!this.instance || (cluster && cluster !== this.network.cluster)) {
      const network = HELIUS_NETWORKS[cluster || DEFAULT_CLUSTER_NETWORK];
      this.network = network;
      this.instance = new Helius(HELIUS_API_KEY, network.cluster);
    }
    return this.instance;
  }

  // 获取当前网络配置
  public static getCurrentNetwork(): IHeliusNetworkConfig {
    return this.network || HELIUS_NETWORKS[DEFAULT_CLUSTER_NETWORK];
  }
}

export default HeliusClient;
