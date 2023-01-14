import * as anchor from "@coral-xyz/anchor";
import idl from "./idl.json" assert { type: "json" };
import p1kp from "./player1kp.json" assert { type: "json" };
import p2kp from "./player2kp.json" assert { type: "json" };
import { Connection, PublicKey, clusterApiUrl, Keypair } from "@solana/web3.js";

const programId = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};
const gameKP = anchor.web3.Keypair.generate();

let arr = Object.values(p1kp._keypair.secretKey);
let secret = new Uint8Array(arr);
const p1 = Keypair.fromSecretKey(secret);

arr = Object.values(p2kp._keypair.secretKey);
secret = new Uint8Array(arr);
const p2 = Keypair.fromSecretKey(secret);

let playList = [p1, p2];

const wallet = new anchor.Wallet(p1);

let connection;

let leaderboardPDA;
let leaderboardBump;
let p1PDA;
let p1Bump;
let p2PDA;
let p2Bump;

const getProvider = () => {
  connection = new Connection(network, opts.preflightCommitment);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    opts.preflightCommitment
  );
  return provider;
};

const program = new anchor.Program(idl, programId, getProvider());

let sampleHand = [
  { hp: 2, atk: 1, mana: 1, moves: 0 },
  { hp: 2, atk: 3, mana: 2, moves: 0 },
  { hp: 5, atk: 5, mana: 5, moves: 0 },
  { hp: 2, atk: 2, mana: 2, moves: 0 },
  { hp: 6, atk: 5, mana: 6, moves: 0 },
  { hp: 8, atk: 8, mana: 8, moves: 0 }
];

let sampleHand2 = [
  { hp: 15, atk: 7, mana: 1, moves: 0 },
  { hp: 5, atk: 5, mana: 2, moves: 0 },
  { hp: 5, atk: 4, mana: 4, moves: 0 },
  { hp: 7, atk: 9, mana: 8, moves: 0 },
  { hp: 10, atk: 10, mana: 10, moves: 0 },
  { hp: 5, atk: 8, mana: 7, moves: 0 }
];

const getLeaderBoardObj = async () => {
  try {
    [leaderboardPDA, leaderboardBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("leaderboard")],
      programId
    );
  } catch (err) {
    console.log("Get leaderboard pda:", err);
  }
};

const getUserPDAs = async () => {
  try {
    [p1PDA, p1Bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user-stats"), p1.publicKey.toBuffer()],
      programId
    );
    [p2PDA, p2Bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user-stats"), p2.publicKey.toBuffer()],
      programId
    );

  } catch (err) {
    console.log("Get user stat accounts:", err);
  }
};


const initGame = async () => {
  try {
    console.log("Initializing game");
    await program.methods.setupGame(sampleHand, sampleHand2).accounts({
      game: gameKP.publicKey,
      p1: p1.publicKey,
      p1Stats: p1PDA,
      p2: p2.publicKey,
      p2Stats: p2PDA,
      leaderboard: leaderboardPDA,
    }).signers([gameKP]).rpc();
  } catch (error) {
    console.log("Failed to create game account", error);
  }
};

const getUserPDA = async (program, key) => {
  const obj = await PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("user-stats"), key.toBuffer()],
    program.programId
  );

  return obj;
}

const concede = async (program, kp, pda) => {
  const userState = await program.account.userStats.fetch(pda);
  if (!userState.activeGame) {
    return;
  }
  const gamePk = new anchor.web3.PublicKey(userState.activeGame);
  const gameState = await program.account.game.fetch(gamePk);
  const playerList = gameState.players;
  const opponentPkObj =
    playerList[0].toBase58() == kp.publicKey.toBase58()
      ? playerList[1]
      : playerList[0];
  const opponentPk = new anchor.web3.PublicKey(opponentPkObj);
  const [opponentPDA, _] = await getUserPDA(program, opponentPkObj);
  await program.methods
    .concede()
    .accounts({
      game: gamePk,
      p1: kp.publicKey,
      p1Stats: pda,
      p2: opponentPk,
      p2Stats: opponentPDA,
    })
    .signers([kp])
    .rpc();
}

const setScores = async() => {
  console.log("Setting scores...");
  await program.methods
    .setScores()
    .accounts({
      p1: p1.publicKey,
      p2: p2.publicKey,
      p1Stats: p1PDA,
      p2Stats: p2PDA,
      game: gameKP.publicKey,
    })
    .rpc();
  
  const p1State = await program.account.userStats.fetch(p1PDA);
  const p2State = await program.account.userStats.fetch(p2PDA);
  console.log(`Player one current score: ${p1State.score}`);
  console.log(`Player two current score: ${p2State.score}`);
}

let player = 0;

let input = process.stdin;

function print(out) {
  process.stdout.write(out);
}


const getRowString = (row) => {
  let out = "|"
  for (let i = 0; i < 7; i ++) {
    let unit = row[i];
    if (!unit) {
      out += "                 |";
    } else {
      let hpString = JSON.stringify(unit.hp);
      let atkString = JSON.stringify(unit.atk);

      out += " hp:" + hpString;
      if (hpString.length == 2) {
        out += "   ";
      } else {
        out += "    ";
      }
      out += "atk:" + atkString;

      if (atkString.length == 2) {
        out += "  |";
      } else {
        out += "   |";
      }
    }
  }
  
  out += "\n|";


  for (let i = 0; i < 7; i ++) {
    let unit = row[i];
    if (!unit) {
      out += "                 |";
    } else {
      let manaString = JSON.stringify(unit.mana);
      out += " mana:" + manaString;
      if (manaString.length == 1) {
        out += "  ";
      } else {
        out += " ";
      }
      out += "moves:" + JSON.stringify(unit.moves) + " |";
    }
  }
  return out;
}

