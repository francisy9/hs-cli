import * as anchor from "@coral-xyz/anchor";
import p1kp from "./player1kp.json" assert { type: "json" };
import p2kp from "./player2kp.json" assert { type: "json" };
import { Connection, PublicKey, clusterApiUrl, Keypair } from "@solana/web3.js";

const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};

let arr = Object.values(p1kp._keypair.secretKey);
let secret = new Uint8Array(arr);
const p1 = Keypair.fromSecretKey(secret);
const wallet = new anchor.Wallet(p1);

arr = Object.values(p2kp._keypair.secretKey);
secret = new Uint8Array(arr);
const p2 = Keypair.fromSecretKey(secret);

const connection = new Connection(network, opts.preflightCommitment);
const provider = new anchor.AnchorProvider(
  connection,
  wallet,
  opts.preflightCommitment
);


console.log(`Airdropping 1 SOL to wallet/p1`);
await provider.connection.confirmTransaction(
await provider.connection.requestAirdrop(
    p1.publicKey,
    1_000_000_000
),
"confirmed"
);
let balance = await connection.getBalance(p1.publicKey);
console.log("p1 balance:", balance);


console.log(`Airdropping 1 SOL to p2`);
await provider.connection.confirmTransaction(
await provider.connection.requestAirdrop(
    p2.publicKey,
    1_000_000_000
),
"confirmed"
);
balance = await connection.getBalance(p2.publicKey);
console.log("p2 balance:", balance);
