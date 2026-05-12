<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentType;
use App\Models\RevenueHistory;
use App\Models\PetRegistration;
use Carbon\Carbon;

class RevenueController extends Controller
{
    /**
     * Get revenue data with monthly breakdown
     */
    public function index(Request $request)
    {
        try {
            $year = $request->get('year', date('Y'));
            $paymentTypeId = $request->get('payment_type_id', 1); // Default to pet registration
            
            // Get the payment type
            $paymentType = PaymentType::findOrFail($paymentTypeId);
            
            // Get revenue history for this payment type
            $history = RevenueHistory::where('payment_type_id', $paymentTypeId)
                ->orderBy('effective_date')
                ->get();
            
            // Get current registrations with revenue calculation
            $registrations = PetRegistration::whereYear('created_at', $year)
                ->with(['pet', 'paymentType'])
                ->get();
            
            // Calculate monthly revenue
            $monthlyRevenue = [];
            $totalRevenue = 0;
            
            for ($month = 1; $month <= 12; $month++) {
                $monthStart = Carbon::create($year, $month, 1)->startOfMonth();
                $monthEnd = Carbon::create($year, $month, 1)->endOfMonth();
                
                // Get fee effective for this month
                $feeForMonth = $this->getFeeForDate($paymentTypeId, $monthStart);
                
                // Count registrations for this month
                $monthRegistrations = $registrations->filter(function ($reg) use ($monthStart, $monthEnd) {
                    $regDate = Carbon::parse($reg->created_at);
                    return $regDate->between($monthStart, $monthEnd);
                });
                
                $count = $monthRegistrations->count();
                $revenue = $count * $feeForMonth;
                $totalRevenue += $revenue;
                
                $monthlyRevenue[] = [
                    'month' => $month,
                    'month_name' => $monthStart->format('F'),
                    'count' => $count,
                    'fee_per_registration' => $feeForMonth,
                    'total_revenue' => $revenue,
                    'year' => $year
                ];
            }
            
            // Get all payment types for dropdown
            $paymentTypes = PaymentType::all();
            
            return response()->json([
                'success' => true,
                'year' => $year,
                'payment_type' => $paymentType,
                'payment_types' => $paymentTypes,
                'monthly_revenue' => $monthlyRevenue,
                'total_revenue' => $totalRevenue,
                'history' => $history,
                'current_fee' => $paymentType->amount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch revenue data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get fee amount effective for a specific date
     */
    private function getFeeForDate($paymentTypeId, $date)
    {
        // Get the most recent fee change before or on this date
        $historyEntry = RevenueHistory::where('payment_type_id', $paymentTypeId)
            ->where('effective_date', '<=', $date)
            ->orderBy('effective_date', 'desc')
            ->first();
        
        if ($historyEntry) {
            return $historyEntry->new_amount;
        }
        
        // Check if there's any history AFTER this date
        // If so, use the old_amount from the earliest history as the baseline
        $futureHistory = RevenueHistory::where('payment_type_id', $paymentTypeId)
            ->where('effective_date', '>', $date)
            ->orderBy('effective_date', 'asc')
            ->first();
        
        if ($futureHistory) {
            // This date is before any changes, so use the original amount (old_amount of first change)
            return $futureHistory->old_amount;
        }
        
        // If no history at all, return current amount from payment type
        $paymentType = PaymentType::find($paymentTypeId);
        return $paymentType ? $paymentType->amount : 0;
    }

    /**
     * Update registration fee with history tracking
     */
    public function updateFee(Request $request)
    {
        try {
            $validated = $request->validate([
                'payment_type_id' => 'required|exists:payment_types,id',
                'new_amount' => 'required|numeric|min:0',
                'effective_date' => 'required|date',
                'reason' => 'nullable|string|max:500'
            ]);

            $paymentType = PaymentType::findOrFail($validated['payment_type_id']);
            $oldAmount = $paymentType->amount;
            $newAmount = $validated['new_amount'];

            // Only update if amount has changed
            if ($oldAmount != $newAmount) {
                // Create history record
                RevenueHistory::create([
                    'payment_type_id' => $paymentType->id,
                    'old_amount' => $oldAmount,
                    'new_amount' => $newAmount,
                    'effective_date' => $validated['effective_date'],
                    'reason' => $validated['reason'] ?? 'Fee adjustment',
                    'changed_by' => auth()->id()
                ]);

                // Update the payment type amount
                $paymentType->update(['amount' => $newAmount]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Registration fee updated successfully',
                'old_amount' => $oldAmount,
                'new_amount' => $newAmount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update registration fee',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get fee history for a payment type
     */
    public function getHistory($paymentTypeId)
    {
        try {
            $history = RevenueHistory::where('payment_type_id', $paymentTypeId)
                ->with(['changedBy', 'paymentType'])
                ->orderBy('effective_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch fee history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
