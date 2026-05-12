export default function VhcViewModal({ isOpen, onClose, record }) {
    if (!isOpen || !record) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">VHC Details</h2>
                        <p className="text-sm text-gray-500 mt-0.5">View complete certificate information</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-5">
                        {/* VHC Information */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                                VHC Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                                    <p className="text-sm font-medium text-gray-900">{record.name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Purpose</p>
                                    <p className="text-sm font-medium text-gray-900">{record.purpose}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Origin</p>
                                    <p className="text-sm font-medium text-gray-900">{record.origin}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destination</p>
                                    <p className="text-sm font-medium text-gray-900">{record.destination}</p>
                                </div>
                            </div>
                        </section>

                        {/* Livestock Details */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                Livestock Details
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Species</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {record.species?.species_name || 'N/A'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Male Count</p>
                                        <p className="text-sm font-medium text-gray-900">{record.male_count || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Female Count</p>
                                        <p className="text-sm font-medium text-gray-900">{record.female_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Record Info */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                Record Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created On</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(record.created_at)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Certificate ID</p>
                                    <p className="text-sm font-medium text-gray-500">#{record.id}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
