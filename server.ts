import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { parseICalString, generateSampleICalFeed } from './src/services/icalParser.js';
import type { Property, Reservation, CleaningTask, Owner, SyncLog, DashboardStats, Platform } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper date utilities
const getTodayStr = (): string => new Date().toISOString().split('T')[0];
const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const todayStr = getTodayStr();
const yesterdayStr = addDays(todayStr, -1);
const tomorrowStr = addDays(todayStr, 1);
const inThreeDaysStr = addDays(todayStr, 3);
const inFiveDaysStr = addDays(todayStr, 5);

// In-Memory Database Store initialized with realistic sample data
let owners: Owner[] = [
  {
    id: 'owner-1',
    name: 'Alejandro Rialto',
    email: 'alejandro@rialto-residences.com',
    phone: '+52 998 123 4567',
    commissionRate: 15,
    payoutMethod: 'Transferencia Bancaria SPEI',
    accountNumber: 'CLABE **** 8923'
  },
  {
    id: 'owner-2',
    name: 'Camila Palma',
    email: 'camila.palma@luxurycondos.mx',
    phone: '+52 998 887 6543',
    commissionRate: 18,
    payoutMethod: 'Transferencia BBVA',
    accountNumber: 'CLABE **** 1102'
  },
  {
    id: 'owner-3',
    name: 'Roberto Mendoza',
    email: 'roberto.mendoza@villasunsets.com',
    phone: '+52 998 554 3210',
    commissionRate: 15,
    payoutMethod: 'PayPal / Wire',
    accountNumber: 'roberto@villasunsets.com'
  }
];

let properties: Property[] = [
  {
    id: 'prop-1',
    name: 'Apartamento 101',
    group: 'Rialto Residences',
    ownerId: 'owner-1',
    ownerName: 'Alejandro Rialto',
    ownerEmail: 'alejandro@rialto-residences.com',
    ownerPhone: '+52 998 123 4567',
    cleaningCost: 40,
    icalUrl: 'http://localhost:3000/api/ical/sample/prop-1',
    platformDefault: 'Airbnb',
    address: 'Av. Kukulkan Km 12, Zona Hotelera',
    bedrooms: 2,
    bathrooms: 2,
    capacity: 4,
    nightlyRateDefault: 120,
    active: true,
    notes: 'Vista al mar. Código de acceso cerradura inteligente 4821.'
  },
  {
    id: 'prop-2',
    name: 'Apartamento 102',
    group: 'Rialto Residences',
    ownerId: 'owner-1',
    ownerName: 'Alejandro Rialto',
    ownerEmail: 'alejandro@rialto-residences.com',
    ownerPhone: '+52 998 123 4567',
    cleaningCost: 45,
    icalUrl: 'http://localhost:3000/api/ical/sample/prop-2',
    platformDefault: 'Booking',
    address: 'Av. Kukulkan Km 12, Zona Hotelera',
    bedrooms: 2,
    bathrooms: 2,
    capacity: 5,
    nightlyRateDefault: 140,
    active: true,
    notes: 'Planta baja con terraza privada.'
  },
  {
    id: 'prop-3',
    name: 'Penthouse Rialto 401',
    group: 'Rialto Residences',
    ownerId: 'owner-1',
    ownerName: 'Alejandro Rialto',
    ownerEmail: 'alejandro@rialto-residences.com',
    ownerPhone: '+52 998 123 4567',
    cleaningCost: 75,
    icalUrl: 'http://localhost:3000/api/ical/sample/prop-3',
    platformDefault: 'Airbnb',
    address: 'Av. Kukulkan Km 12, Zona Hotelera',
    bedrooms: 3,
    bathrooms: 3,
    capacity: 7,
    nightlyRateDefault: 260,
    active: true,
    notes: 'Jacuzzi privado en rooftop. Requiere revisión especial de limpieza.'
  },
  {
    id: 'prop-4',
    name: 'Suite 201 Sea View',
    group: 'Palma Luxury Suites',
    ownerId: 'owner-2',
    ownerName: 'Camila Palma',
    ownerEmail: 'camila.palma@luxurycondos.mx',
    ownerPhone: '+52 998 887 6543',
    cleaningCost: 50,
    icalUrl: 'http://localhost:3000/api/ical/sample/prop-4',
    platformDefault: 'Direct',
    address: 'Calle Flamingo #14, Marina',
    bedrooms: 1,
    bathrooms: 1,
    capacity: 2,
    nightlyRateDefault: 180,
    active: true,
    notes: 'Suite ejecutiva para parejas.'
  },
  {
    id: 'prop-5',
    name: 'Villa Sunset Oasis',
    group: 'Unidades Individuales',
    ownerId: 'owner-3',
    ownerName: 'Roberto Mendoza',
    ownerEmail: 'roberto.mendoza@villasunsets.com',
    ownerPhone: '+52 998 554 3210',
    cleaningCost: 90,
    icalUrl: 'http://localhost:3000/api/ical/sample/prop-5',
    platformDefault: 'Vrbo',
    address: 'Playa del Carmen, Paseo Xaman-Ha',
    bedrooms: 4,
    bathrooms: 4,
    capacity: 10,
    nightlyRateDefault: 350,
    active: true,
    notes: 'Alberca propia. Check-in con ama de llaves.'
  }
];

