<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Medicine;
use App\Models\Inventory;
use App\Models\InventoryLog;
use Illuminate\Support\Facades\DB;

class BudgetInventoryController extends Controller
{
    /**
     * Get all categories
     */
    public function getCategories()
    {
        try {
            $categories = Category::orderByRaw("CASE WHEN name = 'Others' THEN 1 ELSE 0 END, name")->get();
            return response()->json([
                'success' => true,
                'categories' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories'
            ], 500);
        }
    }

    /**
     * Get all units
     */
    public function getUnits()
    {
        try {
            $units = Unit::orderBy('name')->get();
            return response()->json([
                'success' => true,
                'units' => $units
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch units'
            ], 500);
        }
    }

    /**
     * Store new inventory item
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'medicine_name' => 'required|string|max:255',
                'category_id' => 'required|exists:categories,id',
                'quantity' => 'required|integer|min:1',
                'unit_id' => 'required|exists:units,id',
                'expiration_date' => 'required|date|after:today',
                'volume_ml' => 'nullable|numeric|min:0.1',
                'items_per_box' => 'nullable|integer|min:1'
            ]);

            DB::beginTransaction();

            // Create or get medicine
            $medicine = Medicine::firstOrCreate(
                ['name' => $validated['medicine_name']],
                ['category_id' => $validated['category_id']]
            );

            // Create inventory record
            $inventory = Inventory::create([
                'medicine_id' => $medicine->id,
                'quantity' => $validated['quantity'],
                'unit_id' => $validated['unit_id'],
                'expiration_date' => $validated['expiration_date'],
                'volume_ml' => $validated['volume_ml'] ?? null,
                'items_per_box' => $validated['items_per_box'] ?? null
            ]);

            // Create inventory log
            InventoryLog::create([
                'medicine_id' => $medicine->id,
                'inventory_id' => $inventory->id,
                'change_qty' => $validated['quantity'],
                'type' => 'IN'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Medicine added to inventory successfully',
                'inventory' => $inventory->load(['medicine', 'unit'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to add medicine: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all inventory items
     */
    public function index()
    {
        try {
            $inventory = Inventory::with(['medicine.category', 'unit'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'inventory' => $inventory->map(function($item) {
                    $isBox = $item->isBox();
                    $isVial = $item->isVial();
                    
                    // Display quantity: items for boxes, ml for vials, regular quantity otherwise
                    $displayQty = $isBox 
                        ? $item->getTotalItems() . ' items'
                        : ($isVial 
                            ? $item->quantity . ' vials'
                            : $item->quantity . ' ' . ($item->unit?->name ?? 'units'));
                    
                    return [
                        ...$item->toArray(),
                        'total_items' => $item->getTotalItems(),
                        'is_box' => $isBox,
                        'is_capsule_or_tablet' => $item->isCapsuleOrTablet(),
                        'is_vial' => $isVial,
                        'display_quantity' => $displayQty,
                        'items_remaining' => $isBox ? $item->getTotalItems() : null,
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory'
            ], 500);
        }
    }

    /**
     * Get single inventory item
     */
    public function show($id)
    {
        try {
            $inventory = Inventory::with(['medicine.category', 'unit'])
                ->findOrFail($id);

            $isBox = $inventory->isBox();
            $isVial = $inventory->isVial();
            
            $displayQty = $isBox 
                ? $inventory->getTotalItems() . ' items'
                : ($isVial 
                    ? $inventory->quantity . ' vials'
                    : $inventory->quantity . ' ' . ($inventory->unit?->name ?? 'units'));

            $inventoryData = [
                ...$inventory->toArray(),
                'total_items' => $inventory->getTotalItems(),
                'is_box' => $isBox,
                'is_capsule_or_tablet' => $inventory->isCapsuleOrTablet(),
                'is_vial' => $isVial,
                'display_quantity' => $displayQty,
                'items_remaining' => $isBox ? $inventory->getTotalItems() : null,
            ];

            return response()->json([
                'success' => true,
                'inventory' => $inventoryData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory item'
            ], 404);
        }
    }

    /**
     * Get inventory usage report (OUT logs).
     */
    public function usageReport(Request $request)
    {
        try {
            $from = $request->query('from');
            $to = $request->query('to');

            $query = InventoryLog::with(['medicine.category', 'inventory.unit'])
                ->whereRaw('LOWER(type) = ?', ['out'])
                ->orderByDesc('created_at');

            if ($from) {
                $query->whereDate('created_at', '>=', $from);
            }

            if ($to) {
                $query->whereDate('created_at', '<=', $to);
            }

            $logs = $query->get();

            $rows = $logs->map(function ($log) {
                $medicine = $log->medicine;
                $inventory = $log->inventory;
                $isVialUsage = $inventory?->isVial() ?? false;
                $isBoxUsage = $inventory?->isBox() ?? false;
                $usedQty = abs((float) $log->change_qty);
                $volumePerVial = (float) ($inventory?->volume_ml ?? 0);
                $usedQtyDisplay = $usedQty;
                
                // Use the stored unit_name from the log (most accurate)
                $unitLabel = $log->unit_name ?? $inventory?->unit?->name ?? 'unit';

                if ($isVialUsage && $volumePerVial > 0) {
                    // Logs store vial usage in ml; convert back to vial fraction for report unit consistency.
                    $usedQtyDisplay = round($usedQty / $volumePerVial, 3);
                }
                
                // For boxes, ensure we show "items" (should already be correct from migration)
                if ($isBoxUsage) {
                    $unitLabel = 'items';
                }

                return [
                    'id' => $log->id,
                    'medicine_name' => $medicine?->name ?? 'Unknown medicine',
                    'category' => $medicine?->category?->name ?? 'Uncategorized',
                    'used_qty' => $usedQtyDisplay,
                    'used_ml' => $isVialUsage ? $usedQty : null,
                    'unit' => $unitLabel,
                    'date' => optional($log->created_at)->format('Y-m-d'),
                    'time' => optional($log->created_at)->format('h:i A'),
                    'created_at' => optional($log->created_at)->toDateTimeString(),
                ];
            });

            return response()->json([
                'success' => true,
                'report' => $rows,
                'summary' => [
                    'total_transactions' => $rows->count(),
                    'total_items_used' => $rows->sum('used_qty'),
                    'unique_medicines' => $rows->pluck('medicine_name')->unique()->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch usage report: ' . $e->getMessage(),
            ], 500);
        }
    }
}
