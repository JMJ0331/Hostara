import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { parseICalString, generateSampleICalFeed } from './src/services/icalParser.js';
import type { Property, Reservation, CleaningTask, Owner, SyncLog, DashboardStats, Platform } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Per-User Store definition
interface UserStore {
  owners: Owner[];
  properties: Property[];
  reservations: Reservation[];
  cleaningTasks: CleaningTask[];
  customGroups: string[];
  syncLogs: SyncLog[];
}

function createInitialSampleStore(): UserStore {
  const t = getTodayStr(); // e.g. "2026-08-03"

  const owners: Owner[] = [
    {
      id: 'owner-1',
      name: 'Carlos Alarcón',
      email: 'carlos@alarconproperties.com',
      phone: '+52 555 234 5678',
      commissionRate: 15,
      payoutMethod: 'Transferencia Bancaria'
    },
    {
      id: 'owner-2',
      name: 'Sofía Mendoza',
      email: 'sofia.mendoza@gmail.com',
      phone: '+52 555 876 5432',
      commissionRate: 12,
      payoutMethod: 'Transferencia SPEI'
    },
    {
      id: 'owner-3',
      name: 'Roberto Sterling',
      email: 'r.sterling@luxuryrentals.mx',
      phone: '+52 555 999 1122',
      commissionRate: 20,
      payoutMethod: 'Depósito Directo'
    }
  ];

  const customGroups = ['Complejo Marina Bay', 'Residencial Beachfront', 'Cabañas del Valle', 'Unidades Individuales'];

  const properties: Property[] = [
    {
      id: 'prop-1',
      name: 'Villa Paraíso 101',
      group: 'Complejo Marina Bay',
      ownerId: 'owner-1',
      ownerName: 'Carlos Alarcón',
      ownerEmail: 'carlos@alarconproperties.com',
      ownerPhone: '+52 555 234 5678',
      cleaningCost: 60,
      nightlyRateDefault: 180,
      capacity: 6,
      bedrooms: 3,
      bathrooms: 2,
      platformDefault: 'Airbnb',
      address: 'Av. Marina 101, Cancún',
      active: true,
      notes: 'Vista al mar, alberca compartida y estacionamiento privado.',
      icalUrl: 'https://www.airbnb.com/calendar/ical/sample-101.ics'
    },
    {
      id: 'prop-2',
      name: 'Penthouse Loft Marina 402',
      group: 'Complejo Marina Bay',
      ownerId: 'owner-1',
      ownerName: 'Carlos Alarcón',
      ownerEmail: 'carlos@alarconproperties.com',
      ownerPhone: '+52 555 234 5678',
      cleaningCost: 85,
      nightlyRateDefault: 250,
      capacity: 4,
      bedrooms: 2,
      bathrooms: 2.5,
      platformDefault: 'Booking',
      address: 'Av. Marina 402, Cancún',
      active: true,
      notes: 'Penthouse de lujo con jacuzzi privado en terraza.',
      icalUrl: 'https://www.booking.com/ical/sample-402.ics'
    },
    {
      id: 'prop-3',
      name: 'Sunset Beach Condo 3B',
      group: 'Residencial Beachfront',
      ownerId: 'owner-2',
      ownerName: 'Sofía Mendoza',
      ownerEmail: 'sofia.mendoza@gmail.com',
      ownerPhone: '+52 555 876 5432',
      cleaningCost: 50,
      nightlyRateDefault: 140,
      capacity: 4,
      bedrooms: 2,
      bathrooms: 1,
      platformDefault: 'Airbnb',
      address: 'Calle Del Mar 45, Playa del Carmen',
      active: true,
      notes: 'A 200m de la playa, balcón amueblado y wifi de alta velocidad.',
      icalUrl: 'https://www.airbnb.com/calendar/ical/sample-3b.ics'
    },
    {
      id: 'prop-4',
      name: 'Cabaña Valle del Sol',
      group: 'Cabañas del Valle',
      ownerId: 'owner-2',
      ownerName: 'Sofía Mendoza',
      ownerEmail: 'sofia.mendoza@gmail.com',
      ownerPhone: '+52 555 876 5432',
      cleaningCost: 40,
      nightlyRateDefault: 110,
      capacity: 2,
      bedrooms: 1,
      bathrooms: 1,
      platformDefault: 'Vrbo',
      address: 'Camino al Valle Km 4, Valle de Bravo',
      active: true,
      notes: 'Cabaña rústica con chimenea y fogatero exterior.',
      icalUrl: 'https://www.vrbo.com/ical/sample-valle.ics'
    },
    {
      id: 'prop-5',
      name: 'Casa Real - Centro Histórico',
      group: 'Unidades Individuales',
      ownerId: 'owner-3',
      ownerName: 'Roberto Sterling',
      ownerEmail: 'r.sterling@luxuryrentals.mx',
      ownerPhone: '+52 555 999 1122',
      cleaningCost: 100,
      nightlyRateDefault: 320,
      capacity: 8,
      bedrooms: 4,
      bathrooms: 4,
      platformDefault: 'Direct',
      address: 'Calle Hidalgo 12, San Miguel de Allende',
      active: true,
      notes: 'Casona colonial restaurada con patio central y fuentes.',
      icalUrl: ''
    }
  ];

  const reservations: Reservation[] = [
    // Current active reservations
    {
      id: 'res-sample-1',
      propertyId: 'prop-1',
      propertyName: 'Villa Paraíso 101',
      propertyGroup: 'Complejo Marina Bay',
      guestName: 'Mateo Rossi',
      guestPhone: '+52 555 111 2233',
      guestEmail: 'mateo.rossi@example.com',
      platform: 'Airbnb',
      checkIn: addDays(t, -2),
      checkOut: addDays(t, 3),
      totalPaid: 900,
      cleaningCost: 60,
      netAmount: 840,
      status: 'active',
      payoutStatus: 'paid',
      externalId: 'HM-89214',
      notes: 'Solicitó cuna para bebé.',
      createdVia: 'ical'
    },
    {
      id: 'res-sample-2',
      propertyId: 'prop-2',
      propertyName: 'Penthouse Loft Marina 402',
      propertyGroup: 'Complejo Marina Bay',
      guestName: 'Camila Silva',
      guestPhone: '+52 555 333 4455',
      guestEmail: 'camila.silva@example.com',
      platform: 'Booking',
      checkIn: t,
      checkOut: addDays(t, 4),
      totalPaid: 1250,
      cleaningCost: 85,
      netAmount: 1165,
      status: 'active',
      payoutStatus: 'pending',
      externalId: 'BK-99302',
      notes: 'Llegada tarde alrededor de las 8:00 PM.',
      createdVia: 'ical'
    },
    {
      id: 'res-sample-3',
      propertyId: 'prop-3',
      propertyName: 'Sunset Beach Condo 3B',
      propertyGroup: 'Residencial Beachfront',
      guestName: 'Diego Torres',
      guestPhone: '+52 555 444 5566',
      guestEmail: 'diego.torres@example.com',
      platform: 'Airbnb',
      checkIn: addDays(t, 2),
      checkOut: addDays(t, 6),
      totalPaid: 700,
      cleaningCost: 50,
      netAmount: 650,
      status: 'active',
      payoutStatus: 'pending',
      externalId: 'HM-10492',
      notes: 'Reserva confirmada vía Airbnb.',
      createdVia: 'ical'
    },
    {
      id: 'res-sample-4',
      propertyId: 'prop-4',
      propertyName: 'Cabaña Valle del Sol',
      propertyGroup: 'Cabañas del Valle',
      guestName: 'Ana María López',
      guestPhone: '+52 555 666 7788',
      guestEmail: 'am.lopez@example.com',
      platform: 'Vrbo',
      checkIn: addDays(t, -5),
      checkOut: t,
      totalPaid: 550,
      cleaningCost: 40,
      netAmount: 510,
      status: 'active',
      payoutStatus: 'paid',
      externalId: 'VB-44012',
      notes: 'Check-out hoy a las 11:00 AM.',
      createdVia: 'ical'
    },
    {
      id: 'res-sample-5',
      propertyId: 'prop-5',
      propertyName: 'Casa Real - Centro Histórico',
      propertyGroup: 'Unidades Individuales',
      guestName: 'John Smith',
      guestPhone: '+1 305 555 0192',
      guestEmail: 'john.smith@example.com',
      platform: 'Direct',
      checkIn: addDays(t, 7),
      checkOut: addDays(t, 12),
      totalPaid: 1600,
      cleaningCost: 100,
      netAmount: 1500,
      status: 'active',
      payoutStatus: 'paid',
      externalId: 'DIR-88120',
      notes: 'Pago completo por transferencia directa.',
      createdVia: 'manual'
    },
    {
      id: 'res-sample-6',
      propertyId: 'prop-1',
      propertyName: 'Villa Paraíso 101',
      propertyGroup: 'Complejo Marina Bay',
      guestName: 'Valeria Gómez',
      guestPhone: '+52 555 777 8899',
      guestEmail: 'valeria.g@example.com',
      platform: 'Airbnb',
      checkIn: addDays(t, 14),
      checkOut: addDays(t, 18),
      totalPaid: 720,
      cleaningCost: 60,
      netAmount: 660,
      status: 'active',
      payoutStatus: 'pending',
      externalId: 'HM-11029',
      notes: 'Viaje de aniversario.',
      createdVia: 'ical'
    },
    // Past Month
    {
      id: 'res-sample-7',
      propertyId: 'prop-2',
      propertyName: 'Penthouse Loft Marina 402',
      propertyGroup: 'Complejo Marina Bay',
      guestName: 'Lucas Fernández',
      guestPhone: '+52 555 888 9900',
      guestEmail: 'lucas.f@example.com',
      platform: 'Booking',
      checkIn: '2026-07-10',
      checkOut: '2026-07-15',
      totalPaid: 1250,
      cleaningCost: 85,
      netAmount: 1165,
      status: 'completed',
      payoutStatus: 'paid',
      externalId: 'BK-77201',
      notes: 'Estancia excelente.',
      createdVia: 'manual'
    },
    {
      id: 'res-sample-8',
      propertyId: 'prop-3',
      propertyName: 'Sunset Beach Condo 3B',
      propertyGroup: 'Residencial Beachfront',
      guestName: 'Isabella Rossi',
      guestPhone: '+52 555 222 3344',
      guestEmail: 'isabella.r@example.com',
      platform: 'Airbnb',
      checkIn: '2026-07-20',
      checkOut: '2026-07-25',
      totalPaid: 700,
      cleaningCost: 50,
      netAmount: 650,
      status: 'completed',
      payoutStatus: 'paid',
      externalId: 'HM-66301',
      notes: 'Evaluación de 5 estrellas en Airbnb.',
      createdVia: 'ical'
    },
    {
      id: 'res-sample-9',
      propertyId: 'prop-1',
      propertyName: 'Villa Paraíso 101',
      propertyGroup: 'Complejo Marina Bay',
      guestName: 'Gabriel Morales',
      guestPhone: '+52 555 999 0011',
      guestEmail: 'gabriel.m@example.com',
      platform: 'Airbnb',
      checkIn: '2026-07-27',
      checkOut: '2026-08-01',
      totalPaid: 900,
      cleaningCost: 60,
      netAmount: 840,
      status: 'completed',
      payoutStatus: 'paid',
      externalId: 'HM-55102',
      notes: 'Check-out a tiempo.',
      createdVia: 'ical'
    },
    // Future Month
    {
      id: 'res-sample-10',
      propertyId: 'prop-5',
      propertyName: 'Casa Real - Centro Histórico',
      propertyGroup: 'Unidades Individuales',
      guestName: 'Elena Beltrán',
      guestPhone: '+52 555 444 3322',
      guestEmail: 'elena.b@example.com',
      platform: 'Airbnb',
      checkIn: '2026-09-05',
      checkOut: '2026-09-10',
      totalPaid: 1600,
      cleaningCost: 100,
      netAmount: 1500,
      status: 'active',
      payoutStatus: 'pending',
      externalId: 'HM-99881',
      notes: 'Reserva anticipada.',
      createdVia: 'ical'
    },
    {
      id: 'res-sample-11',
      propertyId: 'prop-4',
      propertyName: 'Cabaña Valle del Sol',
      propertyGroup: 'Cabañas del Valle',
      guestName: 'Santiago Rivas',
      guestPhone: '+52 555 111 9988',
      guestEmail: 'santiago.r@example.com',
      platform: 'Vrbo',
      checkIn: '2026-09-12',
      checkOut: '2026-09-16',
      totalPaid: 440,
      cleaningCost: 40,
      netAmount: 400,
      status: 'active',
      payoutStatus: 'pending',
      externalId: 'VB-33210',
      notes: 'Reserva de fin de semana.',
      createdVia: 'ical'
    }
  ];

  const cleaningTasks: CleaningTask[] = [
    {
      id: 'clean-sample-1',
      reservationId: 'res-sample-4',
      propertyId: 'prop-4',
      propertyName: 'Cabaña Valle del Sol',
      propertyGroup: 'Cabañas del Valle',
      scheduledDate: t,
      status: 'in_progress',
      assignedCleaner: 'Juana Pérez',
      cost: 40,
      notes: 'Limpieza tras salida hoy de Ana María López. Limpiar chimenea.'
    },
    {
      id: 'clean-sample-2',
      reservationId: 'res-sample-1',
      propertyId: 'prop-1',
      propertyName: 'Villa Paraíso 101',
      propertyGroup: 'Complejo Marina Bay',
      scheduledDate: addDays(t, 3),
      status: 'pending',
      assignedCleaner: 'María Delgado',
      cost: 60,
      notes: 'Limpieza completa tras salida de Mateo Rossi. Cambio de ropa de cama.'
    },
    {
      id: 'clean-sample-3',
      reservationId: 'res-sample-2',
      propertyId: 'prop-2',
      propertyName: 'Penthouse Loft Marina 402',
      propertyGroup: 'Complejo Marina Bay',
      scheduledDate: addDays(t, 4),
      status: 'pending',
      assignedCleaner: 'Pedro Gómez',
      cost: 85,
      notes: 'Limpieza de penthouse y reposición de toallas para jacuzzi.'
    },
    {
      id: 'clean-sample-4',
      reservationId: 'res-sample-9',
      propertyId: 'prop-1',
      propertyName: 'Villa Paraíso 101',
      propertyGroup: 'Complejo Marina Bay',
      scheduledDate: '2026-08-01',
      status: 'completed',
      assignedCleaner: 'María Delgado',
      cost: 60,
      notes: 'Limpieza impecable completada.'
    },
    {
      id: 'clean-sample-5',
      reservationId: 'res-sample-8',
      propertyId: 'prop-3',
      propertyName: 'Sunset Beach Condo 3B',
      propertyGroup: 'Residencial Beachfront',
      scheduledDate: '2026-07-25',
      status: 'completed',
      assignedCleaner: 'Juana Pérez',
      cost: 50,
      notes: 'Limpieza periódica y desinfección realizada.'
    }
  ];

  const syncLogs: SyncLog[] = [
    {
      id: 'log-sample-1',
      propertyId: 'prop-1',
      propertyName: 'Villa Paraíso 101',
      syncedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'success',
      reservationsFound: 4,
      reservationsCreated: 1,
      reservationsUpdated: 3,
      message: 'Sincronización automatizada iCal completada con éxito.'
    },
    {
      id: 'log-sample-2',
      propertyId: 'prop-2',
      propertyName: 'Penthouse Loft Marina 402',
      syncedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'success',
      reservationsFound: 3,
      reservationsCreated: 0,
      reservationsUpdated: 3,
      message: 'iCal sincronizado correctamente.'
    }
  ];

  return {
    owners,
    properties,
    reservations,
    cleaningTasks,
    customGroups,
    syncLogs
  };
}

