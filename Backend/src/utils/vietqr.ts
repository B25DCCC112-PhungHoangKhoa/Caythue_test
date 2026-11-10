export interface BankConfig {
  bin: string;
  accountNo: string;
  accountName: string;
  bankName: string;
  branch: string;
}

export class VietQRService {
  public static getBankConfig(): BankConfig {
    return {
      bin: process.env.BANK_BIN || '970418',
      accountNo: process.env.BANK_ACCOUNT_NO || '1210512384',
      accountName: process.env.BANK_ACCOUNT_NAME || 'NGUYEN TUAN VINH',
      bankName: process.env.BANK_NAME || 'BIDV',
      branch: process.env.BANK_BRANCH || 'Thành phố Lào Cai'
    };
  }

  public static generateOrderCode(): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'CT';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  public static generateTransferCode(): string {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  public static generateVietQRUrl(
    transferMessage: string,
    amount: number,
    customBankBin?: string,
    customAccountNo?: string,
    customAccountName?: string
  ): string {
    const config = this.getBankConfig();
    const bankBin = customBankBin || config.bin;
    const accountNo = customAccountNo || config.accountNo;
    const accountName = customAccountName || config.accountName;

    return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferMessage
    )}&accountName=${encodeURIComponent(accountName)}`;
  }
}

export default VietQRService;
