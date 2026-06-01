/** Service patients. RBAC appliqué côté serveur (l'app ne le contourne pas). */
import { apiRequest } from '@/services/api/client';
import type { PatientPublic } from '@/types/api';

/** Clinicien/admin : liste de la cohorte. */
export async function listPatients(): Promise<PatientPublic[]> {
  return apiRequest<PatientPublic[]>('/patients');
}

/** Patient : son propre dossier. */
export async function getMyPatient(): Promise<PatientPublic> {
  return apiRequest<PatientPublic>('/patients/me');
}

/** Lecture d'un dossier patient (clinicien/admin → tout ; patient → le sien). */
export async function getPatient(id: string): Promise<PatientPublic> {
  return apiRequest<PatientPublic>(`/patients/${id}`);
}
