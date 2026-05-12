<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Get user profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middlename' => $user->middlename,
                'age' => $user->age,
                'phone_number' => $user->phone_number,
                'facebook' => $user->facebook,
                'barangay_id' => $user->barangay_id,
                'zone' => $user->zone,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'firstname' => 'sometimes|string|max:255',
            'lastname' => 'sometimes|string|max:255',
            'middlename' => 'sometimes|string|max:255',
            'age' => 'sometimes|integer|min:0|max:150',
            'phone_number' => 'sometimes|string|max:20',
            'facebook' => 'sometimes|string|max:255',
            'barangay_id' => 'sometimes|exists:barangays,id',
            'zone' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $user->update($request->only([
            'name', 'firstname', 'lastname', 'middlename', 
            'age', 'phone_number', 'facebook', 'barangay_id', 'zone'
        ]));

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middlename' => $user->middlename,
                'age' => $user->age,
                'phone_number' => $user->phone_number,
                'facebook' => $user->facebook,
                'barangay_id' => $user->barangay_id,
                'zone' => $user->zone,
                'role' => $user->role,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }
}
