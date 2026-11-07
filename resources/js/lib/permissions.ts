import type { User } from '@/types/auth';

/**
 * Gating tampilan berdasarkan role (FR-002, matriks SAD §9).
 * Otorisasi sesungguhnya tetap ditegakkan server (middleware role); helper ini hanya
 * menyembunyikan aksi yang pasti 403 agar staff tidak melihat tombol yang bukan haknya (NFR-008).
 */
export function isOwner(user: User | null | undefined): boolean {
    return user?.role === 'owner';
}
