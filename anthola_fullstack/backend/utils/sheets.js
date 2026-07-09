const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { toCsv } = require('./csv');

const exportDir = path.join(__dirname, '..', 'exports');

function ensureExportDir() {
  fs.mkdirSync(exportDir, { recursive: true });
}

function safeIso(value) {
  return value ? new Date(value).toISOString() : '';
}

async function writeWorkbook(fileName, sheetName, rows, columns) {
  ensureExportDir();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Anthola';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: column.width || 20
  }));
  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns.forEach((column) => {
    column.alignment = { vertical: 'middle', wrapText: true };
  });

  const filePath = path.join(exportDir, fileName);
  await workbook.xlsx.writeFile(filePath);
  const csv = toCsv(rows, columns);
  fs.writeFileSync(filePath.replace(/\.xlsx$/i, '.csv'), csv, 'utf8');
  return { rows, csv, filePath };
}

async function writeUsersSheet() {
  const [users, bookingCounts] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).lean(),
    Booking.aggregate([{ $group: { _id: '$userId', bookingsCount: { $sum: 1 } } }])
  ]);

  const counts = new Map(bookingCounts.map((row) => [String(row._id || ''), row.bookingsCount || 0]));
  const rows = users.map((u) => ({
    name: u.role === 'BUS_OWNER' ? (u.companyName || u.ownerName || u.name || u.username) : (u.name || u.username),
    company: u.companyName || '',
    ownerName: u.ownerName || '',
    email: u.email,
    phone: u.phone,
    role: u.role,
    panNumber: u.panNumber || '',
    businessRegistrationNumber: u.businessRegistrationNumber || '',
    address: u.address || '',
    bookingsCount: counts.get(String(u._id)) || 0,
    registrationDate: safeIso(u.createdAt)
  }));

  return writeWorkbook('users-latest.xlsx', 'Users', rows, [
    { key: 'name', label: 'Name', width: 24 },
    { key: 'company', label: 'Company', width: 24 },
    { key: 'ownerName', label: 'Owner name', width: 24 },
    { key: 'email', label: 'Email', width: 26 },
    { key: 'phone', label: 'Phone', width: 16 },
    { key: 'role', label: 'Role', width: 16 },
    { key: 'panNumber', label: 'PAN', width: 18 },
    { key: 'businessRegistrationNumber', label: 'Business reg.', width: 18 },
    { key: 'address', label: 'Address', width: 28 },
    { key: 'bookingsCount', label: 'Bookings count', width: 14 },
    { key: 'registrationDate', label: 'Registration date', width: 24 }
  ]);
}

async function writeBookingsSheet() {
  const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
  const rows = bookings.map((b) => ({
    bookingId: b.bookingId,
    type: b.bookingType,
    passenger: b.passenger,
    routeOrPackage: b.bookingType === 'TOUR' ? (b.packageTitle || b.packageId) : `${b.from} -> ${b.to}`,
    routeId: b.routeId || '',
    travelDate: b.bookingType === 'TOUR' ? (b.travelDate || b.date) : b.date,
    seats: (b.seats || []).join(' | '),
    total: b.total,
    currency: b.currency || 'NPR',
    bookingStatus: b.bookingStatus,
    paymentStatus: b.paymentStatus,
    createdAt: safeIso(b.createdAt)
  }));

  return writeWorkbook('bookings-latest.xlsx', 'Bookings', rows, [
    { key: 'bookingId', label: 'Booking ID', width: 22 },
    { key: 'type', label: 'Type', width: 12 },
    { key: 'passenger', label: 'Passenger', width: 22 },
    { key: 'routeOrPackage', label: 'Route / Package', width: 28 },
    { key: 'routeId', label: 'Route ID', width: 18 },
    { key: 'travelDate', label: 'Travel date', width: 16 },
    { key: 'seats', label: 'Seats', width: 18 },
    { key: 'total', label: 'Total', width: 12 },
    { key: 'currency', label: 'Currency', width: 12 },
    { key: 'bookingStatus', label: 'Booking status', width: 20 },
    { key: 'paymentStatus', label: 'Payment status', width: 18 },
    { key: 'createdAt', label: 'Created at', width: 24 }
  ]);
}

async function writePaymentsSheet() {
  const payments = await Payment.find({}).sort({ createdAt: -1 }).lean();
  const rows = payments.map((p) => ({
    paymentId: p.paymentId,
    bookingId: String(p.bookingId || ''),
    routeId: p.routeId || '',
    travelDate: p.travelDate || '',
    provider: p.provider,
    amount: p.amount,
    status: p.status,
    paymentRef: p.paymentRef || '',
    proofUrl: p.proofUrl || '',
    reviewedAt: safeIso(p.reviewedAt),
    createdAt: safeIso(p.createdAt)
  }));

  return writeWorkbook('payments-latest.xlsx', 'Payments', rows, [
    { key: 'paymentId', label: 'Payment ID', width: 22 },
    { key: 'bookingId', label: 'Booking ID', width: 22 },
    { key: 'routeId', label: 'Route ID', width: 18 },
    { key: 'travelDate', label: 'Travel date', width: 16 },
    { key: 'provider', label: 'Provider', width: 16 },
    { key: 'amount', label: 'Amount', width: 12 },
    { key: 'status', label: 'Status', width: 14 },
    { key: 'paymentRef', label: 'Payment reference', width: 20 },
    { key: 'proofUrl', label: 'Screenshot URL', width: 36 },
    { key: 'reviewedAt', label: 'Reviewed at', width: 24 },
    { key: 'createdAt', label: 'Created at', width: 24 }
  ]);
}

module.exports = {
  ensureExportDir,
  writeUsersSheet,
  writeBookingsSheet,
  writePaymentsSheet,
  exportDir
};
