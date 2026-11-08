<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Struk #{{ $order->order_number }} - Kulakan</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #f1f3f5;
            color: #000;
            line-height: 1.3;
            -webkit-font-smoothing: antialiased;
        }

        /* Top control bar (layar saja, disembunyikan saat cetak) */
        .no-print-bar {
            position: sticky;
            top: 0;
            z-index: 50;
            background: #1e1e1e;
            color: #fff;
            padding: 10px 16px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
        }

        .bar-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .bar-title {
            font-weight: 700;
            letter-spacing: -0.01em;
        }

        .bar-badge {
            background: rgba(255,255,255,0.15);
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
        }

        .bar-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .size-btn-group {
            display: inline-flex;
            background: #333;
            border-radius: 8px;
            padding: 2px;
            border: 1px solid #444;
        }

        .size-btn {
            background: transparent;
            border: none;
            color: #aaa;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .size-btn.active {
            background: #ec582a;
            color: #fff;
        }

        .btn-print {
            background: #ec582a;
            color: #fff;
            border: none;
            padding: 6px 14px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            transition: background 0.15s;
        }

        .btn-print:hover {
            background: #d6471c;
        }

        .btn-close {
            background: rgba(255,255,255,0.12);
            color: #eee;
            border: none;
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.15s;
        }

        .btn-close:hover {
            background: rgba(255,255,255,0.22);
        }

        /* Screen Wrapper */
        .receipt-screen-wrapper {
            padding: 30px 16px;
            display: flex;
            justify-content: center;
            min-height: calc(100vh - 54px);
        }

        /* Receipt Paper Container */
        .receipt-paper {
            background: #ffffff;
            color: #000000;
            padding: 6mm 4mm;
            border: 1px solid #ddd;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
            width: 100%;
            transition: max-width 0.2s ease;
        }

        /* Mode 58mm (default kasir thermal) */
        .receipt-paper.mode-58mm {
            max-width: 58mm;
            font-size: 11px;
        }

        /* Mode 80mm (lebar) */
        .receipt-paper.mode-80mm {
            max-width: 80mm;
            font-size: 12px;
        }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        .store-name {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .store-sub {
            font-size: 10px;
            margin-bottom: 2px;
        }

        .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
            width: 100%;
        }

        .divider-double {
            border-top: 2px dashed #000;
            margin: 6px 0;
            width: 100%;
        }

        .meta-table {
            width: 100%;
            font-size: 10px;
            line-height: 1.35;
        }

        .meta-table td {
            padding: 1px 0;
            vertical-align: top;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin: 3px 0;
        }

        .items-table td {
            padding: 2px 0;
            vertical-align: top;
        }

        .item-name {
            font-weight: bold;
            word-break: break-word;
        }

        .item-math {
            font-size: 10px;
            padding-left: 6px;
        }

        .summary-table {
            width: 100%;
            font-size: 11px;
            line-height: 1.4;
        }

        .summary-table td {
            padding: 1.5px 0;
        }

        .total-row {
            font-size: 13px;
            font-weight: bold;
        }

        .void-banner {
            border: 2px solid #000;
            padding: 4px;
            margin: 6px 0;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            letter-spacing: 0.5px;
        }

        .footer-text {
            font-size: 9.5px;
            line-height: 1.35;
            text-align: center;
            margin-top: 8px;
        }

        .owner-insight {
            margin-top: 8px;
            padding: 5px;
            border: 1px dotted #666;
            font-size: 9.5px;
            background: #fafafa;
        }

        /* PRINT MEDIA STYLES */
        @page {
            size: auto;
            margin: 0mm;
        }

        @media print {
            body {
                background: #fff !important;
                color: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .no-print-bar {
                display: none !important;
            }

            .receipt-screen-wrapper {
                padding: 0 !important;
                min-height: auto !important;
                display: block !important;
            }

            .receipt-paper {
                box-shadow: none !important;
                border: none !important;
                margin: 0 auto !important;
                padding: 2mm 2.5mm !important;
            }

            .receipt-paper.mode-58mm {
                max-width: 54mm !important;
                width: 100% !important;
                font-size: 11px !important;
            }

            .receipt-paper.mode-80mm {
                max-width: 76mm !important;
                width: 100% !important;
                font-size: 12px !important;
            }

            .owner-insight.hide-on-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    <!-- Bar Kontrol Navigasi (Hanya di Layar) -->
    <div class="no-print-bar">
        <div class="bar-left">
            <span class="bar-title">Struk: {{ $order->order_number }}</span>
            <span class="bar-badge">{{ strtoupper($order->status) }}</span>
        </div>
        <div class="bar-right">
            <!-- Pilihan Ukuran Kertas Thermal -->
            <span style="color: #aaa; font-size: 11px;">Ukuran:</span>
            <div class="size-btn-group">
                <button type="button" class="size-btn active" id="btn-58mm" onclick="setPaperMode('58mm')">58mm</button>
                <button type="button" class="size-btn" id="btn-80mm" onclick="setPaperMode('80mm')">80mm</button>
            </div>

            @if ($isOwner)
                <label style="color: #bbb; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                    <input type="checkbox" id="check-print-margin" onchange="togglePrintMargin(this.checked)">
                    Cetak Margin
                </label>
            @endif

            <button type="button" class="btn-print" onclick="window.print()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Cetak Sekarang
            </button>

            <button type="button" class="btn-close" onclick="window.close()">Tutup Tab</button>
        </div>
    </div>

    <!-- Kontainer Tampilan Kertas Struk -->
    <div class="receipt-screen-wrapper">
        <div class="receipt-paper mode-58mm" id="receiptPaper">
            <!-- Header Kedai -->
            <div class="text-center">
                <div class="store-name">KULAKAN</div>
                <div class="store-sub">Smart Profit &amp; Inventory F&amp;B</div>
                <div class="store-sub">Bukti Transaksi Resmi</div>
            </div>

            <div class="divider"></div>

            <!-- Metadata Pesanan -->
            <table class="meta-table">
                <tr>
                    <td class="text-left">No. Pesanan</td>
                    <td class="text-right font-bold">{{ $order->order_number }}</td>
                </tr>
                <tr>
                    <td class="text-left">Tanggal</td>
                    <td class="text-right">{{ $order->created_at?->format('d/m/Y H:i') ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="text-left">Kasir</td>
                    <td class="text-right">{{ $order->user->name ?? 'Kasir' }}</td>
                </tr>
                <tr>
                    <td class="text-left">Metode</td>
                    <td class="text-right font-bold">{{ $order->payment_method === 'cash' ? 'TUNAI' : 'QRIS' }}</td>
                </tr>
            </table>

            @if ($order->status === 'void')
                <div class="void-banner">
                    *** TRANSAKSI VOID / BATAL ***
                </div>
            @endif

            <div class="divider"></div>

            <!-- Daftar Item Menu -->
            <table class="items-table">
                @foreach ($items as $item)
                    <tr>
                        <td colspan="2" class="item-name">{{ $item->menu->name ?? 'Menu' }}</td>
                    </tr>
                    <tr>
                        <td class="item-math">
                            {{ $item->quantity }} x Rp {{ number_format($item->unit_price, 0, ',', '.') }}
                        </td>
                        <td class="text-right font-bold">
                            Rp {{ number_format($item->quantity * $item->unit_price, 0, ',', '.') }}
                        </td>
                    </tr>
                @endforeach
            </table>

            <div class="divider"></div>

            <!-- Ringkasan Total & Pembayaran -->
            <table class="summary-table">
                <tr>
                    <td class="text-left">Total Item:</td>
                    <td class="text-right">{{ $totalItemsCount }} porsi</td>
                </tr>
                <tr>
                    <td class="text-left">Pembayaran:</td>
                    <td class="text-right">{{ $order->payment_method === 'cash' ? 'TUNAI (CASH)' : 'QRIS DIGITAL' }}</td>
                </tr>
                <tr class="total-row">
                    <td class="text-left" style="padding-top: 4px;">TOTAL:</td>
                    <td class="text-right" style="padding-top: 4px;">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
                </tr>
            </table>

            <div class="divider-double"></div>

            <!-- Info Khusus Owner (HPP & Margin jika diaktifkan) -->
            @if ($isOwner)
                <div class="owner-insight hide-on-print" id="ownerInsight">
                    <div class="font-bold text-center" style="margin-bottom: 2px;">-- ANALISIS LABA (OWNER) --</div>
                    <table style="width: 100%; font-size: 9.5px;">
                        <tr>
                            <td>HPP Bahan Baku:</td>
                            <td class="text-right font-bold">Rp {{ number_format($totalHpp, 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td>Laba Kotor:</td>
                            <td class="text-right font-bold">Rp {{ number_format($grossProfit, 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td>Margin:</td>
                            <td class="text-right font-bold">{{ $marginPct }}%</td>
                        </tr>
                    </table>
                </div>
            @endif

            <!-- Footer Struk -->
            <div class="footer-text">
                <p class="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar</p>
                <p style="margin-top: 4px; font-size: 8.5px; color: #444;">Dicetak otomatis oleh Kulakan App</p>
            </div>
        </div>
    </div>

    <!-- Script Pengendali Ukuran dan Auto Print -->
    <script>
        function setPaperMode(mode) {
            const paper = document.getElementById('receiptPaper');
            const btn58 = document.getElementById('btn-58mm');
            const btn80 = document.getElementById('btn-80mm');

            if (mode === '80mm') {
                paper.classList.remove('mode-58mm');
                paper.classList.add('mode-80mm');
                btn80.classList.add('active');
                btn58.classList.remove('active');
                try { localStorage.setItem('kulakan_receipt_paper_size', '80mm'); } catch(e){}
            } else {
                paper.classList.remove('mode-80mm');
                paper.classList.add('mode-58mm');
                btn58.classList.add('active');
                btn80.classList.remove('active');
                try { localStorage.setItem('kulakan_receipt_paper_size', '58mm'); } catch(e){}
            }
        }

        function togglePrintMargin(show) {
            const insight = document.getElementById('ownerInsight');
            if (!insight) return;
            if (show) {
                insight.classList.remove('hide-on-print');
            } else {
                insight.classList.add('hide-on-print');
            }
        }

        // Baca preferensi ukuran terakhir jika ada
        try {
            const saved = localStorage.getItem('kulakan_receipt_paper_size');
            if (saved === '80mm') {
                setPaperMode('80mm');
            }
        } catch(e){}

        // Auto print jika query ?auto=1
        if (new URLSearchParams(window.location.search).get('auto') === '1') {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.print();
                }, 350);
            });
        }
    </script>
</body>
</html>
