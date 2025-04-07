/**
 * @fileOverview 密钥对操作工具
 * 用于拆分/还原私钥等操作
 */
import { Keypair } from "@solana/web3.js";
import * as crypto from "crypto";
import { combine, split } from "shamirs-secret-sharing-ts";
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";

export class KeypairUtils {
  // 生成密钥对
  static generateKeypair(): Keypair {
    return Keypair.generate();
  }

  // 使用 PBKDF2 派生密钥
  static deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, 100000, 32, "sha256");
  }

  // 加密数据
  static encrypt(
    data: string,
    password: string,
  ): {
    encrypted: string;
    salt: string;
    iv: string;
  } {
    const salt = randomBytes(16);
    const iv = randomBytes(16);
    const key = this.deriveKey(password, salt);

    const cipher = createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted + "." + authTag.toString("base64"),
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
    };
  }

  // 解密数据
  static decrypt(encryptedData: string, salt: string, iv: string, password: string): string {
    const [encrypted, authTag] = encryptedData.split(".");
    const key = this.deriveKey(password, Buffer.from(salt, "base64"));

    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  // 加密、拆分私钥
  static encryptAndSplitPrivateKey(keypair: Keypair, password: string): string[] {
    const privateKey = keypair.secretKey;
    const privateKeyBuffer = Buffer.from(privateKey);
    // 对私钥进行加密处理
    const encryptedBuffer = this.encryptPrivateKeyWithFixedSaltIv(privateKeyBuffer, password);
    // 根据私钥生成伪随机数(相同私钥生成随机数相同)
    const deterministicRandom = (key: Buffer, password: string) => {
      let counter = 0;
      return (size: number): Buffer => {
        const hmac = crypto.createHmac("sha256", key);
        hmac.update(password);
        hmac.update(Buffer.from(counter.toString()));
        counter += 1;
        return hmac.digest().subarray(0, size);
      };
    };

    // 将私钥拆分为 3 份，阈值为2（恢复需要 3 份中的任意 2 份）
    const shares = split(encryptedBuffer, {
      shares: 3,
      threshold: 2,
      random: deterministicRandom(privateKeyBuffer, password), // 正确传递闭包
    });

    // 验证返回值
    if (!Array.isArray(shares) || shares.length !== 3) {
      throw new Error(
        `Failed to generate key shares: expected 3 shares, but got ${shares?.length || 0}`,
      );
    }

    // 验证并转换每个 share 为 hex 字符串
    return shares.map((share) => {
      if (!Buffer.isBuffer(share)) {
        throw new Error(`Invalid share format: expected Buffer, got ${typeof share}`);
      }
      return share.toString("hex");
    });
  }

  // 还原、解密私钥
  static combineAndDecryptPrivateKey(
    privateKeyShares: Buffer[],
    password: string,
    publicKey: string,
  ): Buffer {
    try {
      // 恢复完整的私钥加密数据
      const restoredBuffer = combine([privateKeyShares[0], privateKeyShares[1]]);
      // console.log('恢复的加密数据:', restoredBuffer.toString('hex'));

      // 解密私钥
      const decryptedKeyBuffer = this.decryptPrivateKeyWithFixedSaltIv(restoredBuffer, password);
      // console.log('解密后的私钥:', decryptedKeyBuffer.toString('hex'));

      // 通过私钥生成公钥
      const keypairFromPrivateKey = Keypair.fromSecretKey(decryptedKeyBuffer);
      const generatedPublicKey = keypairFromPrivateKey.publicKey;

      // console.log('解密后的公钥:', generatedPublicKey.toString());
      // 比较公钥
      const isValid = generatedPublicKey.toString() === publicKey;
      console.log(isValid ? "公钥和私钥匹配" : "公钥和私钥不匹配");
      if (!isValid) {
        throw "Private key restore failed";
      } else {
        return decryptedKeyBuffer;
      }
    } catch {
      throw "Private key restore failed";
    }
  }

  // 派生固定的 salt 和 iv
  static deriveSaltAndIvFromPrivateKey(privateKey: Buffer) {
    const salt = crypto
      .createHash("sha256")
      .update(privateKey.toString("hex") + "pseudo-salt")
      .digest()
      .subarray(0, 16); // 16 字节的 salt
    const iv = crypto
      .createHash("sha256")
      .update(privateKey.toString("hex") + "pseudo-iv")
      .digest()
      .subarray(0, 12); // 12 字节的 iv
    return { salt, iv };
  }

  // 加密函数
  static encryptPrivateKeyWithFixedSaltIv(privateKey: Buffer, password: string): Buffer {
    // 生成 salt 和 iv
    const { salt, iv } = this.deriveSaltAndIvFromPrivateKey(privateKey);
    // 通过密码和 salt 生成密钥
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
    // 创建加密器
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 将每部分数据加上长度信息拼接
    return Buffer.concat([
      this.encodeLengthAndData(encrypted),
      this.encodeLengthAndData(authTag),
      this.encodeLengthAndData(salt),
      this.encodeLengthAndData(iv),
    ]);
  }

  // 辅助函数：将数据加上长度前缀（4 字节）
  static encodeLengthAndData(data: Buffer): Buffer {
    const lengthBuffer = Buffer.alloc(4); // 4 字节长度
    lengthBuffer.writeUInt32BE(data.length); // 大端存储长度
    return Buffer.concat([lengthBuffer, data]); // 长度 + 数据
  }

  // 解密私钥
  static decryptPrivateKeyWithFixedSaltIv(encryptedBuffer: Buffer, password: string): Buffer {
    let offset = 0;

    // 辅助函数：解析长度标记和数据
    function decodeLengthAndData(buffer: Buffer): Buffer {
      const length = buffer.readUInt32BE(offset); // 读取长度（4 字节）
      offset += 4; // 跳过长度字段
      const data = buffer.subarray(offset, offset + length); // 使用 subarray 替代 slice
      offset += length; // 跳过数据字段
      return data;
    }

    // 解析每部分数据
    const encrypted = decodeLengthAndData(encryptedBuffer);
    const authTag = decodeLengthAndData(encryptedBuffer);
    const salt = decodeLengthAndData(encryptedBuffer);
    const iv = decodeLengthAndData(encryptedBuffer);

    // 通过密码和 salt 生成密钥
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
    // 创建解密器
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag); // 设置认证标签
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
