<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Akses ditolak - Kulakan</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=nunito:600,700,800" rel="stylesheet">
    <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #F4F4F2;
            color: #1C1B18;
            font-family: 'Nunito', ui-rounded, system-ui, -apple-system, Segoe UI, sans-serif;
        }
        .card {
            background: #fff;
            border-radius: 32px;
            padding: 48px 40px;
            max-width: 440px;
            width: 100%;
            text-align: center;
            box-shadow: 0 2px 10px rgba(22, 22, 21, 0.03);
        }
        .badge {
            display: inline-flex;
            width: 64px;
            height: 64px;
            border-radius: 9999px;
            align-items: center;
            justify-content: center;
            background: #FDECE7;
            color: #EC582A;
            font-size: 26px;
            font-weight: 800;
        }
        h1 { font-size: 22px; margin: 20px 0 8px; letter-spacing: -0.02em; }
        p { color: #6E6E6A; font-size: 14px; line-height: 1.65; margin: 0 0 28px; }
        .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        a.primary {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            border-radius: 9999px;
            color: #fff;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            background-image: linear-gradient(145deg, #F57B54, #E84B20);
        }
        a.ghost {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            border-radius: 9999px;
            color: #1C1B18;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            background: #F4F4F2;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">403</div>
        <h1>Akses ditolak</h1>
        <p>Halaman ini hanya tersedia untuk peran <strong>Owner</strong>. Akun Anda tidak memiliki izin untuk membukanya.</p>
        <div class="actions">
            <a class="primary" href="{{ url('/pos') }}">Buka POS Kasir</a>
            <a class="ghost" href="{{ url('/bahan-baku') }}">Lihat Bahan Baku</a>
        </div>
    </div>
</body>
</html>