const userStores = new Map<string, UserStore>();

function getStoreForReq(req: express.Request): UserStore {
  const emailHeader = (req.headers['x-user-email'] as string) || (req.query?.userEmail as string) || '';
  const key = emailHeader.trim().toLowerCase() || 'default';

  if (!userStores.has(key)) {
    userStores.set(key, createInitialSampleStore());
  } else {
    const existing = userStores.get(key)!;
    if (existing.properties.length === 0 && existing.reservations.length === 0) {
      userStores.set(key, createInitialSampleStore());
    }
  }
  return userStores.get(key)!;
}

// Auth User Interface & In-Memory Store
interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  avatarUrl?: string;
  verified: boolean;
  verificationCode?: string;
  resetCode?: string;
  createdAt: string;
}

let users: AuthUser[] = [
  {
    id: 'user-demo-1',
    firstName: 'Demo',
    lastName: 'Hostara',
    phone: '+52 555 123 4567',
    email: 'demo@hostara.app',
    password: 'password123',
    avatarUrl: '',
    verified: true,
    createdAt: new Date().toISOString()
  }
];

// Helper to generate 6 digit code
const generateCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// AUTH ENDPOINTS
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
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
      existing.password = password;
      existing.firstName = firstName.trim();
      existing.lastName = lastName.trim();
      existing.phone = phone ? phone.trim() : '';
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
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone ? phone.trim() : '',
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
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone },
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
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone },
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
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone },
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

