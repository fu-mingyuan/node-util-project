import { PublicKey } from "@solana/web3.js";
import HeliusClient from "@/utils/helius/heliusClient";
import { fetchAssociatedTokenAddress } from "@/utils/helius/fetchAssociatedTokenAddress";
import { getAccount } from "@solana/spl-token";
import { getMultipleAccountsInfo } from "@raydium-io/raydium-sdk-v2";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  const publicKey = new PublicKey("28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY");
  // const jupiterMint = new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN");
  const likeMint = new PublicKey("3bRTivrVsitbmCTGtqwp7hxXPsybkjn4XLNtPsHqa3zR");
  const tokenAccount = new PublicKey("58rCe4ghD2MQrAA3SQ9GJtqiqsWsuCCgJvBrpoeUgrcN");

  // const JupiterATA = await fetchAssociatedTokenAddress(publicKey, jupiterMint);
  // console.log("ata -->:", JupiterATA.toBase58());

  const helius = HeliusClient.getInstance();
  // const assetInfo = await helius.rpc.getAsset({ id: likeMint.toBase58() });
  // console.log("assetInfo-->: ", JSON.stringify(assetInfo, null, 2));

  // const accountInfo = await helius.connection.getAccountInfo(likeMint);
  // console.log("getAccountInfo-->: ", JSON.stringify(accountInfo, null, 2));
  // const parsedAccountInfo = await helius.connection.getParsedAccountInfo(likeMint);
  // console.log("getParsedAccountInfo--> ;", JSON.stringify(parsedAccountInfo, null, 2));

  const allMints = [
    // new PublicKey("So11111111111111111111111111111111111111112"),
    new PublicKey("6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"),
    // new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
    // new PublicKey("3bRTivrVsitbmCTGtqwp7hxXPsybkjn4XLNtPsHqa3zR"),
  ];

  const tokenAccounts = [
    new PublicKey("28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY"),
    // new PublicKey("34Ndo9BLE6yiqEqNhX7tCAWHLxUBs8X23p5jMcDYeUcn"),
    // new PublicKey("GgF3RcaohstbK3xoMa2TacswNu5foQXbNX9opLWmKgh4"),
    // new PublicKey("C1SWdxKJA8GZZ9xgGYEcyNrdw47afu8wB9KynimvkJAn"),
    // new PublicKey("E5mt7S6oncRjuHtRxwgEdiv3AQ5aAMu1RThUm25yyNBm"),
    // new PublicKey("2PkFYJpyum86qkAM46hZ7bNvUGq157RoaPKFrgTAWLub"),
    // new PublicKey("AHjp1ueCTEbQdiaFz4z6aykywUAq8fyNnN4EanNQZYyf"),
    // new PublicKey("Az5BhktvtP7nPUqtFypCWW4P1ucYE8DxrNJV3LcsQo55"),
    // new PublicKey("7aGGCMYj3VK471iMU3o4BfCtp1utuouJXCug4DBvA7BB"),
    // new PublicKey("4Awdmm6YaJdqUs9fBaK4NAeyyujZFXkFRAg4kKre3wZC"),
    // new PublicKey("EZt1U46U5XCrZX5aEY6bzfGWf8kJw5DaX9Cat2oqF16n"),
    // new PublicKey("3oZJxqrG8s6KGfCKnmcyM9GtaXFrsnXYzJcaaexGccBu"),
    // new PublicKey("G5Lk8DeezphQLsVBwDVZQLtnaVi1i7RiFUircNv3j6Fx"),
    // new PublicKey("Q7UFU9VeeTCuMVGJdp6bukcySc2LVrafhcnAM6SPG9W"),
    // new PublicKey("2LUJugRCHHo8gcJkQtGivx4LbRZKPRDZua5BoMUz1Z5B"),
    // new PublicKey("Du8Y273Am9usjNcCwx7kAjMWkgZthfyqFcrmue9YYaEe"),
    // new PublicKey("2Fwm8M8vuPXEXxvKz98VdawDxsK9W8uRuJyJhvtRdhid"),
    // new PublicKey("8LoHX6f6bMdQVs4mThoH2KwX2dQDSkqVFADi4ZjDQv9T"),
    // new PublicKey("7rXsNqBkFoiNPJYxhZHu9EGUMsY4j4tA2DhefvNbzQzs"),
    // new PublicKey("DnjwFMvwiLBABws6JpVpAUTyBV9wmucjAMxdnxAVFH92"),
  ];

  const parseATA = await helius.connection.getMultipleParsedAccounts(allMints);


  // const parseATA = await getAccount(helius.connection, tokenAccount);
  console.log("parseATA-->: ", parseATA);
  console.log("parseATA-->: ", JSON.stringify(parseATA, null, 2));

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
