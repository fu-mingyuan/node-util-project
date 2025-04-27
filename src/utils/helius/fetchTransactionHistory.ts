import { LAMPORTS_PER_SOL, ParsedAccountData, PublicKey } from "@solana/web3.js";
import HeliusClient from "@/utils/helius/heliusClient";
import { EnrichedTransaction } from "helius-sdk/dist/src/types/types";
import { SignaturesInfo, TransactionInfo, TransactionType } from "@/types";
import { NATIVE_MINT } from "@solana/spl-token";

type ParsedTransactionDetail = {
  transactionType: TransactionType;
  from: string;
  fromAmount: number;
  fromMint: string;
  to: string;
  toAmount: number;
  toMint: string;
};

type TokenAccountInfoValue = {
  tokenAccount: string;
  owner: string;
  mint: string;
};

type TokenInfoValue = {
  mint: string;
  name: string;
  symbol: string;
  logo: string;
};

/**
 * 根据签名信息查询交易详情
 * @param owner
 * @param signaturesInfo[] 签名数据
 */
export const fetchTransactionHistory = async (
  owner: PublicKey,
  signaturesInfo: SignaturesInfo[],
): Promise<TransactionInfo[]> => {
  try {
    const heliusClient = HeliusClient.getInstance();
    const signaturesMemoMap = new Map(signaturesInfo.map((item) => [item.signature, item.memo]));
    const signaturesAddresses = signaturesInfo.map((address) => address.signature);
    const parseTransactionsResponse = await heliusClient.parseTransactions({
      transactions: signaturesAddresses,
    });

    // 去除掉没有产生金额变动的 accountData, 减少后续的循环
    const simplifiedData = parseTransactionsResponse.map((tx) => ({
      ...tx,
      accountData: tx.accountData.filter(
        (accountData) =>
          accountData.nativeBalanceChange !== 0 ||
          (accountData.tokenBalanceChanges && accountData.tokenBalanceChanges.length > 0),
      ),
    }));

    const accountSet = new Set<string>();
    const mintSet = new Set<string>();
    // 追加原生 SOL
    mintSet.add(NATIVE_MINT.toBase58());

    // 找出交易涉及到的所有 account 和 token mint
    for (const tx of simplifiedData) {
      for (const { account, tokenBalanceChanges } of tx.accountData ?? []) {
        if (account) accountSet.add(account);

        for (const { mint } of tokenBalanceChanges ?? []) {
          if (mint) mintSet.add(mint);
        }
      }
    }

    // 统计交易涉及到的 tokenAccount - owner 对应关系，同时找出 tokenAccount 对应的 tokenMint
    const tokenAccounts = [...accountSet];
    const publicKeys: PublicKey[] = tokenAccounts.map((item) => new PublicKey(item));
    const parsedAccountsInfo = await heliusClient.connection.getMultipleParsedAccounts(publicKeys);
    const tokenAccountInfoMap: Record<string, TokenAccountInfoValue> = Object.fromEntries(
      parsedAccountsInfo.value
        .map((item, idx) => {
          const owner = (item?.data as ParsedAccountData)?.parsed?.info?.owner;
          const mint = (item?.data as ParsedAccountData)?.parsed?.info?.mint;
          // 如果有mint，则证明当前是个tokenAccount，将对应的mint加入集合一同查询 tokenInfo 信息
          if (mint) mintSet.add(mint);
          return [
            publicKeys[idx].toBase58(),
            {
              tokenAccount: publicKeys[idx].toBase58(),
              owner,
              mint,
            },
          ] as const;
        })
        .filter(([, value]) => !!value.owner),
    );
    // 统计所有交易涉及到的 tokenInfo 信息
    const allMints = [...mintSet];
    const assetsInfo = await heliusClient.rpc.getAssetBatch({ ids: allMints });
    const tokenInfoMap: Record<string, TokenInfoValue> = Object.fromEntries(
      assetsInfo.map((item) => [
        item.id,
        {
          mint: item.id,
          name: item.content?.metadata.name || "Unknown",
          symbol: item.content?.metadata.symbol || "Unknown",
          logo: item.content?.links?.image || "",
        },
      ]),
    );

    return Promise.all<TransactionInfo>(
      simplifiedData.map(async (tx) => {
        const status = tx.transactionError ? "FAILED" : "SUCCESS";
        const blockTime = tx.timestamp;
        const fee = tx.fee / LAMPORTS_PER_SOL;
        const memo = signaturesMemoMap.get(tx.signature);
        const err = tx.transactionError || null;
        const transactionsDetail: ParsedTransactionDetail = await parseTransactionsDetail(
          owner,
          tx,
          tokenAccountInfoMap,
        );

        return {
          signature: tx.signature,
          transactionType: tx.transactionError ? TransactionType.UNKNOWN : transactionsDetail.transactionType,

          from: transactionsDetail.from,
          fromAmount: transactionsDetail.fromAmount,
          fromMint: transactionsDetail.fromMint,
          fromName: tokenInfoMap[transactionsDetail.fromMint]?.name || "Unknown",
          fromSymbol: tokenInfoMap[transactionsDetail.fromMint]?.symbol || "Unknown",
          fromLogo: tokenInfoMap[transactionsDetail.fromMint]?.logo || "",

          to: transactionsDetail.to,
          toAmount: transactionsDetail.toAmount,
          toMint: transactionsDetail.toMint,
          toSymbol:
            tokenInfoMap[transactionsDetail.toMint]?.symbol ||
            tokenInfoMap[tokenAccountInfoMap[transactionsDetail.toMint]?.mint]?.symbol ||
            "Unknown",
          toName:
            tokenInfoMap[transactionsDetail.toMint]?.name ||
            tokenInfoMap[tokenAccountInfoMap[transactionsDetail.toMint]?.mint]?.name ||
            "Unknown",
          toLogo:
            tokenInfoMap[transactionsDetail.toMint]?.logo ||
            tokenInfoMap[tokenAccountInfoMap[transactionsDetail.toMint]?.mint]?.logo ||
            "",

          nativeName: tokenInfoMap[NATIVE_MINT.toBase58()].name || "Unknown",
          nativeMint: NATIVE_MINT.toBase58(),
          nativeSymbol: tokenInfoMap[NATIVE_MINT.toBase58()].symbol || "Unknown",
          nativeLogo: tokenInfoMap[NATIVE_MINT.toBase58()].logo || "",

          status,
          blockTime,
          memo,
          fee,
          err,
        };
      }),
    );
  } catch (error) {
    console.error(error);
    throw new Error(`parseTransactions: ${error}`);
  }
};

