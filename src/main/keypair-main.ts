import { KeypairUtils } from "@/utils/keypairUtils";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  const keypair = KeypairUtils.generateKeypair();
  console.log("publicKey", keypair.publicKey.toBase58());
  const hexSecretKey = Buffer.from(keypair.secretKey).toString("hex");
  console.log("secretKey (hex)", hexSecretKey);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
