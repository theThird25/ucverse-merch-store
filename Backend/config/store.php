<?php

return [
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'credentials' => env('FIREBASE_CREDENTIALS', 'storage/app/firebase-credentials.json'),
        'credentials_json' => env('FIREBASE_CREDENTIALS_JSON'),
        'transport' => env('FIRESTORE_TRANSPORT', 'rest'),
    ],

    'admin' => [
        'email' => env('ADMIN_EMAIL', 'admin@ucverse.test'),
        'password' => env('ADMIN_PASSWORD_HASH'),
        'password' => env('ADMIN_PASSWORD', env('APP_ENV') === 'local' ? 'admin1234' : null),
        'token_ttl_minutes' => (int) env('ADMIN_TOKEN_TTL', 240),
    ],

    'payment_methods' => ['Cash on Delivery', 'E-Wallet', 'Bank Transfer']
];