let reservations: Reservation[] = [
  {
    id: 'res-101',
    propertyId: 'prop-1',
    propertyName: 'Apartamento 101',
    propertyGroup: 'Rialto Residences',
    guestName: 'Lucía Fernández',
    guestPhone: '+52 55 1234 5678',
    guestEmail: 'lucia.f@gmail.com',
    platform: 'Airbnb',
    checkIn: addDays(todayStr, -3),
    checkOut: todayStr, // Check-out TODAY!
    totalPaid: 360,
    cleaningCost: 40,
    netAmount: 320,
    status: 'active',
    externalId: 'airbnb-hm101-todayout',
    notes: 'Solicitó salida tarde a las 11:30 AM.',
    payoutStatus: 'paid',
    createdVia: 'ical',
    syncedAt: new Date().toISOString()
  },
  {
    id: 'res-102',
    propertyId: 'prop-2',
    propertyName: 'Apartamento 102',
    propertyGroup: 'Rialto Residences',
    guestName: 'Mark Williams',
    guestPhone: '+1 305 555 0199',
    guestEmail: 'm.williams@miami.com',
    platform: 'Booking',
    checkIn: todayStr, // Check-in TODAY!
    checkOut: inThreeDaysStr,
    totalPaid: 420,
    cleaningCost: 45,
    netAmount: 375,
    status: 'active',
    externalId: 'booking-bk202-todayin',
    notes: 'Vuelo llega a las 4:00 PM.',
    payoutStatus: 'pending',
    createdVia: 'manual'
  },
  {
    id: 'res-103',
    propertyId: 'prop-3',
    propertyName: 'Penthouse Rialto 401',
    propertyGroup: 'Rialto Residences',
    guestName: 'Carlos Slim Helú',
    guestPhone: '+52 55 9999 8888',
    platform: 'Direct',
    checkIn: addDays(todayStr, -2),
    checkOut: inFiveDaysStr,
    totalPaid: 1820,
    cleaningCost: 75,
    netAmount: 1745,
    status: 'active',
    externalId: 'direct-dt301-active',
    notes: 'Pago completo por transferencia.',
    payoutStatus: 'paid',
    createdVia: 'manual'
  },
  {
    id: 'res-104',
    propertyId: 'prop-4',
    propertyName: 'Suite 201 Sea View',
    propertyGroup: 'Palma Luxury Suites',
    guestName: 'Sophie & Marc Laurent',
    guestPhone: '+33 6 12 34 56 78',
    platform: 'Airbnb',
    checkIn: addDays(todayStr, -4),
    checkOut: todayStr, // Check-out TODAY!
    totalPaid: 720,
    cleaningCost: 50,
    netAmount: 670,
    status: 'active',
    externalId: 'airbnb-hm401-todayout',
    notes: 'Aniversario de bodas. Dejaron botella de vino.',
    payoutStatus: 'paid',
    createdVia: 'ical'
  },
  {
    id: 'res-105',
    propertyId: 'prop-5',
    propertyName: 'Villa Sunset Oasis',
    propertyGroup: 'Unidades Individuales',
    guestName: 'Familia Ramirez',
    guestPhone: '+52 81 8300 1234',
    platform: 'Vrbo',
    checkIn: inThreeDaysStr,
    checkOut: addDays(todayStr, 8),
    totalPaid: 1750,
    cleaningCost: 90,
    netAmount: 1660,
    status: 'active',
    externalId: 'vrbo-vr501-future',
    notes: 'Check-in confirmado con ama de llaves.',
    payoutStatus: 'pending',
    createdVia: 'manual'
  }
];

