import { usePage } from '@inertiajs/react';
import BudgetSidebar from '@/Components/Budget/BudgetSidebar';

export default function Dashboard({ stats }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <BudgetSidebar />

            <div className="flex-1 flex flex-col ml-72">
                {/* Top Header */}
                <header className="bg-white sticky top-0 z-30 px-8 py-4 shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Budget Dashboard</h1>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-gray-900">{auth?.user?.name || 'Budget Officer'}</p>
                                    <p className="text-gray-400 text-xs">Budget Officer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Clients</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats?.registeredPets || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Registered Pets</p>
                                </div>
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">₱{stats?.totalRevenue?.toLocaleString() || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
                                </div>
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-8 text-white">
                        <h2 className="text-2xl font-bold mb-2">Welcome back, {auth?.user?.firstname || 'Budget Officer'}!</h2>
                        <p className="text-violet-100">Manage your veterinary clinic finances and view reports from here.</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