app.post('/api/auth/update-profile', (req, res) => {
  const { email, currentPassword, firstName, lastName, phone, newEmail, avatarUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  // If changing email, require password check
  if (newEmail && newEmail.trim().toLowerCase() !== cleanEmail) {
    if (!currentPassword || user.password !== currentPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta para cambiar de correo.' });
    }
    const targetEmail = newEmail.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === targetEmail);
    if (existing) {
      return res.status(400).json({ error: 'El nuevo correo electrónico ya está registrado en otra cuenta.' });
    }
    user.email = targetEmail;
  } else if (currentPassword) {
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
    }
  }

  if (firstName !== undefined) user.firstName = firstName.trim();
  if (lastName !== undefined) user.lastName = lastName.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  res.json({
    success: true,
    message: 'Perfil actualizado correctamente.',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    }
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== currentPassword) {
    return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta.' });
  }

  user.password = newPassword;
  res.json({ success: true, message: 'Tu contraseña ha sido actualizada con éxito.' });
});

// API ENDPOINTS

// 0. Groups / Complexes
app.get('/api/groups', (req, res) => {
  const store = getStoreForReq(req);
  const propGroups = store.properties.map(p => p.group);
  const all = Array.from(new Set([...store.customGroups, ...propGroups]));
  res.json(all);
});