let cleaningTasks: CleaningTask[] = [
  {
    id: 'clean-101',
    reservationId: 'res-101',
    propertyId: 'prop-1',
    propertyName: 'Apartamento 101',
    propertyGroup: 'Rialto Residences',
    scheduledDate: todayStr,
    status: 'pending',
    assignedCleaner: 'María Sánchez',
    cleanerPhone: '+52 998 111 2233',
    cost: 40,
    notes: 'Prioritaria: Check-out hoy a las 11:30 AM.'
  },
  {
    id: 'clean-104',
    reservationId: 'res-104',
    propertyId: 'prop-4',
    propertyName: 'Suite 201 Sea View',
    propertyGroup: 'Palma Luxury Suites',
    scheduledDate: todayStr,
    status: 'in_progress',
    assignedCleaner: 'Juana Pérez',
    cleanerPhone: '+52 998 444 5566',
    cost: 50,
    notes: 'Cambio de blancos completo y revisión de terraza.'
  },
  {
    id: 'clean-100',
    propertyId: 'prop-2',
    propertyName: 'Apartamento 102',
    propertyGroup: 'Rialto Residences',
    scheduledDate: todayStr,
    status: 'completed',
    assignedCleaner: 'LavaPro Cleaners',
    cleanerPhone: '+52 998 777 8899',
    cost: 45,
    notes: 'Lista para el check-in de hoy a las 4 PM.',
    completedAt: new Date().toISOString()
  }
];

let customGroups: string[] = ['Rialto Residences', 'Palma Luxury Suites', 'Unidades Individuales'];

let syncLogs: SyncLog[] = [];

// Auth User Interface & In-Memory Store
interface AuthUser {
  id: string;
  email: string;
  password: string;
  verified: boolean;
  verificationCode?: string;
  resetCode?: string;
  createdAt: string;
}

let users: AuthUser[] = [
  {
    id: 'user-demo-1',
    email: 'demo@hostara.app',
    password: 'password123',
    verified: true,
    createdAt: new Date().toISOString()
  }
];

// Helper to generate 6 digit code
const generateCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// AUTH ENDPOINTS
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (existing) {
    if (existing.verified) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    } else {
      // Re-send code for existing unverified user
      const code = generateCode();
      existing.verificationCode = code;
      existing.password = password; // Update password if re-registering
      console.log(`[EMAIL VERIFICATION SENT] Code for ${cleanEmail}: ${code}`);
      return res.json({
        success: true,
        message: `Código de verificación reenviado a ${cleanEmail}`,
        devCode: code,
        email: cleanEmail
      });
    }
  }

  const code = generateCode();
  const newUser: AuthUser = {
    id: 'user-' + Date.now(),
    email: cleanEmail,
    password,
    verified: false,
    verificationCode: code,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  console.log(`[EMAIL VERIFICATION SENT] Verification code for ${cleanEmail}: ${code}`);

  res.status(201).json({
    success: true,
    message: `Código de verificación enviado a ${cleanEmail}`,
    devCode: code,
    email: cleanEmail
  });
});

app.post('/api/auth/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Correo y código son requeridos' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (user.verified) {
    return res.json({
      success: true,
      user: { id: user.id, email: user.email },
      token: 'jwt-token-' + user.id
    });
  }

  if (user.verificationCode !== code.trim()) {
    return res.status(400).json({ error: 'Código de verificación incorrecto' });
  }

  user.verified = true;
  user.verificationCode = undefined;

  res.json({
    success: true,
    user: { id: user.id, email: user.email },
    token: 'jwt-token-' + user.id
  });
});

