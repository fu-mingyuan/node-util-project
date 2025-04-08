import { NATIVE_MINT } from "@solana/spl-token";

(async () => {
  console.log(`\n\x1b[1m\x1b[34m================ start ================\x1b[0m`);

  const inputMint = NATIVE_MINT.toBase58();
  const outputMint = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"; // RAY

  const [isInputSol, isOutputSol] = [inputMint === NATIVE_MINT.toBase58(), outputMint === NATIVE_MINT.toBase58()];

  console.log(isInputSol);
  console.log(isOutputSol);

  console.log(`\n\x1b[1m\x1b[34m================ end ================\x1b[0m`);
})();
