export function formatRupiah(value: number): string {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(value));
}

export function formatPercent(value: number, digits = 2): string {
    return (
        new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value) + '%'
    );
}
