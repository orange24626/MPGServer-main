import { Decimal } from "@prisma/client/runtime/library";
import { WalletService } from "services";

export class WalletStore {
  playerId: number;
  currency: string;
  balance: Decimal = new Decimal(0);
  beforeSpinBalance = new Decimal(0);
  afterSpinBalance = new Decimal(0);
  afterWinBalance = new Decimal(0);
  profit: Decimal = new Decimal(0);

  constructor(playerId: number, currency: string) {
    this.playerId = playerId;
    this.currency = currency;
  }
  init = async () => {
    const wallet = await WalletService.getWalletByPlayerIdAndCurrency({
      playerId: this.playerId,
      currency: this.currency,
    });
    this.balance = new Decimal(wallet?.balance || "0");
    this.beforeSpinBalance = this.balance;
    this.afterSpinBalance = this.balance;
    this.afterWinBalance = this.balance;
    this.profit = new Decimal(0);
  };

  bet = async (betAmount: Decimal) => {
    this.afterSpinBalance = this.balance.minus(betAmount);
    this.balance = this.afterSpinBalance;
    this.profit = this.profit.minus(betAmount);
  };

  win = async (winAmount: Decimal) => {
    this.afterWinBalance = this.balance.plus(winAmount);
    this.balance = this.afterWinBalance;
    this.profit = this.profit.plus(winAmount);
    await WalletService.gameProfit({
      playerId: this.playerId,
      currency: this.currency,
      amount: this.profit,
    });
  };
}
