import React from 'react';
import { Link } from '@inertiajs/react';

function PetOwnersList({ clients }) {
    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">List of Clients</h3>
            </div>
            
            {/* Table with sticky headers and scrollable body */}
            <div className="overflow-x-auto scrollbar-hide" style={{ height: '400px' }}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animals</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto max-h-96 scrollbar-hide">
                        {clients.length === 0 ? (
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="6">No clients added yet</td>
                            </tr>
                        ) : (
                            [...clients].sort((a, b) => {
                                const lastNameA = (a.lastname || '').toLowerCase();
                                const lastNameB = (b.lastname || '').toLowerCase();
                                if (lastNameA !== lastNameB) {
                                    return lastNameA.localeCompare(lastNameB);
                                }
                                // If last names are the same, sort by first name
                                const firstNameA = (a.firstname || '').toLowerCase();
                                const firstNameB = (b.firstname || '').toLowerCase();
                                return firstNameA.localeCompare(firstNameB);
                            }).map((client) => (
                                <tr key={client.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {client.lastname}
                                        </div>
                                        <div className="text-sm text-gray-500">{client.firstname} {client.middlename}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.zone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {client.phone_number || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                client.animals_count > 0 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {client.animals_count || 0} {client.animals_count === 1 ? 'Animal' : 'Animals'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link href={`/admin/clients/${client.id}`} className="text-sky-600 hover:text-sky-900">View</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PetOwnersList;
