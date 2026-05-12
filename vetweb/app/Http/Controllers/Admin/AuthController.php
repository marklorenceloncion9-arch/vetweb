<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Animal;
use App\Models\PetRegistration;
use App\Models\PaymentType;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Show the admin login form.
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle an admin login request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        \Log::info('Admin login attempt', [
            'email' => $credentials['email'],
            'user_found' => !!$user,
            'user_role' => $user?->role,
        ]);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            \Log::warning('Admin login failed - invalid credentials', ['email' => $credentials['email']]);
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        // Check if user has admin role (data_manager, budget_officer, or owner)
        if (!in_array($user->role, ['data_manager', 'budget_officer', 'owner'])) {
            \Log::warning('Admin login failed - invalid role', ['email' => $credentials['email'], 'role' => $user->role]);
            return back()->withErrors([
                'email' => 'You do not have permission to access the admin panel.',
            ])->onlyInput('email');
        }

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            // Redirect based on role
            if ($user->role === 'budget_officer') {
                return redirect()->intended('/budget/dashboard');
            }

            return redirect()->intended('/admin/dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Handle an admin logout request.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login');
    }

    /**
     * Register a new budget officer account.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'firstname' => 'nullable|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:1|max:120',
            'phone_number' => 'nullable|string|regex:/^09\d{9}$/',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:budget_officer',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['email_verified_at'] = now();

        User::create($validated);

        return redirect()->back()->with('success', 'Budget Officer account created successfully!');
    }

    /**
     * Show the admin dashboard.
     */
    public function dashboard()
    {
        $stats = [
            'totalClients' => User::where('role', 'client')->count(),
            'totalPets' => Animal::count(),
            'totalRevenue' => PetRegistration::where('status', 'paid')->sum('amount'),
            'registeredPets' => PetRegistration::where('status', 'paid')->count(),
        ];

        $registrationFee = PaymentType::getAmount('pet_registration');

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'registrationFee' => $registrationFee,
        ]);
    }

    /**
     * Update registration fee setting.
     */
    public function updateRegistrationFee(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        PaymentType::updateAmount('pet_registration', $validated['amount']);

        return back()->with('success', 'Registration fee updated successfully!');
    }

    /**
     * Show the settings page with payment types.
     */
    public function settings()
    {
        $paymentTypes = PaymentType::all();

        return Inertia::render('Admin/Settings', [
            'paymentTypes' => $paymentTypes,
        ]);
    }

    /**
     * Update a payment type amount.
     */
    public function updatePaymentType(Request $request, $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $paymentType = PaymentType::findOrFail($id);
        $paymentType->update(['amount' => $validated['amount']]);

        return back()->with('success', $paymentType->type_name . ' fee updated successfully!');
    }

    /**
     * Show the budget officer dashboard.
     */
    public function budgetDashboard()
    {
        $stats = [
            'totalClients' => User::where('role', 'client')->count(),
            'totalPets' => Animal::count(),
            'totalRevenue' => PetRegistration::where('status', 'paid')->sum('amount'),
            'registeredPets' => PetRegistration::where('status', 'paid')->count(),
        ];

        return Inertia::render('budget/budget_dashboard', [
            'stats' => $stats,
        ]);
    }
}
