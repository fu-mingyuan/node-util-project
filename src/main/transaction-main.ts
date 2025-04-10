import { fetchAccounts } from "@/utils/helius/fetchAccounts";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { PublicKey } from "@solana/web3.js";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  const sender = new PublicKey("33XQkrJ4NHNfdeRGw9Vp1ndLq7dQ75D3Je94v7ZF1fv6");
  const recipient = new PublicKey("28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY");

  const token = new PublicKey("3bRTivrVsitbmCTGtqwp7hxXPsybkjn4XLNtPsHqa3zR");

  const senderATAAddress = await fetchAssociatedTokenAddress(sender, token);
  const recipientATAAddress = await fetchAssociatedTokenAddress(recipient, token);


  // 检查接收方是否已经存在 ATA 账户
  const tokenAccountsResponse = await fetchAccounts(recipient);
  console.log(tokenAccountsResponse);


  const hasMint: boolean | undefined = tokenAccountsResponse?.token_accounts?.some(
    (account) => account.mint === token.toBase58(),
  );

  console.log(hasMint);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
