/**
 * @fileoverview 用于保存和获取用户的钱包信息。
 * 使用 Dexie 库与 IndexedDB 进行交互，提供了保存、获取和删除钱包信息的功能。
 * 1. saveWalletInfo：保存当前用户的钱包信息。
 * 2. getWalletInfo：获取当前用户的钱包信息。
 * 3. deleteWalletInfo：删除当前用户的钱包信息。
 */
import Dexie, { Table } from "dexie";

interface Wallet {
  WALLET_PUBLIC_KEY: string;
  ENCRYPTION_DATA: string;
}

class WalletDatabase extends Dexie {
  wallets!: Table<Wallet>;

  constructor() {
    super("fd_wallets");
    this.version(1).stores({
      wallets: "WALLET_PUBLIC_KEY",
    });
  }

  /**
   * 保存当前用户的钱包信息
   * @param walletData 钱包数据对象
   * @param publicKey
   * @returns 保存操作的结果
   */
  async saveWalletInfo(walletData: Wallet, publicKey?: string): Promise<string> {
    try {
      await this.wallets.put(walletData, publicKey);
      return "Wallet information saved successfully";
    } catch (error) {
      throw new Error(`Failed to save wallet information: ${error}`);
    }
  }

  /**
   * 获取当前用户的钱包信息
   * @param publicKey 钱包的公钥
   * @returns 钱包信息或 null
   */
  async getWalletInfo(publicKey: string): Promise<Wallet | null> {
    try {
      const wallet = await this.wallets.get(publicKey);
      return wallet || null;
    } catch (error) {
      throw new Error(`Failed to retrieve wallet information: ${error}`);
    }
  }

  /**
   * 删除当前用户的钱包信息
   * @returns 删除操作的结果
   */
  async deleteWalletInfo(publicKey: string): Promise<string> {
    try {
      await this.wallets.delete(publicKey);
      return "Wallet information deleted successfully";
    } catch (error) {
      throw new Error(`Failed to delete wallet information: ${error}`);
    }
  }
}

const idb = new WalletDatabase();

export default idb;
