// ============================================================================
// AUTHENTICATION SERVICE — IEC 62304 Classe C / ISO 27001
// Système d'authentification sécurisé avec hachage PBKDF2 et RBAC
// ============================================================================

export type UserRole = 'patient' | 'clinician';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  specialty?: string; // Pour cliniciens (RPPS)
  createdAt: number;
  lastLogin: number;
  isActive: boolean;
}

export interface Session {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt: number;
  createdAt: number;
}

const USERS_KEY = 'mediai_users_v2';
const SESSION_KEY = 'mediai_session_v2';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 heures

// ============================================================================
// CRYPTOGRAPHIE — Web Crypto API (PBKDF2-SHA256)
// ============================================================================

async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// STOCKAGE SÉCURISÉ
// ============================================================================

function getUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    const session: Session = JSON.parse(stored);
    
    // Vérifier expiration
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// ============================================================================
// INITIALISATION — Comptes de démonstration
// ============================================================================

async function initializeDemoAccounts(): Promise<void> {
  const users = getUsers();
  
  if (users.length > 0) return; // Déjà initialisé
  
  const demoAccounts = [
    {
      email: 'patient@demo.fr',
      password: 'Demo1234!',
      name: 'Alexandre Petit',
      role: 'patient' as UserRole,
    },
    {
      email: 'clinicien@demo.fr',
      password: 'Demo1234!',
      name: 'Dr. Sarah Martin',
      role: 'clinician' as UserRole,
      specialty: 'Endocrinologie / RPPS 10100567890',
    },
  ];

  for (const account of demoAccounts) {
    const salt = await generateSalt();
    const passwordHash = await hashPassword(account.password, salt);
    
    users.push({
      id: generateId(),
      email: account.email,
      name: account.name,
      role: account.role,
      passwordHash,
      salt,
      specialty: account.specialty,
      createdAt: Date.now(),
      lastLogin: 0,
      isActive: true,
    });
  }
  
  saveUsers(users);
}

// Auto-initialisation
initializeDemoAccounts().catch(console.error);

// ============================================================================
// API PUBLIQUE
// ============================================================================

export const authService = {
  // Inscription
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    specialty?: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    // Validation
    if (!email || !password || !name) {
      return { success: false, error: 'Tous les champs sont requis' };
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Email invalide' };
    }
    
    if (password.length < 8) {
      return { success: false, error: 'Mot de passe : 8 caractères minimum' };
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { success: false, error: 'Mot de passe : majuscule, minuscule et chiffre requis' };
    }
    
    const users = getUsers();
    
    // Vérifier unicité email
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }
    
    // Pour cliniciens, vérifier RPPS
    if (role === 'clinician' && !specialty) {
      return { success: false, error: 'Spécialité et RPPS requis pour les cliniciens' };
    }
    
    // Créer utilisateur
    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);
    
    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      role,
      passwordHash,
      salt,
      specialty,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isActive: true,
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Créer session
    const session = await this.createSession(newUser);
    saveSession(session);
    
    // Retourner sans données sensibles
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return { success: true, user: safeUser as User };
  },

  // Connexion
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User; session?: Session }> {
    if (!email || !password) {
      return { success: false, error: 'Email et mot de passe requis' };
    }
    
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Délai artificiel pour éviter l'énumération
      await new Promise(r => setTimeout(r, 800));
      return { success: false, error: 'Identifiants invalides' };
    }
    
    if (!user.isActive) {
      return { success: false, error: 'Compte désactivé. Contactez l\'administrateur.' };
    }
    
    const passwordHash = await hashPassword(password, user.salt);
    
    if (passwordHash !== user.passwordHash) {
      await new Promise(r => setTimeout(r, 800));
      return { success: false, error: 'Identifiants invalides' };
    }
    
    // Mettre à jour lastLogin
    user.lastLogin = Date.now();
    saveUsers(users);
    
    // Créer session
    const session = await this.createSession(user);
    saveSession(session);
    
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { success: true, user: safeUser as User, session };
  },

  // Créer session
  async createSession(user: User): Promise<Session> {
    return {
      token: generateToken(),
      userId: user.id,
      role: user.role,
      expiresAt: Date.now() + SESSION_DURATION,
      createdAt: Date.now(),
    };
  },

  // Vérifier session active
  getCurrentUser(): User | null {
    const session = getSession();
    if (!session) return null;
    
    const users = getUsers();
    const user = users.find(u => u.id === session.userId);
    
    if (!user || !user.isActive) {
      this.logout();
      return null;
    }
    
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return safeUser as User;
  },

  getCurrentSession(): Session | null {
    return getSession();
  },

  // Déconnexion
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  // Vérifier permissions
  canAccess(userRole: UserRole, view: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      patient: ['patient', 'devices'],
      clinician: ['doctor', 'devices', 'audit'],
    };
    
    return permissions[userRole]?.includes(view) ?? false;
  },

  // Obtenir tous les utilisateurs (admin uniquement - pour démo)
  getAllUsers(): Omit<User, 'passwordHash' | 'salt'>[] {
    return getUsers().map(({ passwordHash, salt, ...rest }) => rest);
  },
};