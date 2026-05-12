<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'User not found'
            ], 401);
        }

        // Check if password setup is required (walk-in client with real email)
        // Check this BEFORE password validation so they get proper forgot password message
        if ($user->password_setup_required) {
            return response()->json([
                'success' => false,
                'walk_in_forgot_password_required' => true,
                'error' => 'This is a walk-in client account. Please use Forgot Password to set up your password.',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                ]
            ], 403);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid password',
            ], 401);
        }

        // Generate and store token in remember_token
        $token = Str::random(60);
        $user->remember_token = $token;
        $user->save();

        return response()->json([
            'success' => true,
            'password_setup_required' => false,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
            ],
            'token' => $token
        ]);
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'firstname' => 'nullable|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:1|max:120',
            'barangay_id' => 'nullable|exists:barangays,id',
            'zone' => 'nullable|string|max:50',
            'phone_number' => 'nullable|string|max:20',
            'facebook' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Generate token
        $token = Str::random(60);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'firstname' => $request->firstname,
            'lastname' => $request->lastname,
            'middlename' => $request->middlename,
            'age' => $request->age,
            'barangay_id' => $request->barangay_id,
            'zone' => $request->zone,
            'phone_number' => $request->phone_number,
            'facebook' => $request->facebook,
            'role' => 'client',
            'remember_token' => $token,
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
            ],
            'token' => $token
        ], 201);
    }

    /**
     * Logout user (Clear remember_token)
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->remember_token = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Claim walk-in account - set password for clients registered at clinic
     */
    public function claimAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)
            ->where('password_setup_required', true)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Account not found or already set up'
            ], 404);
        }

        // Update password and mark as set up
        $user->password = Hash::make($request->password);
        $user->password_setup_required = false;
        
        // Generate token
        $token = Str::random(60);
        $user->remember_token = $token;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Account set up successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
            ],
            'token' => $token
        ]);
    }

    /**
     * Send OTP to email for password reset or account claim
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'purpose' => 'nullable|string|in:password_reset,account_claim',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $purpose = $request->input('purpose', 'password_reset');
        
        // Check if user exists
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'User not found'
            ], 404);
        }

        // For account claim, verify user needs password setup
        if ($purpose === 'account_claim' && !$user->password_setup_required) {
            return response()->json([
                'success' => false,
                'error' => 'Account is already set up'
            ], 400);
        }

        // Generate OTP
        $otp = OtpCode::createForEmail($request->email, $purpose, 10);

        // Send email with OTP
        try {
            Mail::to($request->email)->send(new \App\Mail\OtpMail($otp->code, $purpose));
            
            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully',
                'expires_in' => 600, // 10 minutes in seconds
            ]);
        } catch (\Exception $e) {
            // If email fails, still return OTP for testing
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            
            return response()->json([
                'success' => true,
                'message' => 'OTP generated (email failed - check config)',
                'otp' => $otp->code, // Return OTP for testing
                'expires_in' => 600,
                'email_error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'purpose' => 'nullable|string|in:password_reset,account_claim',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $purpose = $request->input('purpose', 'password_reset');
        
        $otp = OtpCode::verify($request->email, $request->code, $purpose);

        if (!$otp) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired OTP'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully',
            'verified' => true,
        ]);
    }

    /**
     * Reset password with OTP
     */
    public function resetPasswordWithOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Verify OTP first
        $otp = OtpCode::verify($request->email, $request->code, 'password_reset');

        if (!$otp) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired OTP'
            ], 400);
        }

        // Update password and clear password_setup_required for walk-in clients
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->password_setup_required = false; // Clear the walk-in flag
        $user->save();

        // Mark OTP as used
        $otp->markAsUsed();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
        ]);
    }

    /**
     * Claim account with OTP (for walk-in clients)
     */
    public function claimAccountWithOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Verify OTP first
        $otp = OtpCode::verify($request->email, $request->code, 'account_claim');

        if (!$otp) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired OTP'
            ], 400);
        }

        $user = User::where('email', $request->email)
            ->where('password_setup_required', true)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Account not found or already set up'
            ], 404);
        }

        // Update password and mark as set up
        $user->password = Hash::make($request->password);
        $user->password_setup_required = false;
        
        // Generate token
        $token = Str::random(60);
        $user->remember_token = $token;
        $user->save();

        // Mark OTP as used
        $otp->markAsUsed();

        return response()->json([
            'success' => true,
            'message' => 'Account set up successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
            ],
            'token' => $token
        ]);
    }
}
