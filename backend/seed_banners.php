<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\BannerCreative;

$slides1 = [
    ['title'=>'Fresh Groceries, Delivered Fast','subtitle'=>'Durban\'s favourite supermarket — now online','ctaLabel'=>'Shop Now','url'=>'/products','bgType'=>'gradient','colors'=>['#EB6522','#F58220'],'pattern'=>'dots'],
    ['title'=>'Free Delivery on First Order','subtitle'=>'Use code WELCOME at checkout','ctaLabel'=>'Get Started','url'=>'/products','bgType'=>'gradient','colors'=>['#1B1816','#3D3530'],'pattern'=>'lines'],
    ['title'=>'Winter Warmers Sale','subtitle'=>'Up to 30% off selected items','ctaLabel'=>'View Specials','url'=>'/specials','bgType'=>'gradient','colors'=>['#2563EB','#1D4ED8'],'pattern'=>'circles'],
];

BannerCreative::create([
    'name'=>'Welcome to Checkstar',
    'store_id'=>1,
    'created_by'=>1,
    'slides'=>json_encode($slides1),
    'status'=>'published',
    'start_date'=>now()->subDays(7),
    'end_date'=>now()->addDays(60),
]);

$slides2 = [
    ['title'=>'Spring Into Savings','subtitle'=>'Fresh produce at unbeatable prices','ctaLabel'=>'Shop Fresh','url'=>'/products','bgType'=>'gradient','colors'=>['#16A34A','#15803D'],'pattern'=>'dots'],
    ['title'=>'Download the App','subtitle'=>'Shop, track, and save — all in one place','ctaLabel'=>'Get the App','url'=>'/about','bgType'=>'solid','colors'=>['#EB6522'],'pattern'=>'lines'],
];

BannerCreative::create([
    'name'=>'Spring Promo',
    'store_id'=>1,
    'created_by'=>1,
    'slides'=>json_encode($slides2),
    'status'=>'published',
    'start_date'=>now()->subDays(2),
    'end_date'=>now()->addDays(30),
]);

echo "Banners inserted.\n";