/**
 * 解析交易数据详情
 * @param owner 当前wallet publicKey
 * @param enrichedTransaction 交易详情数据
 * @param tokenAccountInfoMap
 */
const parseTransactionsDetail = async (
  owner: PublicKey,
  enrichedTransaction: EnrichedTransaction,
  tokenAccountInfoMap: Record<string, TokenAccountInfoValue>,
): Promise<ParsedTransactionDetail> => {
  // 当前钱包地址
  const ownerAddress = owner.toBase58();
  // 当前交易数据的 accountData：交易涉及的账户数据变化
  const accountsData = enrichedTransaction.accountData;
  // 当前交易数据的 tokenChange：交易涉及的token数据变化
  const allTokenChanges = accountsData.flatMap((acc) => acc.tokenBalanceChanges || []);

  // ================================== 解析 Swap 类型 ==================================

  // owner's accountData
  const ownerAccountData = accountsData.find((acc) => acc.account === ownerAddress);
  // rawTokenAmount.tokenAmount(token 变动数量) > 0 为 sent token，
  const sentToken = allTokenChanges.find(
    (change) => change?.userAccount === ownerAddress && parseInt(change.rawTokenAmount.tokenAmount) < 0,
  );
  // rawTokenAmount.tokenAmount(token 变动数量) < 0 为 received token
  const receivedToken = allTokenChanges.find(
    (change) => change?.userAccount === ownerAddress && parseInt(change.rawTokenAmount.tokenAmount) > 0,
  );

  // SOL 的变化(nativeBalanceChange 为 SOL 数量变化)
  const isSolSwapOut = ownerAccountData?.nativeBalanceChange && ownerAccountData.nativeBalanceChange < 0;
  const isSolSwapIn = ownerAccountData?.nativeBalanceChange && ownerAccountData.nativeBalanceChange > 0;

  //  sentToken swap receivedToken: 同时有 sentToken 和 receivedToken 变化，则代表是 token 之间的兑换
  if (sentToken && receivedToken) {
    return {
      transactionType: TransactionType.SWAPPED,
      from: sentToken.userAccount,
      fromAmount: Number(sentToken.rawTokenAmount.tokenAmount) / 10 ** sentToken.rawTokenAmount.decimals,
      fromMint: sentToken.mint,
      to: receivedToken.mint,
      toAmount: Number(receivedToken.rawTokenAmount.tokenAmount) / 10 ** receivedToken.rawTokenAmount.decimals,
      toMint: receivedToken.mint,
    };
  }

  // token swap SOL: 有 sentToken 和 SOL 的收入，则代表是 Token -> SOL
  if (sentToken && isSolSwapIn) {
    return {
      transactionType: TransactionType.SWAPPED,
      from: ownerAddress,
      fromAmount: Number(sentToken.rawTokenAmount.tokenAmount) / 10 ** sentToken.rawTokenAmount.decimals,
      fromMint: sentToken.mint,
      to: ownerAddress,
      toAmount: Number(ownerAccountData.nativeBalanceChange) / LAMPORTS_PER_SOL,
      toMint: NATIVE_MINT.toBase58(),
    };
  }

  // SOL swap token: 有 receivedToken 和 SOL 的支出，则代表是 SOL -> Token
  if (receivedToken && isSolSwapOut) {
    return {
      transactionType: TransactionType.SWAPPED,
      from: ownerAddress,
      fromMint: NATIVE_MINT.toBase58(),
      fromAmount: -Math.abs(ownerAccountData.nativeBalanceChange + enrichedTransaction.fee) / LAMPORTS_PER_SOL,
      to: ownerAddress,
      toMint: receivedToken.mint,
      toAmount: Number(receivedToken.rawTokenAmount.tokenAmount) / 10 ** receivedToken.rawTokenAmount.decimals,
    };
  }

  // ================================== 解析 Create ATA 类型 ==================================
  const isCreateATA =
    // 交易中没有任何 token 的数量变动（纯 SOL 消耗创建 ATA 的特征）
    accountsData.every((acc) => (acc.tokenBalanceChanges || []).length === 0) &&
    // 自己的钱包 SOL 减少了
    accountsData.some((acc) => acc.account === ownerAddress && acc.nativeBalanceChange < 0) &&
    // 新创建的 tokenAccount，必须在 tokenAccountsOwner 中，且 owner 是自己
    accountsData
      .filter((acc) => acc.account !== ownerAddress)
      .every((acc) => {
        const entry = tokenAccountInfoMap[acc.account];
        return entry?.owner === ownerAddress;
      });

  if (isCreateATA) {
    const targetAccountData = accountsData.find(
      (item) => item.account !== ownerAddress && item.nativeBalanceChange > 0,
    );
    return {
      transactionType: TransactionType.CREATED_TOKEN_ACCOUNT,
      from: ownerAddress,
      fromAmount: 0,
      fromMint: NATIVE_MINT.toBase58(),
      to: "Unknown",
      toAmount: (accountsData.find((a) => a.account === ownerAddress)?.nativeBalanceChange || 0) / LAMPORTS_PER_SOL,
      toMint: targetAccountData?.account ?? "Unknown",
    };
  }

  // ================================== 解析 Send or received 类型 ==================================
  for (const account of accountsData) {
    // 检查是否为接收 SOL
    if (account.account !== ownerAddress && account.nativeBalanceChange < 0) {
      const receiverEntry = accountsData.find((acc) => acc.account === ownerAddress && acc.nativeBalanceChange > 0);
      if (receiverEntry) {
        return {
          transactionType: TransactionType.RECEIVED,
          from: account.account,
          fromAmount: receiverEntry.nativeBalanceChange / LAMPORTS_PER_SOL,
          fromMint: NATIVE_MINT.toBase58(),
          to: receiverEntry.account,
          toAmount: receiverEntry.nativeBalanceChange / LAMPORTS_PER_SOL,
          toMint: NATIVE_MINT.toBase58(),
        };
      }
    }

    // 检查是否为发送 SOL
    if (account.account === ownerAddress && account.nativeBalanceChange < 0) {
      const receiverEntry = accountsData.find((acc) => acc.account !== ownerAddress && acc.nativeBalanceChange > 0);
      if (receiverEntry) {
        return {
          transactionType: TransactionType.SENT,
          from: ownerAddress,
          fromAmount: -receiverEntry.nativeBalanceChange / LAMPORTS_PER_SOL,
          fromMint: NATIVE_MINT.toBase58(),
          to: receiverEntry.account,
          toAmount: receiverEntry.nativeBalanceChange / LAMPORTS_PER_SOL,
          toMint: NATIVE_MINT.toBase58(),
        };
      }
    }

    // 检查是否为接收或发送 Token
    if (account.tokenBalanceChanges) {
      for (const change of account.tokenBalanceChanges) {
        const amount = Number(change.rawTokenAmount?.tokenAmount || 0);
        const decimals = Number(change.rawTokenAmount?.decimals || 0);
        const mint = change.mint;

        if (change.userAccount === ownerAddress && amount > 0) {
          const senderChange = allTokenChanges.find(
            (c) => c.mint === mint && c.userAccount !== ownerAddress && Number(c.rawTokenAmount?.tokenAmount || 0) < 0,
          );
          return {
            transactionType: TransactionType.RECEIVED,
            from: senderChange?.userAccount ?? "unknown",
            fromAmount: -amount / 10 ** decimals,
            fromMint: mint,
            to: ownerAddress,
            toAmount: amount / 10 ** decimals,
            toMint: mint,
          };
        }

        if (change.userAccount === ownerAddress && amount < 0) {
          const receiverChange = allTokenChanges.find(
            (c) => c.mint === mint && c.userAccount !== ownerAddress && Number(c.rawTokenAmount?.tokenAmount || 0) > 0,
          );
          return {
            transactionType: TransactionType.SENT,
            from: ownerAddress,
            fromAmount: amount / 10 ** decimals,
            fromMint: mint,
            to: receiverChange?.userAccount ?? "unknown",
            toAmount: -amount / 10 ** decimals,
            toMint: mint,
          };
        }
      }
    }
  }

  return {
    transactionType: TransactionType.UNKNOWN,
    from: "Unknown",
    fromAmount: 0,
    fromMint: "Unknown",
    to: "Unknown",
    toAmount: 0,
    toMint: "Unknown",
  };
};
