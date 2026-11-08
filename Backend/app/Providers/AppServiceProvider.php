<?php

namespace App\Providers;

use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FirestoreClient::class, function () {
            $cfg = config('store.firebase');

            $options = [
                'projectId' => $cfg['project_id'],
                'transport' => $cfg['transport'],
            ];

            // With FIRESTORE_EMULATOR_HOST set, the client talks to the local emulator and needs no credentials.
            if (!getenv('FIRESTORE_EMULATOR_HOST')) {
                if (!empty($cfg['credentials_json'])) {
                    // Hosted: credentials arrive as base64 JSON in an environment variable.
                    $decoded = json_decode((string) base64_decode($cfg['credentials_json'], true), true);
                    if (!is_array($decoded)) {
                        throw new \RuntimeException('FIREBASE_CREDENTIALS_JSON is not valid base64-encoded JSON.');
                    }
                    $options['keyFile'] = $decoded;
                } elseif (!empty($cfg['credentials'])) {
                    // Local: path to the key file.
                    $path = $cfg['credentials'];
                    $absolute = str_starts_with($path, '/') || preg_match('/^[A-Za-z]:[\\\\\/]/', $path);
                    $options['keyFilePath'] = $absolute ? $path : base_path($path);
                }
            }

            return new FirestoreClient($options);
        });
    }

    public function boot(): void
    {
    }
}
