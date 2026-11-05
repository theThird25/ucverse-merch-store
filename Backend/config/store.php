<?php

return [
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'credentials' => env('FIREBASE_CREDENTIALS'),
        'transport' => env('FIRESTORE_TRANSPORT', 'rest'),
    ],
];
