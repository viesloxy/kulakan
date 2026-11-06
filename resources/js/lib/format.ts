export function formatRupiah(value: number | string): string {
    return (
        'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(value)))
    );
}

export function formatPercent(value: number | string, digits = 2): string {
    return (
        new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(Number(value)) + '%'
    );
}
