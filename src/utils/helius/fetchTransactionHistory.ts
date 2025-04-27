import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, type TransactionError } from "@solana/web3.js";
import HeliusClient from "@/utils/helius/heliusClient";
import { AccountLayout, getAccount, MintLayout, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { EnrichedTransaction } from "helius-sdk/dist/src/types/types";
import { parseLogs } from "@/utils/helpers";

export type SignaturesInfo = {
  blockTime: number;
  confirmationStatus: string;
  err: string;
  memo: string;
  signature: string;
  slot: number;
};

export type TransactionInfo = {
  signature: string;
  from: string;
  to: string;
  amount: number;
  memo: string | undefined;
  status: string;
  blockTime: number;
  sol: number;
  err: TransactionError | null;
};

export enum ActivityType {
  SENT = "Sent",
  RECEIVED = "Received",
  CREATED_TOKEN_ACCOUNT = "Created token account",
  SWAPPED = "swapped",
  UNKNOWN = "Unknown",
}

/**
 * 根据签名信息查询交易详情
 * @param owner
 * @param signaturesInfo[] 签名数据
 * @param mint  过滤条件
 */
export const fetchTransactionHistory = async (
  owner: PublicKey,
  signaturesInfo: SignaturesInfo[],
  mint?: PublicKey,
): Promise<TransactionInfo[]> => {
  try {
    const signaturesMemoMap = new Map(signaturesInfo.map((item) => [item.signature, item.memo]));
    const signaturesAddresses = signaturesInfo.map((address) => address.signature);

    const heliusClient = HeliusClient.getInstance();
    const parseTransactionsResponse = await heliusClient.parseTransactions({
      transactions: signaturesAddresses,
    });

    const filteredTransactions = mint
      ? parseTransactionsResponse.filter((tx) => {
          // 筛选数据 mint 相关的交易数据 且有效交易数据(有交易金额的：tokenBalanceChanges.length > 0)
          return tx.accountData.some(
            (account) =>
              account.tokenBalanceChanges &&
              account.tokenBalanceChanges.length > 0 &&
              account.tokenBalanceChanges.some((change) => change.mint === mint.toBase58()),
          );
        })
      : parseTransactionsResponse;

    // console.log(filteredTransactions.map((tx, index) => `${index}: ${tx.type}`));
    // console.log("------------------------------------------------------------");
    // console.log(filteredTransactions.map((tx, index) => `${index}: ${tx.source}`));
    // console.log("------------------------------------------------------------");
    // console.log(filteredTransactions.map((tx, index) => `${index}: ${JSON.stringify(tx.tokenTransfers, null, 2)}`));
    // console.log("------------------------------------------------------------");
    // console.log(filteredTransactions.map((tx, index) => `${index}: ${JSON.stringify(tx.accountData, null, 2)}`));
    // console.log("------------------------------------------------------------");
    console.log(filteredTransactions.map((tx, index) => `${index}: ${JSON.stringify(tx, null, 2)}`));

    const tokenSet = new Set<PublicKey>();
    filteredTransactions.forEach((tx) => {
      tx.nativeTransfers?.forEach((token) => {
        if (token.fromUserAccount) tokenSet.add(new PublicKey(token.fromUserAccount));
        if (token.toUserAccount) tokenSet.add(new PublicKey(token.toUserAccount));
      });
    });

    // console.log(await parseTokenType([...tokenSet]));

    return filteredTransactions.map((tx) => {
      // 交易时间
      const blockTime = tx.timestamp;
      // 交易结果
      const status = tx.transactionError ? "FAILED" : "SUCCESS";
      // 交易产生的手续费
      const sol = tx.fee / LAMPORTS_PER_SOL;
      // 交易留言
      const memo = signaturesMemoMap.get(tx.signature);
      const err = tx.transactionError || null;

      const { from, to, amount } = tx.accountData.reduce(
        (acc, account) => {
          account.tokenBalanceChanges?.forEach((change) => {
            const tokenAmount = BigInt(change.rawTokenAmount.tokenAmount);
            if (tokenAmount < 0) {
              acc.from = change.userAccount;
            } else if (tokenAmount > 0) {
              acc.to = change.userAccount;
              acc.amount = Number(change.rawTokenAmount.tokenAmount) / LAMPORTS_PER_SOL;
            }
          });
          return acc;
        },
        { from: "", to: "", amount: 0 },
      );

      return { signature: tx.signature, from, to, amount, memo, status, blockTime, sol, err };
    });
  } catch (error) {
    throw new Error(`parseTransactions: ${error}`);
  }
};

export type AccountType = "wallet" | "mint" | "tokenAccount" | "unknown";

export interface CategorizedAccountSimple {
  publicKey: PublicKey;
  type: AccountType;
}



export const parsePublicKeyType = async (addresses: PublicKey[]): Promise<CategorizedAccountSimple[]> => {
  const heliusClient = HeliusClient.getInstance();
  const accounts = await heliusClient.connection.getMultipleAccountsInfo(addresses);

  return accounts.map((account, i) => {
    const publicKey = addresses[i];
    if (!account) return { publicKey, type: "unknown" };
    const owner = account.owner;
    const len = account.data.length;

    if (owner.equals(SystemProgram.programId) && len === 0) {
      return { publicKey, type: "wallet" };
    }

    if (owner.equals(TOKEN_PROGRAM_ID) || owner.equals(TOKEN_2022_PROGRAM_ID)) {
      if (len === MintLayout.span) {
        return { publicKey, type: "mint" };
      }
      if (len === AccountLayout.span) {
        return { publicKey, type: "tokenAccount" };
      }
    }

    return { publicKey, type: "unknown" };
  });
};



export const parseATAInfo = async () => {
  const heliusClient = HeliusClient.getInstance();
  return await getAccount(heliusClient.connection, new PublicKey("58rCe4ghD2MQrAA3SQ9GJtqiqsWsuCCgJvBrpoeUgrcN"));
};

export const fetchTransactionActivity = async (signaturesInfo: SignaturesInfo[]) => {
  const heliusClient = HeliusClient.getInstance();
  const signatures = signaturesInfo.map((address) => address.signature);

  const transactionWithMeta = await heliusClient.connection.getParsedTransactions(signatures, {
    commitment: "finalized", // 或 "finalized"
    maxSupportedTransactionVersion: 0, // 视你项目支持的 TX 版本而定
  });

  console.log(signatures);

  transactionWithMeta.map((tx) => {
    const parsed = parseLogs(tx?.meta?.logMessages ?? []);
    // console.log(parsed.map((parse) => `${JSON.stringify(parse, null, 2)}`));
    const createOrderWithNonce = parsed.find(({ logMessages }) =>
      logMessages.includes("Instruction: CreateOrderWithNonce"),
    );

    if (createOrderWithNonce) {
      console.log("create", createOrderWithNonce);
    }

    const swapInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: Swap"));
    if (swapInstruction) {
      console.log("swap", swapInstruction);
    }
    const createOrderInstruction = parsed.find(({ logMessages }) =>
      logMessages.includes("Instruction: CreateOrderWithNonce"),
    );
    if (createOrderInstruction) {
      console.log("swap", createOrderInstruction);
    }

    const claimInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: Claim"));
    if (claimInstruction) {
      console.log("receive", claimInstruction);
    }

    const sendInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: Send"));
    if (sendInstruction) {
      console.log("send", sendInstruction);
    }

    const cancelInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: MakeFallback"));
    if (cancelInstruction) {
      console.log("cancel", cancelInstruction);
    }

    const sendUnlockInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: SendUnlock"));
    if (sendUnlockInstruction) {
      console.log("unlock send", sendUnlockInstruction);
    }

    const sendBatchUnlockInstruction = parsed.find(({ logMessages }) =>
      logMessages.includes("Instruction: SendBatchUnlock"),
    );
    if (sendBatchUnlockInstruction) {
      console.log("sendBatchUnlockInstruction", sendBatchUnlockInstruction);
    }
    const initExtCallInstruction = parsed.find(({ logMessages }) =>
      logMessages.includes("Instruction: InitExternalCallStorage"),
    );
    if (initExtCallInstruction) {
      console.log("initExtCallInstruction", initExtCallInstruction);
    }

    const fillExtCallInstruction = parsed.find(({ logMessages }) =>
      logMessages.includes("Instruction: FillExtcallStorage"),
    );
    if (fillExtCallInstruction) {
      console.log("fillExtCallInstruction", fillExtCallInstruction);
    }

    const execInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: ExecuteExtcall"));
    if (execInstruction) {
      console.log("execInstruction", execInstruction);
    }
    const fulfillInstruction = parsed.find(({ logMessages }) => logMessages.includes("Instruction: FulfillOrder"));
    if (fulfillInstruction) {
      console.log("fulfillInstruction", fulfillInstruction);
    }

    const cancelInstructionOrder = parsed.find(({ logMessages }) => logMessages.includes("Instruction: CancelOrder"));
    if (cancelInstruction) {
      console.log("cancelInstructionOrder", cancelInstructionOrder);
    }
    const sendOrderCancelInstruction = parsed.find(({ logMessages }) =>
      logMessages.includes("Instruction: SendOrderCancel"),
    );
    if (sendOrderCancelInstruction) {
      console.log("sendOrderCancelInstruction", sendOrderCancelInstruction);
    }
  });
};
