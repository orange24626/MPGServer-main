import { Decimal } from "@prisma/client/runtime/library";
import { WalletService } from "../src/services/WalletService";
import { customAlphabet } from "nanoid";

const alphabet = "0123456789";
const nanoid = customAlphabet(alphabet, 18);

const pararms = {
  playerId: 97,
  currency: "BRL",
  amount: new Decimal("1.2"),
  detail: { historyId: BigInt(nanoid()).toString() },
};

const pararms2 = {
  playerId: 96,
  currency: "BRL",
  amount: new Decimal("1.2"),
  detail: { historyId: BigInt(nanoid()).toString() },
};

await WalletService.gameBet(pararms);
await WalletService.gameBet(pararms2);

process.exit(0);
