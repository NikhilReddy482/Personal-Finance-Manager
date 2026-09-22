import mongoose from 'mongoose';
import { Account, IAccount } from '../../models/Account';
import { Transaction } from '../../models/Transaction';
import { toMinorUnits } from '../../utils/money';

export class AccountService {
  static async listAccounts(userId: mongoose.Types.ObjectId): Promise<IAccount[]> {
    return Account.find({ userId, isActive: true }).sort({ createdAt: -1 });
  }

  static async getAccountById(userId: mongoose.Types.ObjectId, accountId: string): Promise<IAccount> {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw { status: 404, code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' };
    }
    return account;
  }

  static async createAccount(userId: mongoose.Types.ObjectId, data: any): Promise<IAccount> {
    const openingBalanceMinor = toMinorUnits(data.openingBalance || 0);
    const creditLimitMinor = data.creditLimit ? toMinorUnits(data.creditLimit) : undefined;

    return Account.create({
      userId,
      name: data.name,
      institutionName: data.institutionName,
      accountType: data.accountType,
      currency: data.currency || 'INR',
      maskedIdentifier: data.maskedIdentifier,
      openingBalanceMinor,
      currentBalanceMinor: openingBalanceMinor,
      creditLimitMinor,
      isActive: true,
    });
  }

  static async updateAccount(userId: mongoose.Types.ObjectId, accountId: string, data: any): Promise<IAccount> {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw { status: 404, code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' };
    }

    if (data.name !== undefined) account.name = data.name;
    if (data.institutionName !== undefined) account.institutionName = data.institutionName;
    if (data.maskedIdentifier !== undefined) account.maskedIdentifier = data.maskedIdentifier;
    if (data.creditLimit !== undefined) account.creditLimitMinor = toMinorUnits(data.creditLimit);

    return account.save();
  }

  static async deleteAccount(userId: mongoose.Types.ObjectId, accountId: string): Promise<{ message: string; deletedTransactions: number }> {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw { status: 404, code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' };
    }

    // Deactivate account and purge associated transactions
    account.isActive = false;
    await account.save();

    const txDeleteRes = await Transaction.deleteMany({ userId, accountId: new mongoose.Types.ObjectId(accountId) });

    return {
      message: `Account "${account.name}" (${account.institutionName}) was successfully deleted.`,
      deletedTransactions: txDeleteRes.deletedCount || 0,
    };
  }

  static async recalculateBalance(userId: mongoose.Types.ObjectId, accountId: mongoose.Types.ObjectId): Promise<number> {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) return 0;

    const txs = await Transaction.find({ userId, accountId, reviewStatus: { $in: ['VALID', 'CONFIRMED'] } });
    let balance = account.openingBalanceMinor;

    for (const t of txs) {
      if (t.transactionType === 'INCOME' || t.transactionType === 'REFUND' || t.transactionType === 'CASH_DEPOSIT') {
        balance += t.amountMinor;
      } else if (
        t.transactionType === 'EXPENSE' ||
        t.transactionType === 'FEE' ||
        t.transactionType === 'DEBT_PAYMENT' ||
        t.transactionType === 'INVESTMENT' ||
        t.transactionType === 'CASH_WITHDRAWAL'
      ) {
        balance -= t.amountMinor;
      }
    }

    account.currentBalanceMinor = balance;
    await account.save();
    return balance;
  }
}
