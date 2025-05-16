import type { TransactionError } from "@solana/web3.js";

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
  transactionType: TransactionType;
  from: string;
  fromAmount: number;
  fromMint: string;
  fromName: string;
  fromSymbol: string;
  fromLogo: string;
  to: string;
  toAmount: number;
  toMint: string;
  toName: string;
  toSymbol: string;
  toLogo: string;
  nativeMint: string;
  nativeName: string;
  nativeSymbol: string;
  nativeLogo: string;
  memo: string | undefined;
  status: "FAILED" | "SUCCESS";
  blockTime: number;
  fee: number;
  err: TransactionError | null;
};

export enum TransactionType {
  SENT = "Sent",
  RECEIVED = "Received",
  CREATED_TOKEN_ACCOUNT = "Add new token",
  SWAPPED = "swapped",
  INSUFFICIENT_FUNDS_ERROR = "Insufficient funds",
  UNKNOWN = "Unknown",
}
