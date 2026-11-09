<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * QRIS Generator & Parser (EMVCo & Bank Indonesia Standard).
 *
 * Mengikuti spesifikasi EMVCo QR Code for Payment Systems & Bank Indonesia (PADG No. 21/18/PADG/2019 / ASPI).
 * Menghasilkan Dynamic QRIS ber-nominal pasti dari stiker QRIS statis merchant,
 * memvalidasi integritas payload dengan algoritma CRC16-CCITT-FALSE.
 */
class QrisService
{
    private const PIM_DYNAMIC = '11';

    private const PIM_STATIC = '12';

    private const CURRENCY_IDR = '360';

    private const COUNTRY_CODE = 'ID';

    private const SWITCHING_DOMAIN = 'ID.CO.QRIS.WWW';

    private const CRC_INITIAL = 0xFFFF;

    private const CRC_POLYNOMIAL = 0x1021;

    private const EMV_TAGS = [
        'PAYLOAD_FORMAT' => '00',
        'POINT_OF_INITIATION' => '01',
        'MERCHANT_ACCOUNT_INFO' => '26',
        'SWITCHING' => '51',
        'MERCHANT_CATEGORY_CODE' => '52',
        'TRANSACTION_CURRENCY' => '53',
        'TRANSACTION_AMOUNT' => '54',
        'COUNTRY_CODE' => '58',
        'MERCHANT_NAME' => '59',
        'MERCHANT_CITY' => '60',
        'POSTAL_CODE' => '61',
        'ADDITIONAL_DATA' => '62',
        'CRC' => '63',
    ];

    private const MAI_SUBTAGS = [
        'ACQUIRER_DOMAIN' => '00',
        'MPAN' => '01',
        'TERMINAL_ID' => '02',
        'MERCHANT_CATEGORY' => '03',
    ];

    private const SWITCHING_SUBTAGS = [
        'SWITCHING_DOMAIN' => '00',
        'NMID' => '02',
        'MERCHANT_CATEGORY' => '03',
    ];

    private const ADDITIONAL_SUBTAGS = [
        'INVOICE_ID' => '01',
    ];

    /**
     * Ambil string QRIS statis default milik outlet dari konfigurasi.
     */
    public function getStoreDefaultStaticQris(): string
    {
        $payload = null;
        if (function_exists('config')) {
            try {
                $payload = config('services.qris.static_payload');
            } catch (\Throwable) {
                $payload = null;
            }
        }

        if (empty($payload)) {
            $payload = '00020101021126610014COM.GO-JEK.WWW01189360091433754290870210G3754290870303UMI51440014ID.CO.QRIS.WWW0215ID10243624797260303UMI5204504553033605802ID5915Barokah Compeny6008SURABAYA61056028262070703A0163043704';
        }

        return trim((string) $payload);
    }

    /**
     * Konversi payload QRIS statis menjadi Dynamic QRIS dengan nominal belanja & nomor faktur.
     */
    public function convertToDynamic(string $staticQris, float $amount, ?string $newInvoiceId = null): string
    {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Nominal QRIS harus lebih besar dari 0.');
        }

        $merchantData = $this->extractMerchant($staticQris);

        $merchantData['invoice_id'] = ($newInvoiceId !== null && $newInvoiceId !== '')
            ? $newInvoiceId
            : ($merchantData['invoice_id'] !== '' ? $merchantData['invoice_id'] : $this->generateInvoiceId());