app.post('/api/groups', (req, res) => {
  const store = getStoreForReq(req);
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nombre de complejo requerido' });
  }
  const clean = name.trim();
  if (!store.customGroups.includes(clean)) {
    store.customGroups.push(clean);
  }
  res.status(201).json({ success: true, name: clean });
});

app.put('/api/groups/:oldName', (req, res) => {
  const store = getStoreForReq(req);
  const oldName = decodeURIComponent(req.params.oldName);
  const { newName } = req.body;
  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: 'Nuevo nombre requerido' });
  }
  const cleanNew = newName.trim();

  const idx = store.customGroups.indexOf(oldName);
  if (idx !== -1) store.customGroups[idx] = cleanNew;
  else store.customGroups.push(cleanNew);

  store.properties.forEach(p => { if (p.group === oldName) p.group = cleanNew; });
  store.reservations.forEach(r => { if (r.propertyGroup === oldName) r.propertyGroup = cleanNew; });
  store.cleaningTasks.forEach(t => { if (t.propertyGroup === oldName) t.propertyGroup = cleanNew; });

  res.json({ success: true, oldName, newName: cleanNew });
});

app.delete('/api/groups/:name', (req, res) => {
  const store = getStoreForReq(req);
  const name = decodeURIComponent(req.params.name);
  store.customGroups = store.customGroups.filter(g => g !== name);

  store.properties.forEach(p => { if (p.group === name) p.group = 'Unidades Individuales'; });
  store.reservations.forEach(r => { if (r.propertyGroup === name) r.propertyGroup = 'Unidades Individuales'; });
  store.cleaningTasks.forEach(t => { if (t.propertyGroup === name) t.propertyGroup = 'Unidades Individuales'; });

  res.json({ success: true, message: 'Complejo eliminado' });
});

