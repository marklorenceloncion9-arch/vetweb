import Sidebar from '@/Components/Admin/Sidebar';

export default function RevenueVhc() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">VHC Revenue</h1>
                        <p className="text-gray-500 mt-1">VHC revenue tracking and management</p>
                    </div>

                    {/* Placeholder Content */}
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            VHC revenue tracking features will be implemented here. This section will show VHC certificate revenue, fees, and statistics.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
