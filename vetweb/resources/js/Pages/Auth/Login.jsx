import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function Login() {
    const { flash } = usePage().props;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);
    const [createForm, setCreateForm] = useState({
        firstname: '',
        lastname: '',
        middlename: '',
        age: '',
        phone_number: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'budget_officer'
    });
    const [createLoading, setCreateLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        router.post('/admin/login', {
            email,
            password,
        }, {
            onFinish: () => setLoading(false),
            onError: (errors) => {
                setErrors(errors);
                // If there's an email error, show it as a general error too
                if (errors.email) {
                    setErrors({ general: errors.email });
                }
            },
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 flex items-center justify-center px-4">

            {/* Login Container */}
            <div className="relative z-10 bg-white/95 backdrop-blur-lg border border-white/30 shadow-2xl rounded-3xl p-8 max-w-md w-full">
                {/* Vet Logo/Icon */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zm-2,15l-5,-5 1.41,-1.41L10,14.17l7.59,-7.59L19,8l-9,9z"/>
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16Z"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Vetcare</h1>
                    <p className="text-violet-600">Sign in to manage your veterinary clinic</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-green-100 text-green-800 border border-green-200 flex items-center justify-between">
                        <span>{successMessage}</span>
                        <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">×</button>
                    </div>
                )}

                {/* General Error */}
                {errors.general && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-100 text-red-800 border border-red-200 flex items-center justify-between">
                        <span>{errors.general}</span>
                        <button onClick={() => setErrors(prev => ({ ...prev, general: '' }))} className="text-red-600 hover:text-red-800">×</button>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                                </svg>
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors`}
                                placeholder="admin@vetcare.com"
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`block w-full pl-10 pr-3 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors`}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <a href="#" className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>

                    {/* Create Account Button */}
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="w-full flex justify-center items-center py-3 px-4 border-2 border-violet-600 rounded-lg shadow-sm text-sm font-medium text-violet-600 bg-white hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                            </svg>
                            Create Budget Officer Account
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        © Vetcare. All rights reserved.
                    </p>
                    <div className="mt-2 flex justify-center space-x-4">
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>

            {/* Create Account Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Create Account</h3>
                                    <p className="text-sm text-gray-500">Budget Officer Registration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setCreateLoading(true);
                            // Combine firstname and lastname for name field
                            const submitData = {
                                ...createForm,
                                name: `${createForm.firstname} ${createForm.lastname}`.trim()
                            };
                            router.post('/admin/register', submitData, {
                                onSuccess: () => {
                                    setCreateLoading(false);
                                    setShowCreateModal(false);
                                    setCreateForm({ firstname: '', lastname: '', middlename: '', age: '', phone_number: '', email: '', password: '', password_confirmation: '', role: 'budget_officer' });
                                    alert('Account created successfully! You can now log in.');
                                },
                                onError: (errors) => {
                                    setErrors(errors);
                                    setCreateLoading(false);
                                }
                            });
                        }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        value={createForm.lastname}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, lastname: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        placeholder="Doe"
                                        required
                                    />
                                    {errors.lastname && <p className="mt-1 text-xs text-red-600">{errors.lastname}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        value={createForm.firstname}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, firstname: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        placeholder="John"
                                        required
                                    />
                                    {errors.firstname && <p className="mt-1 text-xs text-red-600">{errors.firstname}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                                    <input
                                        type="text"
                                        value={createForm.middlename}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, middlename: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        placeholder="Smith"
                                    />
                                    {errors.middlename && <p className="mt-1 text-xs text-red-600">{errors.middlename}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                                    <input
                                        type="number"
                                        value={createForm.age}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, age: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        placeholder="25"
                                        min="1"
                                        max="120"
                                        required
                                    />
                                    {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={createForm.phone_number}
                                    onChange={(e) => {
                                        let phoneValue = e.target.value.replace(/\D/g, '');
                                        if (phoneValue.length > 0 && !phoneValue.startsWith('09')) {
                                            phoneValue = '09' + phoneValue.replace(/^0+/, '');
                                        }
                                        phoneValue = phoneValue.substring(0, 11);
                                        setCreateForm(prev => ({ ...prev, phone_number: phoneValue }));
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    placeholder="09XXXXXXXXX"
                                    maxLength="11"
                                />
                                {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    placeholder="officer@vetcare.com"
                                    required
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    placeholder="Min 8 characters"
                                    required
                                    minLength="8"
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                <input
                                    type="password"
                                    value={createForm.password_confirmation}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    placeholder="Confirm password"
                                    required
                                />
                                {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-violet-700 rounded-lg hover:from-violet-700 hover:to-violet-800 transition-colors disabled:opacity-50"
                                >
                                    {createLoading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