// 1. Stats
app.get('/api/stats', (req, res) => {
  const store = getStoreForReq(req);
  const activeBookings = store.reservations.filter(r => r.status === 'active').length;
  const checkOutsToday = store.reservations.filter(r => r.checkOut === todayStr && r.status === 'active').length;
  const checkInsToday = store.reservations.filter(r => r.checkIn === todayStr && r.status === 'active').length;
  const pendingCleaningCount = store.cleaningTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  const totalRevenue = store.reservations.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
  const totalCleaningExpenses = store.reservations.reduce((acc, r) => acc + (r.cleaningCost || 0), 0);
  const netIncome = totalRevenue - totalCleaningExpenses;

  const stats: DashboardStats = {
    activeBookings,
    checkOutsToday,
    checkInsToday,
    pendingCleaningCount,
    totalRevenue,
    totalCleaningExpenses,
    netIncome,
    occupancyRatePercentage: store.properties.length > 0 ? Math.min(100, Math.round((activeBookings / store.properties.length) * 100)) : 0
  };

  res.json(stats);
});

// 2. Properties
app.get('/api/properties', (req, res) => {
  res.json(getStoreForReq(req).properties);
});

app.post('/api/properties', (req, res) => {
  const store = getStoreForReq(req);
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

  store.properties.unshift(newProp);
  res.status(201).json(newProp);
});

