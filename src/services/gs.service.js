const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = JSON.parse(process.env.GOOGLE_API_CREDS);

class GsService {
  constructor() {
    this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  }

  async checkPermissions(currentUserId) {
    await this.doc.useServiceAccountAuth(creds);
    await this.doc.loadInfo();

    const sheet = this.doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    let isPermissions = false;

    rows.map(async ({ admin_telegram_id }, index) => {
      const uId = String(currentUserId);

      if (index > 0 && uId === admin_telegram_id) {
        isPermissions = true;
      }
    });

    return isPermissions;
  }
}

const gsService = new GsService();
module.exports = gsService;
