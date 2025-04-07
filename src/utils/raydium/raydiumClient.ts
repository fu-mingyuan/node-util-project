import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Keypair, PublicKey } from "@solana/web3.js";
import { CLUSTER, RAYDIUM_CONNECTION } from "@/utils/raydium/raydium.config";

class RaydiumClient {
  private static instances: Map<string, Raydium> = new Map();

  private constructor() {}

  public static async getInstance(
    owner?: Keypair | PublicKey,
    params: {
      loadToken?: boolean;
    } = {},
  ): Promise<Raydium> {
    // const instanceKey = owner ? owner.publicKey.toBase58() : "__GLOBAL_INSTANCE__";
    const instanceKey = owner
      ? owner instanceof PublicKey
        ? owner.toBase58()
        : owner.publicKey.toBase58()
      : "__GLOBAL_INSTANCE__";

    if (RaydiumClient.instances.has(instanceKey)) {
      return RaydiumClient.instances.get(instanceKey)!;
    }

    try {
      const raydium = await Raydium.load({
        owner,
        connection: RAYDIUM_CONNECTION,
        cluster: CLUSTER,
        disableFeatureCheck: true,
        disableLoadToken: !params?.loadToken,
        blockhashCommitment: "finalized",
      });

      RaydiumClient.instances.set(instanceKey, raydium);

      // if (owner) {
      //   const ownerKey = owner instanceof PublicKey ? owner : owner.publicKey;
      //   await RaydiumClient.monitorTokenAccounts(ownerKey, raydium);
      // }

      return raydium;
    } catch (error) {
      throw new Error(`Failed initializing Raydium SDK: ${error}`);
    }
  }

  /**
   * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
   * if you want to handle token account by yourself, set token account data after init sdk
   * code below shows how to do it.
   * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
   */

  // private static async monitorTokenAccounts(owner: PublicKey, raydium: Raydium) {
  //   try {
  //     const tokenAccountData = await fetchTokenAccountData(owner);
  //     raydium.account.updateTokenAccount(tokenAccountData);
  //
  //     RAYDIUM_CONNECTION.onAccountChange(owner, async () => {
  //       try {
  //         const updatedTokenAccountData = await fetchTokenAccountData(owner);
  //         raydium.account.updateTokenAccount(updatedTokenAccountData);
  //       } catch (updateError) {
  //         console.error(`Failed to update token account data:`, updateError);
  //       }
  //     });
  //   } catch (tokenError) {
  //     console.error(`Failed to fetch token account data:`, tokenError);
  //   }
  // }
}

// const fetchTokenAccountData = async (owner: PublicKey) => {
//   const solAccountResp = await RAYDIUM_CONNECTION.getAccountInfo(owner);
//   const tokenAccountResp = await RAYDIUM_CONNECTION.getTokenAccountsByOwner(owner, {
//     programId: TOKEN_PROGRAM_ID,
//   });
//   const token2022Req = await RAYDIUM_CONNECTION.getTokenAccountsByOwner(owner, {
//     programId: TOKEN_2022_PROGRAM_ID,
//   });
//   return parseTokenAccountResp({
//     owner: owner,
//     solAccountResp,
//     tokenAccountResp: {
//       context: tokenAccountResp.context,
//       value: [...tokenAccountResp.value, ...token2022Req.value],
//     },
//   });
// };

export default RaydiumClient;
