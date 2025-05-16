import HeliusClient from "@/utils/helius/heliusClient";
import { PublicKey } from "@solana/web3.js";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  const heliusClient = HeliusClient.getInstance();

  const allMints = [
    // new PublicKey("So11111111111111111111111111111111111111112"),
    "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    // new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    // new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
    // new PublicKey("3bRTivrVsitbmCTGtqwp7hxXPsybkjn4XLNtPsHqa3zR"),
  ];

  const assetsInfo = await heliusClient.rpc.getAsset({ id: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN" });
  console.log(JSON.stringify(assetsInfo.token_info, null, 2));

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
