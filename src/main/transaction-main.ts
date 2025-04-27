import { sendTransaction } from "@/utils/helius/sendTransaction";
import { Keypair, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  // KGOLD MAIN_NET SOL 支付账户
  // HiLexvcqG6hkTK72tMNYcvKfJLm7vxJAYyZhmAZM2WVm
  // 0803f200594fb47ce48c9a73e039f74495c0901e615132b19fa3b9508451b1ed495f282885aef9c08d3d68957b30f0a9e5540f9f1cdc95a0e36441a4f676ffd5a6827afc09e45e72f2a6429066074f9d0531ef0e1d75853455ab99bfdfcf6757d05c5962e522111f72b68cd88a87469eea1ca6da624e4180678dcb798112877bb057c48d4a54f1816ab20c78e495cfb266a83aa7c0e5703cefd4806a5fecdd116a3143bcd28fe0cf8124c24bf83ec32a83a63c55b0a0a3673b5748741691748c66c4b288aa1289cea3fd3cbbfd181db12c8172968b04a3ccd7f167aa42d8ace137f19d948942a2cbfc3aa45a91e417f60b07d22d7d2bf207c230ace5cfa1acf760bd
  // 080257006e81d8a3b8f7ecce4b255154e60fe06cb559d78aea9925a2f885de0c85b630340d3fae80f6ddbb46520ba00b4d3e0afae312e6b0492a7e4ba4a9aa7fc42ea77e0ee39fa957ce7c1b44f1811d06d541f8166a0d556645eeb561a6b18f6bf46e264d671e955ca9039207ed8f974745c49cb7747e0bb1f679ecfe7dfa2a2b5b73b8874655164c5d0842b8498a0c449c2c93809fab9e41650bdd6a7896b34c5189f79cfa4b55fe3477bd5be38245090428f32b58c20fd9197006effc58af4481dc87cc530515c2e228945ddc16f5c31e5c7df2e3c21d9ad1b1df7c80c8afd1b21d3e05443724a8f6336b15661a4ef99c9cd256c0576577d1c8868a35c85140d6
  // 0801a50037ce6cdf5c7a7614ab01a664734370fad441e5c775d79ca97ce46f32cc901810889157407be0d32e294650f0a8800555ff5d7380aaf83f6752d5559c62c7dde507eac1d9a5763e9b22f6ce8003e4aeff0b4b88f6336a77abbe1dd6fabb1137eaa8a80f162e888f4c8d53c98cadae6256d53a3f8bd67bb24e7fcc7dd99b4fb7e7cd70a4b22671040c5c3045d322c016cf4011db65aeab8b1935d94b4826f1ca2a4e65abe67f04b5baa39941f48aff14049b4d61b7e2cb3890f94b2cca224e6e9666908c6561c314e5a08d0b39efa22e5d79d761734db1d6403e68647de67780dd8c4e950854bf973884fd0d9bf22c4ece2be0a5c3b5ef6423459464a6206b

  // 有 SOL 钱包信息
  // SOL wallet 28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY : eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621

  // const keypair = KeypairUtils.generateKeypair();
  // console.log("publicKey", keypair.publicKey.toBase58());
  // const hexSecretKey = Buffer.from(keypair.secretKey).toString("hex");
  // console.log("secretKey (hex)", hexSecretKey);

  const walletPrivateKey =
    "eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621";
  const senderKeypair = Keypair.fromSecretKey(Buffer.from(walletPrivateKey, "hex"));

  const recipientPublicKey = new PublicKey("HeowchgMQytKSXUXDJKiAGMGkrvfPv1nZZZztjWcczwU");
  // 转少量 SOL 给对方账户
  // await sendTransaction(senderKeypair, recipientPublicKey, 0.01, NATIVE_MINT);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
