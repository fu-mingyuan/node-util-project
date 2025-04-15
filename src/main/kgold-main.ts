import { Keypair, PublicKey } from "@solana/web3.js";
import { sendSOL } from "@/utils/helius/sendSOL";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  // SOL wallet 28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY : eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621
  const walletPrivateKey =
    "eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621";
  const senderKeypair = Keypair.fromSecretKey(Buffer.from(walletPrivateKey, "hex"));

  // KGOLD MAIN_NET SOL 支付账户
  const recipient = new PublicKey("9S6aYXub8YDbrrcmomsvSdym6esGvFDGpHnYFfQ3QiMK");
  await sendSOL(senderKeypair, recipient, 0.05);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