app.put('/api/properties/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  const index = store.properties.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Propiedad no encontrada' });
  }

  store.properties[index] = {
    ...store.properties[index],
    ...req.body,
    cleaningCost: req.body.cleaningCost !== undefined ? Number(req.body.cleaningCost) : store.properties[index].cleaningCost,
    nightlyRateDefault: req.body.nightlyRateDefault !== undefined ? Number(req.body.nightlyRateDefault) : store.properties[index].nightlyRateDefault
  };

  res.json(store.properties[index]);
});

app.delete('/api/properties/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  store.properties = store.properties.filter(p => p.id !== id);
  res.json({ success: true, message: 'Propiedad eliminada' });
});

// 3. Reservations
app.get('/api/reservations', (req, res) => {
  res.json(getStoreForReq(req).reservations);
});

app.post('/api/reservations', (req, res) => {
  const store = getStoreForReq(req);
  const prop = store.properties.find(p => p.id === req.body.propertyId);
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

  store.reservations.unshift(newRes);

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
    store.cleaningTasks.unshift(cleaningTask);
  }

  res.status(201).json(newRes);
});

app.put('/api/reservations/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  const index = store.reservations.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const updatedTotal = req.body.totalPaid !== undefined ? Number(req.body.totalPaid) : store.reservations[index].totalPaid;
  const updatedCleaning = req.body.cleaningCost !== undefined ? Number(req.body.cleaningCost) : store.reservations[index].cleaningCost;

  store.reservations[index] = {
    ...store.reservations[index],
    ...req.body,
    totalPaid: updatedTotal,
    cleaningCost: updatedCleaning,
    netAmount: updatedTotal - updatedCleaning
  };

  res.json(store.reservations[index]);
});

app.delete('/api/reservations/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  store.reservations = store.reservations.filter(r => r.id !== id);
  res.json({ success: true, message: 'Reserva eliminada' });
});

// 4. Cleaning Tasks
app.get('/api/cleaning-tasks', (req, res) => {
  res.json(getStoreForReq(req).cleaningTasks);
});

app.post('/api/cleaning-tasks', (req, res) => {
  const store = getStoreForReq(req);
  const prop = store.properties.find(p => p.id === req.body.propertyId);
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

  store.cleaningTasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.put('/api/cleaning-tasks/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  const index = store.cleaningTasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tarea de limpieza no encontrada' });
  }

  store.cleaningTasks[index] = {
    ...store.cleaningTasks[index],
    ...req.body,
    completedAt: req.body.status === 'completed' || req.body.status === 'verified' 
      ? (store.cleaningTasks[index].completedAt || new Date().toISOString()) 
      : undefined
  };

  res.json(store.cleaningTasks[index]);
});

app.delete('/api/cleaning-tasks/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  store.cleaningTasks = store.cleaningTasks.filter(t => t.id !== id);
  res.json({ success: true, message: 'Tarea de limpieza eliminada' });
});

// 5. Owners
app.get('/api/owners', (req, res) => {
  res.json(getStoreForReq(req).owners);
});

app.post('/api/owners', (req, res) => {
  const store = getStoreForReq(req);
  const newOwner: Owner = {
    id: `owner-${Date.now()}`,
    name: req.body.name,
    email: req.body.email || '',
    phone: req.body.phone || '',
    commissionRate: Number(req.body.commissionRate) || 15,
    payoutMethod: req.body.payoutMethod || '',
    accountNumber: req.body.accountNumber || ''
  };
  store.owners.unshift(newOwner);
  res.status(201).json(newOwner);
});

