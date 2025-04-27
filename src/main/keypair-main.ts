import { Keypair } from "@solana/web3.js";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  // const secretKey: Uint8Array = [4,209,251,18,113,51,42,89,253,41,152,191,14,30,109,81,136,191,61,74,82,192,103,13,182,183,155,89,236,231,251,109,40,155,4,24,93,82,92,104,148,196,125,70,202,88,54,170,81,178,151,168,222,248,50,126,162,66,234,185,150,56,180,227]
  // const keypair = Keypair.fromSecretKey(secretKey);
  // console.log(keypair.publicKey.toBase58())
  const byteArray = [
    4, 209, 251, 18, 113, 51, 42, 89, 253, 41, 152, 191, 14, 30, 109, 81, 136, 191, 61, 74, 82, 192, 103, 13, 182, 183,
    155, 89, 236, 231, 251, 109, 40, 155, 4, 24, 93, 82, 92, 104, 148, 196, 125, 70, 202, 88, 54, 170, 81, 178, 151,
    168, 222, 248, 50, 126, 162, 66, 234, 185, 150, 56, 180, 227,
  ];

  const secret = new Uint8Array(byteArray);
  const keypair = Keypair.fromSecretKey(secret);
  console.log(keypair.publicKey.toBase58());


  // publicKey: CwUt9mLQNZvKtiviratTKjkMo5ZVDhJVDWAZjDoHiMgZ
  // const byteArray =[46,215,21,104,182,231,19,25,96,59,84,249,138,118,163,18,93,201,193,214,11,219,130,195,100,148,169,12,140,127,69,153,177,101,114,49,39,14,123,167,216,182,250,72,188,239,17,220,79,176,190,31,152,248,196,139,102,159,40,151,44,236,149,238];

  // byteArray.forEach((byte, index) => {
  //   const binaryStr = byte.toString(2).padStart(8, "0");
  //   console.log(`Byte ${index}: ${binaryStr}`);
  // });
  //
  // const hexString = byteArray.map((byte) => byte.toString(16).padStart(2, "0")).join(""); // 拼接成一整串
  //
  // console.log(hexString); // 输出: "04d1fb12"

  // const keypair = KeypairUtils.generateKeypair();
  // console.log("publicKey", keypair.publicKey.toBase58());
  // const hexSecretKey = Buffer.from(keypair.secretKey).toString("hex");
  // console.log("secretKey (hex)", hexSecretKey);

  // SOL wallet 28Ugregs5fcicetCw6SCx2a2XbMHCTX9VWpMPCWrCkLY : eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621
  // DB: 08019821c6d62eb55aeb033024469eaabd392503dd4b6b8af94c3c0325036fb6e4c32dca28bd13c33b6db197432055fd499e5926b736788d3c2895be9f133f7b33a2d00fe04cf6681ae59bebba2b5a6f19c5a53db166a5b46f1be0487d14070b8b9ac0345431a43c04f40f69ebea2fdb1b01294769264f44111fc7b26f1bf9ece6bb66652d15a709209ef1d3b9363936a6804f4bc69ecf6150b63eb73ec7b87b6ce821f204d4a8a0c6d709b265140a2619aa9cebcb9315ad237b957203db97e6bf6c30748c1556c791ce3f3b91fe92f6455bf8836d3f2544513890da43a448b9102a3730467b39b354d443dbad5a27d64c89c184002ca264f921094d5f7c12aa1f4a
  // 08022d4291b15c77b4c8060e4834218467534a2ca7aad6f3ef7778424adcdeb0d5085a9d5067269b76da7ffa8665aa0c92d3b2e2736af00a786d370723bf7ee66628bdb1ddcaf1ae34352bfb6956b4de329757b97fc857ecde80dde8fa240ee10b1c9de1a878553008f61e93cb2d5e29363f52bed24c9e88223e931bdea8ef76d15ccc945a9853d94095ffd86f04725551019eda91c9837ca09d7c4e7cd56de6d808429f08734d82911312c4ca07145d32c725f48be72ac946c13701064b33e6630d60bc05c5ac363fe77e693fd239d48a01ed6ada464a9ba23f3d2e8610900d20ac6ea38c04723ea8bc86b9477b4e0e98ab9ff2007c59f0ef38125abef824493e94
  // 0803b563576772c2ee2205ef6c1abf9eda756fc27af5bd2f1695447d6f62b1b231ba775b78da35584db7ce2ac5adffa8dbe8eb55c45e887744a5a29bbcdb416655a56ddb3d4307ec2e8eb000d37deeb12b52f2c5ce59f22fb1023d888734094c80955d59fcb4f1340c0311c5209b718c2dde7be9bb6ad1cc3321547cb13216003701aa3077e3f46260670e2ad6e14b74f77ed15e570f4c77f084421942dbd566b4a3634f0ce5e59c57a41b1daffd1e742b17b90a40cb3f1e655ca2db053ba4e6dcd9500f897efa92ae0b41acae3dabcacf3715c6b79a6f25f3c9ad89c57cd861302559d2cada4b45fc6fc56cea646946d4b55e2b004cfb7716c41b57e18436e321de

  // const privateKey = "eb8e1b7c5a7ca40f17dd5242abd1df9a2b245857e2df3ba7bcc3f7b46811736010c60efed8616214a1953e1415385ea68b7ed1a5aabb87fe20a03949a28ba621";
  // const privateKeyPair = Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));

  // console.log(KeypairUtils.encryptAndSplitPrivateKey(privateKeyPair, "Rd123123"));
  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
