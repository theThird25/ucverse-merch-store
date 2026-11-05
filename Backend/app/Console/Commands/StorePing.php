<?php

namespace App\Console\Commands;

use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Console\Command;

class StorePing extends Command
{
    protected $signature = 'store:ping';
    protected $description = 'Write, read and delete a test document in Firestore.';

    public function handle(FirestoreClient $db): int
    {
        $ref = $db->collection('_ping')->document('test');
        $ref->set(['at' => gmdate('c')]);
        $this->info('Firestore OK. Read back: ' . $ref->snapshot()->data()['at']);
        $ref->delete();

        return self::SUCCESS;
    }
}