app.put('/api/owners/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  const index = store.owners.findIndex(o => o.id === id);
  if (index !== -1) {
    store.owners[index] = {
      ...store.owners[index],
      name: req.body.name ?? store.owners[index].name,
      email: req.body.email ?? store.owners[index].email,
      phone: req.body.phone ?? store.owners[index].phone,
      commissionRate: req.body.commissionRate !== undefined ? Number(req.body.commissionRate) : store.owners[index].commissionRate,
      payoutMethod: req.body.payoutMethod ?? store.owners[index].payoutMethod,
      accountNumber: req.body.accountNumber ?? store.owners[index].accountNumber
    };
    
    // Propagate updated owner details to properties
    if (req.body.name) {
      store.properties.forEach(p => {
        if (p.ownerId === id) {
          p.ownerName = req.body.name;
          if (req.body.email) p.ownerEmail = req.body.email;
          if (req.body.phone) p.ownerPhone = req.body.phone;
        }
      });
    }

    return res.json(store.owners[index]);
  }
  return res.status(404).json({ error: 'Propietario no encontrado' });
});

app.delete('/api/owners/:id', (req, res) => {
  const store = getStoreForReq(req);
  const { id } = req.params;
  store.owners = store.owners.filter(o => o.id !== id);
  res.json({ success: true, message: 'Propietario eliminado' });
});

// 6. iCal Sync Service
app.get('/api/ical/sample/:propId', (req, res) => {
  const store = getStoreForReq(req);
  const prop = store.properties.find(p => p.id === req.params.propId) || store.properties[0] || { name: 'Propiedad', platformDefault: 'Airbnb' };
  const ics = generateSampleICalFeed(prop.name, prop.platformDefault);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${prop.name.replace(/[^a-z0-9]/gi, '_')}.ics"`);
  res.send(ics);
});

