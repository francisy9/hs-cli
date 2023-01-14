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

arr = Object.values(p2kp._keypair.secretKey);
secret = new Uint8Array(arr);
const p2 = Keypair.fromSecretKey(secret);

const connection = new Connection(network, opts.preflightCommitment);


let balance = await connection.getBalance(p1.publicKey);
console.log("p1 balance:", balance);

balance = await connection.getBalance(p2.publicKey);
console.log("p2 balance:", balance);