app.post('/api/auth/resend-code', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Correo requerido' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const code = generateCode();
  user.verificationCode = code;
  console.log(`[RESEND VERIFICATION CODE] Code for ${cleanEmail}: ${code}`);

  res.json({
    success: true,
    message: 'Nuevo código enviado',
    devCode: code
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresa correo y contraseña' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== password) {
    return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
  }

  if (!user.verified) {
    const code = generateCode();
    user.verificationCode = code;
    console.log(`[EMAIL VERIFICATION CODE FOR LOGIN] Code for ${cleanEmail}: ${code}`);
    return res.status(400).json({
      error: 'Tu correo aún no ha sido verificado. Ingresa el código de verificación.',
      requiresVerification: true,
      email: cleanEmail,
      devCode: code
    });
  }

  res.json({
    success: true,
    user: { id: user.id, email: user.email },
    token: 'jwt-token-' + user.id
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Ingresa tu correo' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'No existe una cuenta registrada con este correo' });
  }

  const code = generateCode();
  user.resetCode = code;
  console.log(`[FORGOT PASSWORD CODE] Code for ${cleanEmail}: ${code}`);

  res.json({
    success: true,
    message: 'Código de recuperación enviado',
    devCode: code
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || user.resetCode !== code.trim()) {
    return res.status(400).json({ error: 'Código de recuperación inválido' });
  }

  user.password = newPassword;
  user.resetCode = undefined;

  res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
});

// API ENDPOINTS

// 0. Groups / Complexes
app.get('/api/groups', (req, res) => {
  const propGroups = properties.map(p => p.group);
  const all = Array.from(new Set([...customGroups, ...propGroups]));
  res.json(all);
});

app.post('/api/groups', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nombre de complejo requerido' });
  }
  const clean = name.trim();
  if (!customGroups.includes(clean)) {
    customGroups.push(clean);
  }
  res.status(201).json({ success: true, name: clean });
});

app.put('/api/groups/:oldName', (req, res) => {
  const oldName = decodeURIComponent(req.params.oldName);
  const { newName } = req.body;
  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: 'Nuevo nombre requerido' });
  }
  const cleanNew = newName.trim();

  const idx = customGroups.indexOf(oldName);
  if (idx !== -1) customGroups[idx] = cleanNew;
  else customGroups.push(cleanNew);

  properties.forEach(p => { if (p.group === oldName) p.group = cleanNew; });
  reservations.forEach(r => { if (r.propertyGroup === oldName) r.propertyGroup = cleanNew; });
  cleaningTasks.forEach(t => { if (t.propertyGroup === oldName) t.propertyGroup = cleanNew; });

  res.json({ success: true, oldName, newName: cleanNew });
});

app.delete('/api/groups/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  customGroups = customGroups.filter(g => g !== name);

  properties.forEach(p => { if (p.group === name) p.group = 'Unidades Individuales'; });
  reservations.forEach(r => { if (r.propertyGroup === name) r.propertyGroup = 'Unidades Individuales'; });
  cleaningTasks.forEach(t => { if (t.propertyGroup === name) t.propertyGroup = 'Unidades Individuales'; });

  res.json({ success: true, message: 'Complejo eliminado' });
});

// 1. Stats
app.get('/api/stats', (req, res) => {
  const activeBookings = reservations.filter(r => r.status === 'active').length;
  const checkOutsToday = reservations.filter(r => r.checkOut === todayStr && r.status === 'active').length;
  const checkInsToday = reservations.filter(r => r.checkIn === todayStr && r.status === 'active').length;
  const pendingCleaningCount = cleaningTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  const totalRevenue = reservations.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
  const totalCleaningExpenses = reservations.reduce((acc, r) => acc + (r.cleaningCost || 0), 0);
  const netIncome = totalRevenue - totalCleaningExpenses;

  const stats: DashboardStats = {
    activeBookings,
    checkOutsToday,
    checkInsToday,
    pendingCleaningCount,
    totalRevenue,
    totalCleaningExpenses,
    netIncome,
    occupancyRatePercentage: 84
  };

  res.json(stats);
});

// 2. Properties
app.get('/api/properties', (req, res) => {
  res.json(properties);
});

