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

            return new FirestoreClient([
                'projectId' => $cfg['project_id'],
                'transport' => $cfg['transport'],
                'keyFilePath' => base_path($cfg['credentials']),
            ]);
        });
    }

    public function boot(): void
    {
    }
}
