import { Keypair, PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccount } from "@/utils/helius/createAssociatedTokenAccount";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  // SOL wallet 28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY : eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621
  const walletPrivateKey = "eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621";

  //const sender = new PublicKey("HiLexvcqG6hkTK72tMNYcvKfJLm7vxJAYyZhmAZM2WVm");
  const sender = new PublicKey("CwUt9mLQNZvKtiviratTKjkMo5ZVDhJVDWAZjDoHiMgZ");
  // KGOLD MAIN_NET
  const token = new PublicKey("FSNEUhqy4LUQ6UJECGtZ1n419t1HCqSt5LQmrfRdwbWg");


  const feePayerKeypair = Keypair.fromSecretKey(Buffer.from(walletPrivateKey, "hex"));
  await createAssociatedTokenAccount(sender, token, feePayerKeypair);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