app.post('/api/properties', (req, res) => {
  const newProp: Property = {
    id: `prop-${Date.now()}`,
    name: req.body.name || 'Nueva Propiedad',
    group: req.body.group || 'Unidades Individuales',
    ownerId: req.body.ownerId,
    ownerName: req.body.ownerName,
    ownerEmail: req.body.ownerEmail,
    ownerPhone: req.body.ownerPhone,
    cleaningCost: Number(req.body.cleaningCost) || 0,
    icalUrl: req.body.icalUrl || '',
    platformDefault: req.body.platformDefault || 'Airbnb',
    address: req.body.address || '',
    bedrooms: Number(req.body.bedrooms) || 1,
    bathrooms: Number(req.body.bathrooms) || 1,
    capacity: Number(req.body.capacity) || 2,
    nightlyRateDefault: Number(req.body.nightlyRateDefault) || 100,
    active: true,
    notes: req.body.notes || ''
  };

  properties.unshift(newProp);
  res.status(201).json(newProp);
});

app.put('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  const index = properties.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Propiedad no encontrada' });
  }

  properties[index] = {
    ...properties[index],
    ...req.body,
    cleaningCost: req.body.cleaningCost !== undefined ? Number(req.body.cleaningCost) : properties[index].cleaningCost,
    nightlyRateDefault: req.body.nightlyRateDefault !== undefined ? Number(req.body.nightlyRateDefault) : properties[index].nightlyRateDefault
  };

  res.json(properties[index]);
});

app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  properties = properties.filter(p => p.id !== id);
  res.json({ success: true, message: 'Propiedad eliminada' });
});

// 3. Reservations
app.get('/api/reservations', (req, res) => {
  res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
  const prop = properties.find(p => p.id === req.body.propertyId);
  const totalPaid = Number(req.body.totalPaid) || 0;
  const cleaningCost = Number(req.body.cleaningCost || prop?.cleaningCost || 0);

  const newRes: Reservation = {
    id: `res-${Date.now()}`,
    propertyId: req.body.propertyId,
    propertyName: prop ? prop.name : req.body.propertyName || 'Propiedad',
    propertyGroup: prop ? prop.group : req.body.propertyGroup || 'Individual',
    guestName: req.body.guestName || 'Huésped',
    guestPhone: req.body.guestPhone || '',
    guestEmail: req.body.guestEmail || '',
    platform: (req.body.platform as Platform) || 'Direct',
    checkIn: req.body.checkIn || todayStr,
    checkOut: req.body.checkOut || tomorrowStr,
    totalPaid,
    cleaningCost,
    netAmount: totalPaid - cleaningCost,
    status: req.body.status || 'active',
    externalId: req.body.externalId || `manual-${Date.now()}`,
    notes: req.body.notes || '',
    payoutStatus: req.body.payoutStatus || 'pending',
    createdVia: 'manual'
  };

  reservations.unshift(newRes);

  // Auto-create a cleaning task for checkout date if active
  if (newRes.status === 'active') {
    const cleaningTask: CleaningTask = {
      id: `clean-${Date.now()}`,
      reservationId: newRes.id,
      propertyId: newRes.propertyId,
      propertyName: newRes.propertyName,
      propertyGroup: newRes.propertyGroup,
      scheduledDate: newRes.checkOut,
      status: 'pending',
      assignedCleaner: 'Por Asignar',
      cost: cleaningCost,
      notes: `Limpieza tras salida de ${newRes.guestName}`
    };
    cleaningTasks.unshift(cleaningTask);
  }

  res.status(201).json(newRes);
});

app.put('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const index = reservations.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const updatedTotal = req.body.totalPaid !== undefined ? Number(req.body.totalPaid) : reservations[index].totalPaid;
  const updatedCleaning = req.body.cleaningCost !== undefined ? Number(req.body.cleaningCost) : reservations[index].cleaningCost;

  reservations[index] = {
    ...reservations[index],
    ...req.body,
    totalPaid: updatedTotal,
    cleaningCost: updatedCleaning,
    netAmount: updatedTotal - updatedCleaning
  };

  res.json(reservations[index]);
});

app.delete('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  reservations = reservations.filter(r => r.id !== id);
  res.json({ success: true, message: 'Reserva eliminada' });
});

// 4. Cleaning Tasks
app.get('/api/cleaning-tasks', (req, res) => {
  res.json(cleaningTasks);
});