const printB = async() => {
  const state = await program.account.game.fetch(gameKP.publicKey);
  switch (JSON.stringify(Object.keys(state.state)[0])) {
    case `"active"`:
      break;
    case `"tie"`:
      print(`Game over: Tied`);
      await setScores();
      process.exit();
    case `"won"`:
      print(`${clr(`Player ${player ? "Two" : "One"}`, "green")} won!!\n`);
      await setScores();
      process.exit();
    default:
      break;
  }
  const board = state.board;
  let [p2Units, p1Units] = board;
  let boardString = `P1  Hp: ${state.health[0]}  Mana: ${state.mana[0]}\n`;
  boardString += `P2  Hp: ${state.health[1]}  Mana: ${state.mana[1]}\n`;
  for (let j = 0; j < 7; j++) {
    boardString += `        ${j}         `
  }
  boardString += `\n`;
  boardString += getRowString(p2Units);
  boardString += "\n===============================================================================================================================\n";
  boardString += getRowString(p1Units) + "\n";
  print(boardString);

}

const playCard = async(cardIndex, pos) => {
  console.log("Playing card...");
  try {
    const currPlayer = playList[player];
    await program.methods
      .playCard(pos, cardIndex)
      .accounts({
        game: gameKP.publicKey,
        player: currPlayer.publicKey,
      })
      .signers([currPlayer])
      .rpc();
  } catch (error) {
    console.log(error);
  }
}

const showHand = async() => {
  const state = await program.account.game.fetch(gameKP.publicKey);
  console.log(`Remaining mana: ${state.mana[player]}`);
  if (player == 0) {
    console.log(state.p1Hand);
  } else {
    console.log(state.p2Hand);
  }
}

const endTurn = async() => {
  const currPlayer = playList[player];
  try {
    await program.methods
      .endTurn()
      .accounts({
        player: currPlayer.publicKey,
        game: gameKP.publicKey
      })
      .signers([currPlayer])
      .rpc();
    player = player == 0 ? 1 : 0;
  } catch (error) {
    console.log("End turn error: ", error);
  }
}

const attack = async(allyPos, enemyPos) => {
  const currPlayer = playList[player];
  let topPos;
  let botPos;
  if (player == 1) {
    topPos = allyPos;
    botPos = enemyPos;
  } else {
    topPos = enemyPos;
    botPos = allyPos;
  }
  try {
    await program.methods
      .attack(botPos, topPos)
      .accounts({
        player: currPlayer.publicKey,
        game: gameKP.publicKey
      })
      .signers([currPlayer])
      .rpc();
  } catch (error) {
    console.log("Attack: ", error);
  }
}

const printHelp = () => {
  print(
    `Commands: \n${clr(
      "Play Card: p (card index) (row position)\nAttack: a (ally row position) (enemy row position) [To attack enemy hero use index 7]\nEnd Turn: e\nPrint Board: pb\nShow Hand: s\n",
      "blue"
    )}`
  );
};

async function main() {
  await getLeaderBoardObj();
  await getUserPDAs();
  await concede(program, p1, p1PDA);
  await concede(program, p2, p2PDA);
  await initGame();
  const p1State = await program.account.userStats.fetch(p1PDA);
  const p2State = await program.account.userStats.fetch(p2PDA);
  console.log(`Player one current score: ${p1State.score}`);
  console.log(`Player two current score: ${p2State.score}`);
  await printB();
  printHelp();
  prompt();
}

function prompt() {
  print(
    `\nIt's ${clr(
      player == 1 ? "Player Two" : "Player One",
      "yellow"
    )}'s turn. \nPlease enter command: `
  );
}

const check = (obj) => {
  obj.field = obj.field.toString().replace(/\n/, "").trim();
  obj.field = obj.field.replace(/\s+/g, " ").split(" ");
  switch (obj.field[0]) {
    case 's':
    case 'e':
    case 'pb':
      return true;
    case 'p':
    case 'a':
      if(obj.field.length != 3) {
        break;
      } else {
        obj.field[1] = parseInt(obj.field[1]);
        obj.field[2] = parseInt(obj.field[2]);
        return true;
      }
    default:
      break;
  }
  print(clr("Wrong input!\n", "red"));
  printHelp();
  prompt();
  return false;
}


const processIx = async (data) => {
  switch (data[0]) {
    case 's':
      await showHand();
      break;
    case 'e':
      await endTurn();
      await printB();
      break;
    case 'pb':
      await printB();
      break;
    case 'p':
      await playCard(data[1], data[2]);
      await printB();
      break;
    case 'a':
      await attack(data[1], data[2]);
      await printB();
      break;
    default:
      console.log("wrong input", data[0]);
      break;
  }
}

/*Coloring function by Salifm*/
function clr(text, color) {
  var code = { red: 91, green: 92, blue: 34, cian: 96, yellow: 93 }[color];
  if (code) return "\x1b[" + code + "m" + text + "\x1b[0m";
}

/**LISTENERS**/

input.on("data", async (data) => {
  let obj = {field: data};
  if (check(obj)) {
    await processIx(obj.field);
    prompt();
    
  }
});

await main();
