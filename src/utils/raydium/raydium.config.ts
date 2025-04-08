import {
  CREATE_CPMM_POOL_FEE_ACC,
  CREATE_CPMM_POOL_PROGRAM,
  DEVNET_PROGRAM_ID,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";
import { Connection } from "@solana/web3.js";
import HeliusClient from "@/utils/helius/heliusClient";

// 获取 Helius 网络配置
const { cluster, endpoint } = HeliusClient.getCurrentNetwork();
export const CLUSTER = cluster === "mainnet-beta" ? "mainnet" : "devnet";
export const CONNECTION = new Connection(endpoint, "confirmed");
export const CPMM_POOL_PROGRAM_ID =
  cluster === "mainnet-beta" ? CREATE_CPMM_POOL_PROGRAM : DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM;
export const CPMM_POOL_FEE_ACC_ACCOUNT =
  cluster === "mainnet-beta" ? CREATE_CPMM_POOL_FEE_ACC : DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC;
// 交易版本
export const TX_VERSION = TxVersion.V0; // or TxVersion.LEGACY
