import { Head, router } from '@inertiajs/react';
import { Ban, Plus, RotateCcw, UserCog } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { FxIconButton } from '@/components/fx/fx-icon-button';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';

type UserRole = 'owner' | 'staff';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    is_self: boolean;
    created_at: string | null;
};

type Props = { users: UserRow[] };

const roleConfig: Record<UserRole, { label: string; cls: string }> = {
    owner: { label: 'Owner', cls: 'bg-coral-soft text-primary' },
    staff: { label: 'Staff', cls: 'bg-secondary text-muted-foreground' },
};

const fmtDate = (value: string | null): string =>
    value === null
        ? '-'
        : new Date(value).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          });

export default function Pengguna({ users }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);

    const activeCount = users.filter((u) => u.is_active).length;

    function handleCreate(data: {
        name: string;
        email: string;
        role: UserRole;
        password: string;
    }) {
        router.post('/pengguna', data, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                toast.success('Pengguna ditambahkan', {
                    description: `${data.name} (${data.role}) dibuat. Bagikan password secara langsung.`,
                });
            },
            onError: (errors) =>
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal menyimpan pengguna.',
                ),
        });
    }

    function handleRole(user: UserRow, role: UserRole) {
        router.put(
            `/pengguna/${user.id}`,
            { role },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRoleTarget(null);
                    toast.success('Peran diperbarui', {
                        description: `${user.name} kini berperan sebagai ${role === 'owner' ? 'Owner' : 'Staff'}.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal mengubah peran.',
                    ),
            },
        );
    }

    function handleDeactivate(user: UserRow) {
        router.delete(`/pengguna/${user.id}`, {
            preserveScroll: true,
            onSuccess: () =>
                toast.success('Pengguna dinonaktifkan', {
                    description: `${user.name} tidak bisa login lagi. Riwayat penjualannya tetap tersimpan.`,
                }),
            onError: (errors) =>
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal menonaktifkan pengguna.',
                ),
        });
    }

    function handleRestore(user: UserRow) {
        router.post(
            `/pengguna/${user.id}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Pengguna diaktifkan kembali', {
                        description: `${user.name} bisa login lagi.`,
                    }),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal mengaktifkan pengguna.',
                    ),
            },
        );
    }

    return (
        <PageShell
            title="Pengguna"
            description="Kelola akun tim dalam satu lingkungan UMKM: beberapa owner dan banyak staff berbagi data yang sama."
            actions={
                <FxButton
                    variant="coral"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="size-4" />
                    Tambah pengguna
                </FxButton>
            }
        >
            <Reveal delay={0.05}>
                    <FxSoft className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
                        <span className="text-muted-foreground">
                            <span className="font-bold text-foreground">
                                {activeCount}
                            </span>{' '}
                            akun aktif
                        </span>
                        <span className="text-muted-foreground">
                            <span className="font-bold text-foreground">
                                {users.filter((u) => u.role === 'owner').length}
                            </span>{' '}
                            owner
                        </span>
                        <span className="text-muted-foreground">
                            <span className="font-bold text-foreground">
                                {users.filter((u) => u.role === 'staff').length}
                            </span>{' '}
                            staff
                        </span>
                    </FxSoft>
                </Reveal>

                <Reveal delay={0.1}>
                    <FxCard className="flex flex-col gap-4 p-5">
                        <h2 className="text-base font-semibold">Daftar akun</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                            Pengguna
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            Peran
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            Status
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            Bergabung
                                        </th>
                                        <th className="rounded-r-xl px-3 py-2.5 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                <p className="flex items-center gap-2 font-medium">
                                                    {u.name}
                                                    {u.is_self ? (
                                                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                            Anda
                                                        </span>
                                                    ) : null}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {u.email}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleConfig[u.role].cls}`}
                                                >
                                                    {roleConfig[u.role].label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                                                        <span className="size-1.5 rounded-full bg-success" />
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                                        <span className="size-1.5 rounded-full bg-muted-foreground" />
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-muted-foreground tabular-nums">
                                                {fmtDate(u.created_at)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {u.is_self ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            Kelola lewat
                                                            Pengaturan
                                                        </span>
                                                    ) : u.is_active ? (
                                                        <>
                                                            <FxIconButton
                                                                title="Ubah peran"
                                                                aria-label="Ubah peran"
                                                                onClick={() =>
                                                                    setRoleTarget(
                                                                        u,
                                                                    )
                                                                }
                                                            >
                                                                <UserCog className="size-4" />
                                                            </FxIconButton>
                                                            <FxIconButton
                                                                tone="danger"
                                                                title="Nonaktifkan akun"
                                                                aria-label="Nonaktifkan akun"
                                                                onClick={() =>
                                                                    handleDeactivate(
                                                                        u,
                                                                    )
                                                                }
                                                            >
                                                                <Ban className="size-4" />
                                                            </FxIconButton>
                                                        </>
                                                    ) : (
                                                        <FxIconButton
                                                            title="Aktifkan kembali"
                                                            aria-label="Aktifkan kembali"
                                                            onClick={() =>
                                                                handleRestore(u)
                                                            }
                                                        >
                                                            <RotateCcw className="size-4" />
                                                        </FxIconButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FxCard>
                </Reveal>

            <CreateUserModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />

            {roleTarget ? (
                <EditRoleModal
                    user={roleTarget}
                    onClose={() => setRoleTarget(null)}
                    onSave={(role) => handleRole(roleTarget, role)}
                />
            ) : null}
        </PageShell>
    );
}

function CreateUserModal({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        name: string;
        email: string;
        role: UserRole;
        password: string;
    }) => void;
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('staff');
    const [password, setPassword] = useState('');

    function submit() {
        if (!name.trim()) {
            toast.error('Nama wajib diisi.');
            return;
        }
        if (!email.trim()) {
            toast.error('Email wajib diisi.');
            return;
        }
        if (password.length < 8) {
            toast.error('Password minimal 8 karakter.');
            return;
        }
        onSubmit({
            name: name.trim(),
            email: email.trim(),
            role,
            password,
        });
    }

    return (
        <FxModal
            open={open}
            onOpenChange={onOpenChange}
            title="Tambah pengguna"
            description="Akun langsung aktif dan terverifikasi karena dibuat oleh owner."
            footer={
                <>
                    <FxButton
                        variant="soft"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Simpan pengguna
                    </FxButton>
                </>
            }
        >
            <FxField label="Nama">
                <FxInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dimas (Dapur)"
                />
            </FxField>
            <FxField label="Email">
                <FxInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@usaha.com"
                />
            </FxField>
            <FxField
                label="Peran"
                hint="Owner mengakses kas, margin, dan restock. Staff hanya POS, baca bahan/menu, dan waste."
            >
                <FxSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                >
                    <option value="staff">Staff</option>
                    <option value="owner">Owner</option>
                </FxSelect>
            </FxField>
            <FxField
                label="Password awal"
                hint="Minimal 8 karakter. Bagikan secara langsung; pengguna dapat menggantinya di Pengaturan."
            >
                <FxInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </FxField>
        </FxModal>
    );
}

function EditRoleModal({
    user,
    onClose,
    onSave,
}: {
    user: UserRow;
    onClose: () => void;
    onSave: (role: UserRole) => void;
}) {
    const [role, setRole] = useState<UserRole>(user.role);

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Peran ${user.name}`}
            description="Owner mengelola kas, margin, harga, dan restock. Staff berfokus pada POS."
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={() => onSave(role)}>
                        Simpan peran
                    </FxButton>
                </>
            }
        >
            <FxField label="Peran">
                <FxSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                >
                    <option value="staff">Staff</option>
                    <option value="owner">Owner</option>
                </FxSelect>
            </FxField>
        </FxModal>
    );
}
