export type Lang = 'en' | 'bn';

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'bn', label: 'বাংলা', short: 'BN' },
];

type Dict = Record<string, string>;

export const translations: Record<Lang, Dict> = {
  en: {
    // Header / Nav
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.search.placeholder': 'Search for products, brands and more...',
    'nav.search.placeholder.short': 'Search products...',
    'nav.cart': 'Cart',
    'nav.menu.toggle': 'Toggle menu',
    'nav.logoAria': 'NexCart home',

    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign up',
    'auth.signOut': 'Sign out',
    'auth.loggedOut': 'Logged out',
    'auth.logoutFailed': 'Logout failed',

    // Profile menu
    'profile.myOrders': 'My Orders',
    'profile.myCart': 'My Cart',
    'profile.adminDashboard': 'Admin Dashboard',

    // Home — hero
    'home.hero.badge': 'New season, new arrivals',
    'home.hero.title.prefix': 'Shop smarter at',
    'home.hero.title.brand': 'NexCart',
    'home.hero.subtitle':
      'Your premium eCommerce destination. Discover curated collections, unbeatable prices, and a checkout experience built for the modern web.',
    'home.hero.cta.shop': 'Shop Now',
    'home.hero.cta.browse': 'Browse Categories',

    // Home — features
    'home.feature.shipping.title': 'Free shipping',
    'home.feature.shipping.desc':
      'On every order over $50, delivered fast to your door.',
    'home.feature.secure.title': 'Secure checkout',
    'home.feature.secure.desc':
      'Stripe-powered payments with end-to-end encryption.',
    'home.feature.curated.title': 'Curated catalog',
    'home.feature.curated.desc':
      'Hand-picked products across the categories you love.',

    // Cart
    'cart.continueShopping': 'Continue Shopping',
    'cart.title': 'Shopping Cart',
    'cart.signInPrompt': 'Please sign in to view your cart',
    'cart.signInDesc':
      'You need to be logged in to access your shopping cart.',
    'cart.signIn': 'Sign In',
    'cart.empty.title': 'Your cart is empty',
    'cart.empty.desc': 'Add some products to get started.',
    'cart.empty.cta': 'Browse Products',
    'cart.itemsCount': 'Cart Items ({count})',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.item.each': 'each',
    'cart.item.noImg': 'No img',
    'cart.toast.updated': 'Cart updated',
    'cart.toast.removed': 'Item removed from cart',
    'cart.toast.outOfStock': 'Not enough stock available',

    // Checkout
    'checkout.backToCart': 'Back to Cart',
    'checkout.title': 'Checkout',
    'checkout.summary': 'Order Summary',
    'checkout.qty': 'Qty',
    'checkout.shippingAddress': 'Shipping Address',
    'checkout.street': 'Street Address',
    'checkout.city': 'City',
    'checkout.state': 'State',
    'checkout.zip': 'ZIP Code',
    'checkout.country': 'Country',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.payment.title': 'Secure Payment with Stripe',
    'checkout.payment.desc':
      "You will be redirected to Stripe's secure checkout page",
    'checkout.processing': 'Processing...',
    'checkout.proceed': 'Proceed to Payment',
    'checkout.toast.failed': 'Failed to create checkout session',
    'checkout.toast.error': 'An error occurred during checkout',

    // Footer
    'footer.section.shop': 'Shop',
    'footer.section.quickLinks': 'Quick Links',
    'footer.section.support': 'Customer Support',
    'footer.shop.all': 'All Products',
    'footer.shop.electronics': 'Electronics',
    'footer.shop.clothing': 'Clothing',
    'footer.shop.books': 'Books',
    'footer.shop.home': 'Home & Living',
    'footer.quick.home': 'Home',
    'footer.quick.cart': 'My Cart',
    'footer.quick.orders': 'My Orders',
    'footer.quick.signIn': 'Sign In',
    'footer.quick.create': 'Create Account',
    'footer.support.help': 'Help Center',
    'footer.support.shipping': 'Shipping & Delivery',
    'footer.support.returns': 'Returns & Refunds',
    'footer.support.tracking': 'Order Tracking',
    'footer.support.contact': 'Contact Us',
    'footer.brand.tagline':
      'Your premium destination for curated products. Fast shipping, secure checkout, and a shopping experience built for the modern web.',
    'footer.newsletter.title': 'Stay in the loop',
    'footer.newsletter.desc':
      'Get exclusive offers and new arrivals straight to your inbox.',
    'footer.newsletter.placeholder': 'you@example.com',
    'footer.newsletter.subscribe': 'Subscribe',
    'footer.copyright': '© {year} NexCart. All rights reserved.',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Service',
    'footer.legal.cookies': 'Cookies',

    // Language toggle
    'lang.toggle.aria': 'Switch language',
  },

  bn: {
    // Header / Nav
    'nav.home': 'হোম',
    'nav.products': 'প্রোডাক্ট',
    'nav.categories': 'ক্যাটাগরি',
    'nav.search.placeholder': 'প্রোডাক্ট, ব্র্যান্ড বা আরও কিছু খুঁজুন...',
    'nav.search.placeholder.short': 'প্রোডাক্ট খুঁজুন...',
    'nav.cart': 'কার্ট',
    'nav.menu.toggle': 'মেনু খুলুন/বন্ধ করুন',
    'nav.logoAria': 'NexCart হোম',

    // Auth
    'auth.login': 'লগইন',
    'auth.signup': 'সাইন আপ',
    'auth.signOut': 'লগ আউট',
    'auth.loggedOut': 'লগ আউট হয়েছে',
    'auth.logoutFailed': 'লগ আউট করা যায়নি',

    // Profile menu
    'profile.myOrders': 'আমার অর্ডার',
    'profile.myCart': 'আমার কার্ট',
    'profile.adminDashboard': 'অ্যাডমিন ড্যাশবোর্ড',

    // Home — hero
    'home.hero.badge': 'নতুন সিজন, নতুন কালেকশন',
    'home.hero.title.prefix': 'স্মার্ট কেনাকাটা শুরু করুন',
    'home.hero.title.brand': 'NexCart-এ',
    'home.hero.subtitle':
      'আপনার প্রিমিয়াম অনলাইন শপিং ঠিকানা। বাছাই করা কালেকশন, অসাধারণ দাম আর আধুনিক ওয়েবের জন্য তৈরি স্মুথ চেকআউট অভিজ্ঞতা।',
    'home.hero.cta.shop': 'এখনই কিনুন',
    'home.hero.cta.browse': 'ক্যাটাগরি দেখুন',

    // Home — features
    'home.feature.shipping.title': 'ফ্রি ডেলিভারি',
    'home.feature.shipping.desc':
      '৫০ ডলারের উপরের প্রতিটি অর্ডারে দ্রুত ডেলিভারি, একদম আপনার দরজায়।',
    'home.feature.secure.title': 'নিরাপদ চেকআউট',
    'home.feature.secure.desc':
      'এন্ড-টু-এন্ড এনক্রিপশনসহ Stripe-এর নিরাপদ পেমেন্ট সিস্টেম।',
    'home.feature.curated.title': 'বাছাই করা কালেকশন',
    'home.feature.curated.desc':
      'আপনার পছন্দের সব ক্যাটাগরির হাতে বেছে নেওয়া প্রোডাক্ট।',

    // Cart
    'cart.continueShopping': 'শপিং চালিয়ে যান',
    'cart.title': 'শপিং কার্ট',
    'cart.signInPrompt': 'কার্ট দেখতে আগে লগইন করুন',
    'cart.signInDesc':
      'কার্ট ব্যবহার করতে হলে আপনাকে লগইন করতে হবে।',
    'cart.signIn': 'লগইন করুন',
    'cart.empty.title': 'আপনার কার্ট খালি',
    'cart.empty.desc': 'শুরু করতে কিছু প্রোডাক্ট যোগ করুন।',
    'cart.empty.cta': 'প্রোডাক্ট দেখুন',
    'cart.itemsCount': 'কার্টে আছে ({count}টি)',
    'cart.total': 'মোট',
    'cart.checkout': 'চেকআউটে যান',
    'cart.item.each': 'প্রতিটি',
    'cart.item.noImg': 'ছবি নেই',
    'cart.toast.updated': 'কার্ট আপডেট হয়েছে',
    'cart.toast.removed': 'কার্ট থেকে সরানো হয়েছে',
    'cart.toast.outOfStock': 'পর্যাপ্ত স্টক নেই',

    // Checkout
    'checkout.backToCart': 'কার্টে ফিরে যান',
    'checkout.title': 'চেকআউট',
    'checkout.summary': 'অর্ডার সারসংক্ষেপ',
    'checkout.qty': 'পরিমাণ',
    'checkout.shippingAddress': 'ডেলিভারি ঠিকানা',
    'checkout.street': 'রাস্তার ঠিকানা',
    'checkout.city': 'শহর',
    'checkout.state': 'রাজ্য/বিভাগ',
    'checkout.zip': 'জিপ কোড',
    'checkout.country': 'দেশ',
    'checkout.paymentMethod': 'পেমেন্ট মেথড',
    'checkout.payment.title': 'Stripe-এর নিরাপদ পেমেন্ট',
    'checkout.payment.desc':
      'আপনাকে Stripe-এর নিরাপদ চেকআউট পেজে নিয়ে যাওয়া হবে',
    'checkout.processing': 'প্রসেস হচ্ছে...',
    'checkout.proceed': 'পেমেন্টে এগিয়ে যান',
    'checkout.toast.failed': 'চেকআউট সেশন তৈরি করা যায়নি',
    'checkout.toast.error': 'চেকআউটে সমস্যা হয়েছে',

    // Footer
    'footer.section.shop': 'শপ',
    'footer.section.quickLinks': 'দ্রুত লিংক',
    'footer.section.support': 'কাস্টমার সাপোর্ট',
    'footer.shop.all': 'সব প্রোডাক্ট',
    'footer.shop.electronics': 'ইলেকট্রনিক্স',
    'footer.shop.clothing': 'পোশাক',
    'footer.shop.books': 'বই',
    'footer.shop.home': 'হোম ও লিভিং',
    'footer.quick.home': 'হোম',
    'footer.quick.cart': 'আমার কার্ট',
    'footer.quick.orders': 'আমার অর্ডার',
    'footer.quick.signIn': 'লগইন',
    'footer.quick.create': 'অ্যাকাউন্ট খুলুন',
    'footer.support.help': 'হেল্প সেন্টার',
    'footer.support.shipping': 'শিপিং ও ডেলিভারি',
    'footer.support.returns': 'রিটার্ন ও রিফান্ড',
    'footer.support.tracking': 'অর্ডার ট্র্যাকিং',
    'footer.support.contact': 'যোগাযোগ করুন',
    'footer.brand.tagline':
      'বাছাই করা প্রোডাক্টের জন্য আপনার প্রিমিয়াম ঠিকানা। দ্রুত শিপিং, নিরাপদ চেকআউট আর আধুনিক ওয়েবের জন্য তৈরি শপিং অভিজ্ঞতা।',
    'footer.newsletter.title': 'আপডেট পেতে কানেক্টেড থাকুন',
    'footer.newsletter.desc':
      'এক্সক্লুসিভ অফার আর নতুন প্রোডাক্ট সরাসরি আপনার ইনবক্সে।',
    'footer.newsletter.placeholder': 'you@example.com',
    'footer.newsletter.subscribe': 'সাবস্ক্রাইব',
    'footer.copyright': '© {year} NexCart। সর্বস্বত্ব সংরক্ষিত।',
    'footer.legal.privacy': 'প্রাইভেসি পলিসি',
    'footer.legal.terms': 'টার্মস অফ সার্ভিস',
    'footer.legal.cookies': 'কুকিজ',

    // Language toggle
    'lang.toggle.aria': 'ভাষা পরিবর্তন করুন',
  },
};

export type TranslationKey = keyof (typeof translations)['en'];
