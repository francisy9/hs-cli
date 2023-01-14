import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import idl from "./idl.json" assert { type: "json" };
import { Connection, PublicKey, clusterApiUrl, Keypair } from "@solana/web3.js";

const p1 = anchor.web3.Keypair.generate();
const wallet = new anchor.Wallet(p1);
const p2 = anchor.web3.Keypair.generate();
const programId = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
    preflightCommitment: "processed",
};
const connection = new Connection(network, opts.preflightCommitment);
const provider = new anchor.AnchorProvider(
  connection,
  wallet,
  opts.preflightCommitment
);
const program = new anchor.Program(idl, programId, provider);
const [leaderboardPDA, _l] = await PublicKey.findProgramAddressSync(
    [Buffer.from("leaderboard")],
    programId
  );
const [p1PDA, _] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user-stats"), p1.publicKey.toBuffer()],
    programId
  );
const [p2PDA, _b] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user-stats"), p2.publicKey.toBuffer()],
    programId
  );

await provider.connection.confirmTransaction(
  await provider.connection.requestAirdrop(p1.publicKey, 1_000_000_000),
  "confirmed"
);

await program.methods
  .createUserStats("Player One")
  .accounts({
    user: p1.publicKey,
    userStats: p1PDA,
    leaderboard: leaderboardPDA,
  })
  .signers([p1])
  .rpc();

await provider.connection.confirmTransaction(
  await provider.connection.requestAirdrop(p2.publicKey, 1_000_000_000),
  "confirmed"
);

await program.methods
  .createUserStats("Player Two")
  .accounts({
    user: p2.publicKey,
    userStats: p2PDA,
    leaderboard: leaderboardPDA,
  })
  .signers([p2])
  .rpc();

fs.writeFileSync("./player1kp.json", JSON.stringify(p1));
fs.writeFileSync("./player2kp.json", JSON.stringify(p2));