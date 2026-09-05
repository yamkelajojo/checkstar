<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:8',
            'fulfilment_method' => 'nullable|in:delivery,pickup',
            // Delivery needs a destination for dispatch; pickup needs the
            // store the customer will collect from. The coordinates back the
            // address (checkout resolves the fulfilment store from them).
            'store_id' => 'required_if:fulfilment_method,pickup|nullable|integer|exists:stores,id',
            'delivery_address' => 'required_unless:fulfilment_method,pickup|nullable|string|max:500',
            'delivery_latitude' => 'required_unless:fulfilment_method,pickup|nullable|numeric|between:-90,90',
            'delivery_longitude' => 'required_unless:fulfilment_method,pickup|nullable|numeric|between:-180,180',
            'delivery_notes' => 'nullable|string|max:1000',
            'payment_method' => 'nullable|in:cash_on_delivery',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'At least one item is required.',
            'items.min' => 'At least one item is required.',
            'items.*.product_id.required' => 'Each item must reference a product.',
            'items.*.product_id.exists' => 'One or more products are not available.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be at least 1.',
            'items.*.quantity.max' => 'Maximum quantity per item is 8.',
            'delivery_address.required' => 'Delivery address is required.',
            'delivery_address.max' => 'Delivery address must not exceed 500 characters.',
            'delivery_latitude.required' => 'Delivery latitude is required.',
            'delivery_latitude.between' => 'Delivery latitude must be between -90 and 90.',
            'delivery_longitude.required' => 'Delivery longitude is required.',
            'delivery_longitude.between' => 'Delivery longitude must be between -180 and 180.',
            'delivery_notes.max' => 'Delivery notes must not exceed 1000 characters.',
            'payment_method.in' => 'The only accepted payment method is cash on delivery.',
            'fulfilment_method.in' => 'Fulfilment must be either delivery or pickup.',
            'store_id.required_if' => 'Please choose a store for pickup.',
            'store_id.exists' => 'The selected store does not exist.',
        ];
    }
}
