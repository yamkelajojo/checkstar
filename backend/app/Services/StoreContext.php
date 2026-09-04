<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;

class StoreContext
{
    public function resolve(User $user, ?int $explicitStoreId = null): Store
    {
        $role = $user->role->value;

        if ($role === UserRole::Developer->value) {
            if ($explicitStoreId === null) {
                abort(403, 'Developer must provide a store_id');
            }

            return Store::findOrFail($explicitStoreId);
        }

        if ($role === UserRole::StoreOwner->value && $user->store) {
            return $user->store;
        }

        $staff = StoreStaff::where('user_id', $user->id)->first();
        if ($staff?->store_id) {
            return $staff->store;
        }

        abort(403, 'No store resolved for user');
    }
}
