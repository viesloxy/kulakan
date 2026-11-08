import { Form, Link } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface DeleteUserProps {
    isSoleOwner?: boolean;
}

export default function DeleteUser({ isSoleOwner = false }: DeleteUserProps) {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Hapus akun"
                description="Hapus akun Anda dan seluruh akses sistem terkait"
            />
            {isSoleOwner ? (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-1">
                            <p className="font-semibold text-sm">
                                Akun Pemilik Utama Terkunci
                            </p>
                            <p className="text-sm text-amber-800/90 dark:text-amber-300/80">
                                Anda adalah satu-satunya Pemilik (Owner) aktif di sistem DapurCerdas. Demi menjaga kelangsungan operasional dan mencegah sistem terkunci permanen, akun ini tidak dapat dihapus sebelum Anda menunjuk akun Pemilik lain di menu Kelola Pengguna.
                            </p>
                            <div className="pt-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/pengguna">Buka Kelola Pengguna</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                    <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                        <p className="font-medium">Perhatian</p>
                        <p className="text-sm">
                            Harap berhati-hati, tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                data-test="delete-user-button"
                            >
                                Hapus akun
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>
                                Apakah Anda yakin ingin menghapus akun?
                            </DialogTitle>
                            <DialogDescription>
                                Setelah akun Anda dinonaktifkan, Anda tidak akan dapat masuk kembali ke sistem. Masukkan password Anda untuk mengonfirmasi penonaktifan akun.
                            </DialogDescription>

                            <Form
                                {...ProfileController.destroy.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                onError={() => passwordInput.current?.focus()}
                                resetOnSuccess
                                className="space-y-6"
                            >
                                {({ resetAndClearErrors, processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="password"
                                                className="sr-only"
                                            >
                                                Password
                                            </Label>

                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                ref={passwordInput}
                                                placeholder="Password Anda"
                                                autoComplete="current-password"
                                            />

                                            <InputError message={errors.password} />
                                        </div>

                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        resetAndClearErrors()
                                                    }
                                                >
                                                    Batal
                                                </Button>
                                            </DialogClose>

                                            <Button
                                                variant="destructive"
                                                disabled={processing}
                                                asChild
                                            >
                                                <button
                                                    type="submit"
                                                    data-test="confirm-delete-user-button"
                                                >
                                                    Hapus akun
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