        return $this->generate($merchantData, $amount);
    }

    /**
     * Generate string QRIS dari array data merchant.
     *
     * @param  array<string, mixed>  $merchantData
     */
    public function generate(array $merchantData, ?float $amount = null): string
    {
        $this->validateMerchantData($merchantData);

        $qris = '';
        $qris .= $this->emvTag(self::EMV_TAGS['PAYLOAD_FORMAT'], '01');
        $qris .= $this->emvTag(
            self::EMV_TAGS['POINT_OF_INITIATION'],
            $amount !== null ? self::PIM_DYNAMIC : self::PIM_STATIC
        );

        $qris .= $this->buildMerchantAccountInfo($merchantData);
        $qris .= $this->buildSwitchingInfo($merchantData);

        $mcc = isset($merchantData['mcc']) && is_string($merchantData['mcc']) && $merchantData['mcc'] !== ''
            ? $merchantData['mcc']
            : '0000';
        $qris .= $this->emvTag(self::EMV_TAGS['MERCHANT_CATEGORY_CODE'], $mcc);
        $qris .= $this->emvTag(self::EMV_TAGS['TRANSACTION_CURRENCY'], self::CURRENCY_IDR);

        if ($amount !== null) {
            $qris .= $this->emvTag(
                self::EMV_TAGS['TRANSACTION_AMOUNT'],
                number_format($amount, 2, '.', '')
            );

            if (empty($merchantData['invoice_id'])) {
                $merchantData['invoice_id'] = $this->generateInvoiceId();
            }
        }

        $qris .= $this->emvTag(self::EMV_TAGS['COUNTRY_CODE'], self::COUNTRY_CODE);
        $qris .= $this->emvTag(self::EMV_TAGS['MERCHANT_NAME'], (string) $merchantData['merchant_name']);
        $qris .= $this->emvTag(self::EMV_TAGS['MERCHANT_CITY'], (string) $merchantData['merchant_city']);

        if (! empty($merchantData['postal_code'])) {
            $qris .= $this->emvTag(self::EMV_TAGS['POSTAL_CODE'], (string) $merchantData['postal_code']);
        }

        if (! empty($merchantData['invoice_id'])) {
            $additionalData = $this->emvTag(
                self::ADDITIONAL_SUBTAGS['INVOICE_ID'],
                (string) $merchantData['invoice_id']
            );
            $qris .= $this->emvTag(self::EMV_TAGS['ADDITIONAL_DATA'], $additionalData);
        }

        $qris .= $this->generateCrc($qris);

        return $qris;
    }

    /**
     * Parse string QRIS menjadi array asosiatif key-value tag EMVCo.
     *
     * @return array<array-key, string>
     */
    public function parse(string $qris): array
    {
        $qris = trim($qris);
        if ($qris === '') {
            throw new InvalidArgumentException('Payload QRIS tidak boleh kosong.');
        }

        $data = [];
        $pos = 0;
        $length = strlen($qris);

        while ($pos < $length - 4) {
            if ($pos + 4 > $length) {
                break;
            }

            $tag = substr($qris, $pos, 2);
            $tagLength = (int) substr($qris, $pos + 2, 2);

            if ($pos + 4 + $tagLength > $length) {
                break;
            }

            $value = substr($qris, $pos + 4, $tagLength);
            $data[$tag] = $value;
            $pos += 4 + $tagLength;
        }

        return $data;
    }

    /**
     * Ekstrak data merchant terstruktur dari string QRIS.
     *
     * @return array{
     *     acquirer_domain: string,
     *     mpan: string,
     *     terminal_id: string,
     *     merchant_category: string,
     *     nmid: string,
     *     mcc: string,
     *     merchant_name: string,
     *     merchant_city: string,
     *     postal_code: string,
     *     invoice_id: string,
     *     amount: float|null,
     *     is_dynamic: bool
     * }
     */
    public function extractMerchant(string $qris): array
    {
        $parsed = $this->parse($qris);
        $mai = $this->parseSubfields($parsed[self::EMV_TAGS['MERCHANT_ACCOUNT_INFO']] ?? '');
        $switching = $this->parseSubfields($parsed[self::EMV_TAGS['SWITCHING']] ?? '');

        $additionalData = [];
        if (isset($parsed[self::EMV_TAGS['ADDITIONAL_DATA']])) {
            $additionalData = $this->parseSubfields($parsed[self::EMV_TAGS['ADDITIONAL_DATA']]);
        }

        return [
            'acquirer_domain' => $mai[self::MAI_SUBTAGS['ACQUIRER_DOMAIN']] ?? '',
            'mpan' => $mai[self::MAI_SUBTAGS['MPAN']] ?? '',
            'terminal_id' => $mai[self::MAI_SUBTAGS['TERMINAL_ID']] ?? '',
            'merchant_category' => $mai[self::MAI_SUBTAGS['MERCHANT_CATEGORY']] ?? 'UMI',
            'nmid' => $switching[self::SWITCHING_SUBTAGS['NMID']] ?? '',
            'mcc' => $parsed[self::EMV_TAGS['MERCHANT_CATEGORY_CODE']] ?? '0000',
            'merchant_name' => $parsed[self::EMV_TAGS['MERCHANT_NAME']] ?? 'Merchant',
            'merchant_city' => $parsed[self::EMV_TAGS['MERCHANT_CITY']] ?? 'Kota',
            'postal_code' => $parsed[self::EMV_TAGS['POSTAL_CODE']] ?? '',
            'invoice_id' => $additionalData[self::ADDITIONAL_SUBTAGS['INVOICE_ID']] ?? '',
            'amount' => isset($parsed[self::EMV_TAGS['TRANSACTION_AMOUNT']])
                ? (float) $parsed[self::EMV_TAGS['TRANSACTION_AMOUNT']]
                : null,
            'is_dynamic' => ($parsed[self::EMV_TAGS['POINT_OF_INITIATION']] ?? '') === self::PIM_DYNAMIC,
        ];
    }

    /**
     * Validasi integritas QRIS menggunakan checksum CRC16-CCITT-FALSE.
     */
    public function validateQris(string $qris): bool
    {
        try {
            $parsed = $this->parse($qris);

            if (! isset($parsed[self::EMV_TAGS['CRC']])) {
                return false;
            }

            $providedCrc = strtoupper($parsed[self::EMV_TAGS['CRC']]);
            $qrisWithoutCrc = substr($qris, 0, -8);
            $qrisWithCrcPlaceholder = $qrisWithoutCrc.self::EMV_TAGS['CRC'].'04';

            $calculatedCrc = strtoupper(dechex($this->crc16CcittFalse($qrisWithCrcPlaceholder)));
            $calculatedCrc = str_pad($calculatedCrc, 4, '0', STR_PAD_LEFT);

            return $providedCrc === $calculatedCrc;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Hitung nilai CRC16-CCITT-FALSE (Polynomial 0x1021, Initial 0xFFFF).
     */
    public function crc16CcittFalse(string $data): int
    {
        $crc = self::CRC_INITIAL;
        $length = strlen($data);

        for ($i = 0; $i < $length; $i++) {
            $crc ^= (ord($data[$i]) << 8);

            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) {
                    $crc = ($crc << 1) ^ self::CRC_POLYNOMIAL;
                } else {
                    $crc <<= 1;
                }
                $crc &= 0xFFFF;
            }
        }

        return $crc;
    }

    /**
     * @param  array<string, mixed>  $merchantData
     */
    private function validateMerchantData(array $merchantData): void
    {
        $requiredFields = [
            'acquirer_domain',
            'mpan',
            'merchant_category',
            'nmid',
            'merchant_name',
            'merchant_city',
        ];

        foreach ($requiredFields as $field) {
            if (empty($merchantData[$field])) {
                throw new InvalidArgumentException("Field '{$field}' diperlukan untuk QRIS.");
            }
        }
    }

    /**
     * @param  array<string, mixed>  $merchantData
     */
    private function buildMerchantAccountInfo(array $merchantData): string
    {
        $mai = '';
        $mai .= $this->emvTag(self::MAI_SUBTAGS['ACQUIRER_DOMAIN'], (string) $merchantData['acquirer_domain']);
        $mai .= $this->emvTag(self::MAI_SUBTAGS['MPAN'], (string) $merchantData['mpan']);

        if (! empty($merchantData['terminal_id'])) {
            $mai .= $this->emvTag(self::MAI_SUBTAGS['TERMINAL_ID'], (string) $merchantData['terminal_id']);
        }

        $mai .= $this->emvTag(self::MAI_SUBTAGS['MERCHANT_CATEGORY'], (string) $merchantData['merchant_category']);

        return $this->emvTag(self::EMV_TAGS['MERCHANT_ACCOUNT_INFO'], $mai);
    }

    /**
     * @param  array<string, mixed>  $merchantData
     */
    private function buildSwitchingInfo(array $merchantData): string
    {
        $switching = '';
        $switching .= $this->emvTag(self::SWITCHING_SUBTAGS['SWITCHING_DOMAIN'], self::SWITCHING_DOMAIN);
        $switching .= $this->emvTag(self::SWITCHING_SUBTAGS['NMID'], (string) $merchantData['nmid']);
        $switching .= $this->emvTag(self::SWITCHING_SUBTAGS['MERCHANT_CATEGORY'], (string) $merchantData['merchant_category']);

        return $this->emvTag(self::EMV_TAGS['SWITCHING'], $switching);
    }

    private function emvTag(string $id, string $value): string
    {
        if (strlen($id) !== 2) {
            throw new InvalidArgumentException('Tag ID harus 2 karakter.');
        }

        $length = strlen($value);
        if ($length > 99) {
            throw new InvalidArgumentException("Nilai tag {$id} terlalu panjang untuk standar EMV (maksimal 99 karakter).");
        }

        return $id.str_pad((string) $length, 2, '0', STR_PAD_LEFT).$value;
    }

    /**
     * @return array<array-key, string>
     */
    private function parseSubfields(string $subfield): array
    {
        if ($subfield === '') {
            return [];
        }

        $data = [];
        $pos = 0;
        $length = strlen($subfield);

        while ($pos < $length) {
            if ($pos + 4 > $length) {
                break;
            }

            $tag = substr($subfield, $pos, 2);
            $tagLength = (int) substr($subfield, $pos + 2, 2);

            if ($pos + 4 + $tagLength > $length) {
                break;
            }

            $value = substr($subfield, $pos + 4, $tagLength);
            $data[$tag] = $value;
            $pos += 4 + $tagLength;
        }

        return $data;
    }

    private function generateCrc(string $qris): string
    {
        $qrisWithCrcPlaceholder = $qris.self::EMV_TAGS['CRC'].'04';
        $crc = $this->crc16CcittFalse($qrisWithCrcPlaceholder);
        $crcHex = strtoupper(dechex($crc));
        $crcPadded = str_pad($crcHex, 4, '0', STR_PAD_LEFT);

        return $this->emvTag(self::EMV_TAGS['CRC'], $crcPadded);
    }

    private function generateInvoiceId(string $prefix = 'INV'): string
    {
        return $prefix.date('YmdHis').sprintf('%03d', mt_rand(0, 999));
    }
}