// Sync single property iCal
app.post('/api/ical/sync', async (req, res) => {
  const store = getStoreForReq(req);
  const { propertyId, icsContent, url } = req.body;
  const prop = store.properties.find(p => p.id === propertyId);

  if (!prop) {
    return res.status(404).json({ error: 'Propiedad no encontrada' });
  }

  // Update property icalUrl if custom url provided
  if (url && url !== `/api/ical/sample/${propertyId}`) {
    prop.icalUrl = url;
  }

  try {
    let rawIcs = icsContent;
    const targetUrl = url || prop.icalUrl;

    if (!rawIcs && targetUrl) {
      if (targetUrl.includes('/api/ical/sample/')) {
        rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
      } else {
        try {
          const fetchRes = await fetch(targetUrl);
          if (fetchRes.ok) {
            rawIcs = await fetchRes.text();
          } else {
            return res.status(400).json({ error: 'No se pudo obtener el archivo iCal desde la URL proporcionada. Verifique el enlace.' });
          }
        } catch {
          return res.status(400).json({ error: 'Error de red al conectar con el servidor iCal. Verifique la URL de iCal.' });
        }
      }
    }

    if (!rawIcs) {
      const log: SyncLog = {
        id: `log-${Date.now()}`,
        propertyId: prop.id,
        propertyName: prop.name,
        syncedAt: new Date().toISOString(),
        status: 'success',
        reservationsFound: 0,
        reservationsCreated: 0,
        reservationsUpdated: 0,
        message: 'No hay URL iCal configurada para esta propiedad.'
      };
      store.syncLogs.unshift(log);
      return res.json({
        success: true,
        log,
        createdCount: 0,
        events: []
      });
    }

    const events = parseICalString(rawIcs);
    let createdCount = 0;
    let updatedCount = 0;
    const currentTodayStr = getTodayStr();

    for (const event of events) {
      // Ensure we include reservations from current date/month onwards (checkOut >= todayStr)
      if (event.checkOut < currentTodayStr) {
        continue;
      }

      // Strict deduplication by externalId UID or exact property + checkIn + checkOut
      const existing = store.reservations.find(r => 
        (r.externalId && r.externalId === event.uid) ||
        (r.propertyId === prop.id && r.checkIn === event.checkIn && r.checkOut === event.checkOut)
      );

      if (!existing) {
        const dIn = new Date(event.checkIn);
        const dOut = new Date(event.checkOut);
        const diffDays = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));
        const nightlyRate = prop.nightlyRateDefault || 120;
        const totalPaid = (event.price && event.price > 0) ? event.price : (diffDays * nightlyRate);

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

        store.reservations.unshift(newRes);
        createdCount++;

        const existingCleaning = store.cleaningTasks.find(t => t.reservationId === newRes.id || (t.propertyId === prop.id && t.scheduledDate === newRes.checkOut));
        if (!existingCleaning) {
          store.cleaningTasks.unshift({
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
      message: `Sincronización exitosa: ${createdCount} reservas nuevas cargadas (${events.length} eventos en calendario).`
    };

    store.syncLogs.unshift(log);

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
  const store = getStoreForReq(req);
  let totalCreated = 0;
  const logs: SyncLog[] = [];
  const currentTodayStr = getTodayStr();

  for (const prop of store.properties) {
    let rawIcs = '';
    const targetUrl = prop.icalUrl;

    if (targetUrl && targetUrl.trim()) {
      if (targetUrl.includes('/api/ical/sample/')) {
        rawIcs = generateSampleICalFeed(prop.name, prop.platformDefault);
      } else {
        try {
          const fetchRes = await fetch(targetUrl);
          if (fetchRes.ok) {
            rawIcs = await fetchRes.text();
          }
        } catch {
          // Skip if fetch fails during mass sync
        }
      }
    }

    if (!rawIcs) {
      logs.push({
        id: `log-${Date.now()}-${prop.id}`,
        propertyId: prop.id,
        propertyName: prop.name,
        syncedAt: new Date().toISOString(),
        status: 'success',
        reservationsFound: 0,
        reservationsCreated: 0,
        reservationsUpdated: 0,
        message: `Sin enlace iCal activo para ${prop.name}.`
      });
      continue;
    }

    const events = parseICalString(rawIcs);
    let created = 0;
    let updated = 0;

    for (const event of events) {
      if (event.checkOut < currentTodayStr) {
        continue;
      }

      const existing = store.reservations.find(r => 
        (r.externalId && r.externalId === event.uid) ||
        (r.propertyId === prop.id && r.checkIn === event.checkIn && r.checkOut === event.checkOut)
      );

      if (!existing) {
        const dIn = new Date(event.checkIn);
        const dOut = new Date(event.checkOut);
        const diffDays = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));
        const nightlyRate = prop.nightlyRateDefault || 120;
        const totalPaid = (event.price && event.price > 0) ? event.price : (diffDays * nightlyRate);

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
          notes: event.description || `Sincronización masiva iCal`,
          payoutStatus: 'pending',
          createdVia: 'ical',
          syncedAt: new Date().toISOString()
        };

        store.reservations.unshift(newRes);
        created++;
        totalCreated++;

        const existingCleaning = store.cleaningTasks.find(t => t.reservationId === newRes.id || (t.propertyId === prop.id && t.scheduledDate === newRes.checkOut));
        if (!existingCleaning) {
          store.cleaningTasks.unshift({
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
        updated++;
      }
    }

    const log: SyncLog = {
      id: `log-${Date.now()}-${prop.id}`,
      propertyId: prop.id,
      propertyName: prop.name,
      syncedAt: new Date().toISOString(),
      status: 'success',
      reservationsFound: events.length,
      reservationsCreated: created,
      reservationsUpdated: updated,
      message: `${prop.name}: ${created} creadas, ${updated} omitidas/existentes.`
    };
    logs.push(log);
    store.syncLogs.unshift(log);
  }

  res.json({
    success: true,
    totalCreated,
    logs,
    message: `Sincronización masiva completada: ${totalCreated} reservas nuevas importadas.`
  });
});

// Seed / Reset data
app.post('/api/seed/load', (req, res) => {
  const emailHeader = (req.headers['x-user-email'] as string) || (req.query?.userEmail as string) || '';
  const key = emailHeader.trim().toLowerCase() || 'default';
  const sampleStore = createInitialSampleStore();
  userStores.set(key, sampleStore);
  res.json({ success: true, message: 'Datos de prueba cargados con éxito' });
});

app.post('/api/seed/reset', (req, res) => {
  const store = getStoreForReq(req);
  store.owners = [];
  store.properties = [];
  store.reservations = [];
  store.cleaningTasks = [];
  store.customGroups = ['Unidades Individuales'];
  store.syncLogs = [];
  res.json({ success: true, message: 'Datos borrados con éxito' });
});

// PWA Static Assets routes with proper MIME types
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
});

app.get('/icon.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(path.join(process.cwd(), 'public', 'icon.svg'));
});

app.get('/icon-192.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.join(process.cwd(), 'public', 'icon-192.png'));
});

app.get('/icon-512.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.join(process.cwd(), 'public', 'icon-512.png'));
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