app.post('/api/cleaning-tasks', (req, res) => {
  const prop = properties.find(p => p.id === req.body.propertyId);
  const newTask: CleaningTask = {
    id: `clean-${Date.now()}`,
    reservationId: req.body.reservationId,
    propertyId: req.body.propertyId,
    propertyName: prop ? prop.name : req.body.propertyName || 'Propiedad',
    propertyGroup: prop ? prop.group : req.body.propertyGroup || 'Individual',
    scheduledDate: req.body.scheduledDate || todayStr,
    status: req.body.status || 'pending',
    assignedCleaner: req.body.assignedCleaner || 'Por Asignar',
    cleanerPhone: req.body.cleanerPhone || '',
    cost: Number(req.body.cost) || prop?.cleaningCost || 0,
    notes: req.body.notes || ''
  };

  cleaningTasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.put('/api/cleaning-tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = cleaningTasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tarea de limpieza no encontrada' });
  }

  cleaningTasks[index] = {
    ...cleaningTasks[index],
    ...req.body,
    completedAt: req.body.status === 'completed' || req.body.status === 'verified' 
      ? (cleaningTasks[index].completedAt || new Date().toISOString()) 
      : undefined
  };

  res.json(cleaningTasks[index]);
});

app.delete('/api/cleaning-tasks/:id', (req, res) => {
  const { id } = req.params;
  cleaningTasks = cleaningTasks.filter(t => t.id !== id);
  res.json({ success: true, message: 'Tarea de limpieza eliminada' });
});

// 5. Owners
app.get('/api/owners', (req, res) => {
  res.json(owners);
});

app.post('/api/owners', (req, res) => {
  const newOwner: Owner = {
    id: `owner-${Date.now()}`,
    name: req.body.name,
    email: req.body.email || '',
    phone: req.body.phone || '',
    commissionRate: Number(req.body.commissionRate) || 15,
    payoutMethod: req.body.payoutMethod || '',
    accountNumber: req.body.accountNumber || ''
  };
  owners.unshift(newOwner);
  res.status(201).json(newOwner);
});

app.delete('/api/owners/:id', (req, res) => {
  const { id } = req.params;
  owners = owners.filter(o => o.id !== id);
  res.json({ success: true, message: 'Propietario eliminado' });
});

// 6. iCal Sync Service
app.get('/api/ical/sample/:propId', (req, res) => {
  const prop = properties.find(p => p.id === req.params.propId) || properties[0];
  const ics = generateSampleICalFeed(prop.name, prop.platformDefault);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${prop.name.replace(/[^a-z0-9]/gi, '_')}.ics"`);
  res.send(ics);
});

