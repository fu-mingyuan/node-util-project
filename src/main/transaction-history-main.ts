import { fetchSignaturesForAddress } from "@/utils/helius/fetchSignaturesForAddress";
import { PublicKey } from "@solana/web3.js";
import {  fetchTransactionHistory } from "@/utils/helius/fetchTransactionHistory";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  // const publicKey = new PublicKey("33XQkrJ4NHNfdeRGw9Vp1ndLq7dQ75D3Je94v7ZF1fv6");
  const publicKey = new PublicKey("28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY");

  // raydium mint
  // const mint = new PublicKey("7X4J7t42B8t96MAcwZrgw5aRTJbBcMirpgfqCs3LFVJD");
  // jupiter
  const mint = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
  // OFFICIAL TRUMP
  // const mint = new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN");
  // const ata = await fetchAssociatedTokenAddress(publicKey, mint, TOKEN_PROGRAM_ID);
  // console.log(ata.toBase58());
  // console.log(await parseATAInfo());

  const beforeSignature = null;
  const limitValue = 3;
  const limit = limitValue ? limitValue : undefined;

  const signaturesInfo = await fetchSignaturesForAddress(publicKey, beforeSignature, limit);
  // console.log(JSON.stringify(signaturesInfo, null, 2));
  await fetchTransactionHistory(publicKey,signaturesInfo);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
