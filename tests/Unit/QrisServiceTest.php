<?php

use App\Services\QrisService;

it('dapat mengekstrak data merchant dari string QRIS statis', function () {
    $service = new QrisService();
    $staticQris = $service->getStoreDefaultStaticQris();

    $merchant = $service->extractMerchant($staticQris);

    expect($merchant['merchant_name'])->toBe('Barokah Compeny')
        ->and($merchant['merchant_city'])->toBe('SURABAYA')
        ->and($merchant['nmid'])->toBe('ID1024362479726')
        ->and($merchant['acquirer_domain'])->toBe('COM.GO-JEK.WWW');
});

it('dapat mengonversi QRIS statis menjadi Dynamic QRIS ber-nominal pasti dengan CRC valid', function () {
    $service = new QrisService();
    $staticQris = $service->getStoreDefaultStaticQris();
    $amount = 45000;
    $invoiceId = 'ORD-20261109-001';

    $dynamicQris = $service->convertToDynamic($staticQris, $amount, $invoiceId);

    expect($service->validateQris($dynamicQris))->toBeTrue();

    $extracted = $service->extractMerchant($dynamicQris);
    expect($extracted['amount'])->toBe(45000.0)
        ->and($extracted['invoice_id'])->toBe($invoiceId)
        ->and($extracted['is_dynamic'])->toBeTrue();
});