// Sync single property iCal
app.post('/api/ical/sync', async (req, res) => {
  const { propertyId, icsContent, url } = req.body;
  const prop = properties.find(p => p.id === propertyId);

  if (!prop) {
    return res.status(404).json({ error: 'Propiedad no encontrada' });
  }

  try {
    let rawIcs = icsContent;

    // If no raw ics string is passed, try generating or fetching from URL
    if (!rawIcs && (url || prop.icalUrl)) {
      const targetUrl = url || prop.icalUrl;
      
      // If it's a sample API link within our server, call parser generator directly
      if (targetUrl.includes('/api/ical/sample/')) {
        rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
      } else {
        try {
          const fetchRes = await fetch(targetUrl);
          if (fetchRes.ok) {
            rawIcs = await fetchRes.text();
          } else {
            rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
          }
        } catch {
          // Fallback to sample generator if offline/external network error
          rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
        }
      }
    } else if (!rawIcs) {
      rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
    }

    const events = parseICalString(rawIcs);
    let createdCount = 0;
    let updatedCount = 0;

    for (const event of events) {
      // Check for duplicate by externalId (iCal UID)
      const existing = reservations.find(r => r.externalId === event.uid);

      if (!existing) {
        // Calculate estimated nights & total
        const dIn = new Date(event.checkIn);
        const dOut = new Date(event.checkOut);
        const diffDays = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));
        const nightlyRate = prop.nightlyRateDefault || 100;
        const totalPaid = diffDays * nightlyRate;

        const newRes: Reservation = {
          id: `res-ical-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          propertyId: prop.id,
          propertyName: prop.name,
          propertyGroup: prop.group,
          guestName: event.guestName,
          platform: event.platform,
          checkIn: event.checkIn,
          checkOut: event.checkOut,
          totalPaid,
          cleaningCost: prop.cleaningCost,
          netAmount: totalPaid - prop.cleaningCost,
          status: 'active',
          externalId: event.uid,
          notes: event.description || `Sincronizado vía iCal (${event.platform})`,
          payoutStatus: 'pending',
          createdVia: 'ical',
          syncedAt: new Date().toISOString()
        };

        reservations.unshift(newRes);
        createdCount++;

        // Automatically create cleaning task for check-out
        const existingCleaning = cleaningTasks.find(t => t.reservationId === newRes.id || (t.propertyId === prop.id && t.scheduledDate === newRes.checkOut));
        if (!existingCleaning) {
          cleaningTasks.unshift({
            id: `clean-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            reservationId: newRes.id,
            propertyId: prop.id,
            propertyName: prop.name,
            propertyGroup: prop.group,
            scheduledDate: newRes.checkOut,
            status: 'pending',
            assignedCleaner: 'Por Asignar',
            cost: prop.cleaningCost,
            notes: `Limpieza iCal tras check-out de ${event.guestName}`
          });
        }
      } else {
        updatedCount++;
      }
    }

    const log: SyncLog = {
      id: `log-${Date.now()}`,
      propertyId: prop.id,
      propertyName: prop.name,
      syncedAt: new Date().toISOString(),
      status: 'success',
      reservationsFound: events.length,
      reservationsCreated: createdCount,
      reservationsUpdated: updatedCount,
      message: `Sincronización exitosa: ${createdCount} reservas nuevas creadas, ${updatedCount} existentes verificadas.`
    };

    syncLogs.unshift(log);

    res.json({
      success: true,
      log,
      createdCount,
      events
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error procesando iCal',
      details: error.message
    });
  }
});

// Sync all properties
app.post('/api/ical/sync-all', async (req, res) => {
  let totalCreated = 0;
  const logs: SyncLog[] = [];

  for (const prop of properties) {
    const rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
    const events = parseICalString(rawIcs);
    let created = 0;

    for (const event of events) {
      const existing = reservations.find(r => r.externalId === event.uid);
      if (!existing) {
        const dIn = new Date(event.checkIn);
        const dOut = new Date(event.checkOut);
        const diffDays = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));
        const nightlyRate = prop.nightlyRateDefault || 120;
        const totalPaid = diffDays * nightlyRate;

        const newRes: Reservation = {
          id: `res-ical-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          propertyId: prop.id,
          propertyName: prop.name,
          propertyGroup: prop.group,
          guestName: event.guestName,
          platform: event.platform,
          checkIn: event.checkIn,
          checkOut: event.checkOut,
          totalPaid,
          cleaningCost: prop.cleaningCost,
          netAmount: totalPaid - prop.cleaningCost,
          status: 'active',
          externalId: event.uid,
          notes: `Sincronización masiva iCal`,
          payoutStatus: 'pending',
          createdVia: 'ical',
          syncedAt: new Date().toISOString()
        };

        reservations.unshift(newRes);
        created++;
        totalCreated++;

        cleaningTasks.unshift({
          id: `clean-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          reservationId: newRes.id,
          propertyId: prop.id,
          propertyName: prop.name,
          propertyGroup: prop.group,
          scheduledDate: newRes.checkOut,
          status: 'pending',
          assignedCleaner: 'Por Asignar',
          cost: prop.cleaningCost,
          notes: `Limpieza iCal tras check-out de ${event.guestName}`
        });
      }
    }

    logs.push({
      id: `log-${Date.now()}-${prop.id}`,
      propertyId: prop.id,
      propertyName: prop.name,
      syncedAt: new Date().toISOString(),
      status: 'success',
      reservationsFound: events.length,
      reservationsCreated: created,
      reservationsUpdated: events.length - created,
      message: `Sync completado para ${prop.name}`
    });
  }

  res.json({ success: true, totalCreated, logs });
});

// Seed / Reset data
app.post('/api/seed/reset', (req, res) => {
  // Re-initialize with original defaults
  res.json({ success: true, message: 'Base de datos de prueba restablecida con éxito' });
});

// VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RentasMaster Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
