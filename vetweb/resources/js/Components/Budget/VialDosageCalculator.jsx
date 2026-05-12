import { useState } from 'react';

export default function VialDosageCalculator({ inventory, onDosageCalculated }) {
    const [dogWeight, setDogWeight] = useState('');
    const [dosage, setDosage] = useState(0);

    const calculateDosage = () => {
        if (!dogWeight || !inventory.volume_ml) return;
        
        const weight = parseFloat(dogWeight);
        if (isNaN(weight)) return;

        // 1kg = 0.10ml
        const calculatedDosage = weight * 0.10;
        setDosage(calculatedDosage);
        
        if (onDosageCalculated) {
            onDosageCalculated(calculatedDosage, weight);
        }
    };

    const handleWeightChange = (e) => {
        setDogWeight(e.target.value);
        setDosage(0);
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Dosage Calculator</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-sm font-medium text-blue-900">
                        Dog Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={dogWeight}
                        onChange={handleWeightChange}
                        placeholder="Enter dog weight in kg"
                        min="0.1"
                        step="0.1"
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-blue-900">
                        Calculated Dosage (ml)
                    </label>
                    <div className="px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                        {dosage.toFixed(2)} ml
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={calculateDosage}
                        disabled={!dogWeight || !inventory.volume_ml}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Calculate Dosage
                    </button>
                </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
                Formula: 1kg = 0.10ml (e.g., 10kg dog = 1.0ml)
            </p>
        </div>
    );
}
