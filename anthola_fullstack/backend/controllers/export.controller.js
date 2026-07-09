const { exportDir, writeUsersSheet, writeBookingsSheet, writePaymentsSheet } = require('../utils/sheets');
const path = require('path');
const fs = require('fs');

async function sendFile(res, fileName, writer) {
  const result = await writer();
  const outPath = path.join(exportDir, fileName);
  if (fs.existsSync(outPath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(outPath);
  }
  if (result?.csv) {
    const csvFile = fileName.replace(/\.xlsx$/i, '.csv');
    const csvPath = path.join(exportDir, csvFile);
    fs.writeFileSync(csvPath, result.csv, 'utf8');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csvFile}"`);
    return res.send(result.csv);
  }
  return res.status(404).json({ message: 'Export not available' });
}

async function downloadUsersXlsx(_req, res) {
  return sendFile(res, 'users-latest.xlsx', writeUsersSheet);
}

async function downloadBookingsXlsx(_req, res) {
  return sendFile(res, 'bookings-latest.xlsx', writeBookingsSheet);
}

async function downloadPaymentsXlsx(_req, res) {
  return sendFile(res, 'payments-latest.xlsx', writePaymentsSheet);
}

module.exports = { downloadUsersXlsx, downloadBookingsXlsx, downloadPaymentsXlsx };
