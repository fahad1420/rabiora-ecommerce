// =====================================
// Rabiora Products Database
// data/product.js
// Part 1 (Dress 1 - Dress 8)
// =====================================

const products = [

{
    id: 1,
    name: "Guljee Inspired",
    price: 1500,
    oldPrice: 1800,
    discount: 17,
    cover: "img/dress1.jpg",
    gallery: [
        "img/dress1_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "কফি কালার",
    stock: true,
    featured: false,
    details: "জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। জামার গলাতে এমব্রয়ডারির কাজ করা থাকবে।"
},

{
    id: 2,
    name: "Premium Pakistani Three Piece",
    price: 1250,
    oldPrice: 1490,
    discount: 16,
    cover: "img/dress2.jpg",
    gallery: [
        "img/dress2_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। উন্নত মানের কাপড় ও আরামদায়ক ব্যবহার।"
},

{
    id: 3,
    name: "Premium Pakistani Three Piece",
    price: 1350,
    oldPrice: 1590,
    discount: 15,
    cover: "img/dress3.jpg",
    gallery: [],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক, স্টাইলিশ ডিজাইন এবং আরামদায়ক ফিট।"
},

{
    id: 4,
    name: "Premium Pakistani Zamzam Swiss Cotton",
    price: 1100,
    oldPrice: 1350,
    discount: 19,
    cover: "img/dress4.jpg",
    gallery: [
        "img/dress4_1.jpg",
        "img/dress4_2.jpg",
        "img/dress4_3.jpg",
        "img/dress4_4.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি জমজম সুইস কটন। জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি।"
},

{
    id: 5,
    name: "Premium Pakistani Three Piece",
    price: 1150,
    oldPrice: 1390,
    discount: 17,
    cover: "img/dress5.jpg",
    gallery: [],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক এবং আকর্ষণীয় ডিজাইন।"
},

{
    id: 6,
    name: "Premium Pakistani Zamzam Swiss Cotton",
    price: 1100,
    oldPrice: 1350,
    discount: 19,
    cover: "img/dress6.jpg",
    gallery: [
        "img/dress6_1.jpg",
        "img/dress6_2.jpg",
        "img/dress6_3.jpg",
        "img/dress6_4.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি জমজম সুইস কটন। জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি।"
},

{
    id: 7,
    name: "Premium Pakistani Three Piece",
    price: 1450,
    oldPrice: 1690,
    discount: 14,
    cover: "img/dress7.jpg",
    gallery: [],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক ও সুন্দর ডিজাইন।"
},

{
    id: 8,
    name: "Mashal",
    price: 1500,
    oldPrice: 1800,
    discount: 17,
    cover: "img/dress8.jpg",
    gallery: [
        "img/dress8_1.jpg",
        "img/dress8_2.jpg",
        "img/dress8_3.jpg",
        "img/dress8_4.jpg",
        "img/dress8_5.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। জামার নিচে, ওড়নার দুই সাইডে এবং স্লিভ পোরশনে সামনে কাট ওয়ার্ক করা থাকবে।"
},
{
    id: 9,
    name: "Premium Pakistani Three Piece",
    price: 1290,
    oldPrice: 1550,
    discount: 17,
    cover: "img/dress9.jpg",
    gallery: [
        "img/dress9_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। নান্দনিক ডিজাইন ও আরামদায়ক ব্যবহারের জন্য উপযোগী।"
},

{
    id: 10,
    name: "Premium Pakistani Three Piece",
    price: 1390,
    oldPrice: 1690,
    discount: 18,
    cover: "img/dress10.jpg",
    gallery: [
        "img/dress10_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক ও আকর্ষণীয় ডিজাইনের সমন্বয়।"
},

{
    id: 11,
    name: "Premium Pakistani Three Piece",
    price: 1450,
    oldPrice: 1750,
    discount: 17,
    cover: "img/dress11.jpg",
    gallery: [
        "img/dress11_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। নরম সুতি ফেব্রিক, সুন্দর ডিজাইন এবং আরামদায়ক ফিট।"
},

{
    id: 12,
    name: "Premium Pakistani Three Piece",
    price: 1590,
    oldPrice: 1890,
    discount: 16,
    cover: "img/dress12.jpg",
    gallery: [
        "img/dress12_1.jpg",
        "img/dress12_2.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক ও আধুনিক ডিজাইনের সমন্বয়।"
},

{
    id: 13,
    name: "Cotton Collection",
    price: 1650,
    oldPrice: 1950,
    discount: 15,
    cover: "img/dress13.jpg",
    gallery: [
        "img/dress13_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "সিদ্ধ জলপাই",
    stock: true,
    featured: false,
    details: "জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। জামা এবং ওড়নাতে ফুল সিকুয়েন্সের কাজ করা থাকবে।"
},

{
    id: 14,
    name: "Mashal",
    price: 1500,
    oldPrice: 1800,
    discount: 17,
    cover: "img/dress14.jpg",
    gallery: [
        "img/dress14_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "জামা, ওড়না, স্যালোয়ারের ফেব্রিক সুতি। জামার নিচে, ওড়নার দুই সাইডে এবং স্লিভ পোরশনে সামনে কাট ওয়ার্ক করা থাকবে।"
},

{
    id: 15,
    name: "Guljee Inspired",
    price: 1500,
    oldPrice: 1800,
    discount: 17,
    cover: "img/dress15.jpg",
    gallery: [
        "img/dress15_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। জামার গলাতে এমব্রয়ডারির কাজ করা থাকবে।"
},

{
    id: 16,
    name: "Premium Pakistani Three Piece",
    price: 1550,
    oldPrice: 1850,
    discount: 16,
    cover: "img/dress16.jpg",
    gallery: [
        "img/dress16_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক ও চমৎকার ডিজাইনের সমন্বয়।"
},{
    id: 17,
    name: "Premium Pakistani Three Piece",
    price: 1450,
    oldPrice: 1750,
    discount: 17,
    cover: "img/dress17.jpg",
    gallery: [
        "img/dress17_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। জামা, ওড়না ও স্যালোয়ারের ফেব্রিক সুতি। আরামদায়ক এবং স্টাইলিশ ডিজাইন।"
},

{
    id: 18,
    name: "Premium Pakistani Three Piece",
    price: 1590,
    oldPrice: 1890,
    discount: 16,
    cover: "img/dress18.jpg",
    gallery: [
        "img/dress18_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক ও আকর্ষণীয় ডিজাইন।"
},

{
    id: 19,
    name: "Premium Pakistani Three Piece",
    price: 1650,
    oldPrice: 1950,
    discount: 15,
    cover: "img/dress19.jpg",
    gallery: [
        "img/dress19_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। নান্দনিক ডিজাইন ও আরামদায়ক ফেব্রিক।"
},

{
    id: 20,
    name: "Premium Pakistani Three Piece",
    price: 1390,
    oldPrice: 1650,
    discount: 16,
    cover: "img/dress20.jpg",
    gallery: [
        "img/dress20_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: false,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। দৈনন্দিন ও বিশেষ অনুষ্ঠানের জন্য উপযোগী।"
},

{
    id: 21,
    name: "Premium Pakistani Three Piece",
    price: 1550,
    oldPrice: 1850,
    discount: 16,
    cover: "img/dress21.jpg",
    gallery: [
        "img/dress21_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক ও সুন্দর ডিজাইন।"
},

{
    id: 22,
    name: "Premium Pakistani Three Piece",
    price: 1490,
    oldPrice: 1790,
    discount: 17,
    cover: "img/dress22.jpg",
    gallery: [
        "img/dress22_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। এলিগ্যান্ট লুক ও আরামদায়ক ফেব্রিক।"
},

{
    id: 23,
    name: "Premium Pakistani Three Piece",
    price: 1590,
    oldPrice: 1890,
    discount: 16,
    cover: "img/dress23.jpg",
    gallery: [
        "img/dress23_1.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। নান্দনিক ডিজাইন ও উন্নত মানের সুতি ফেব্রিক।"
},

{
    id: 24,
    name: "Premium Pakistani Three Piece",
    price: 1750,
    oldPrice: 2100,
    discount: 17,
    cover: "img/dress24.jpg",
    gallery: [
        "img/dress24_1.jpg",
        "img/dress24_2.jpg",
        "img/dress24_3.jpg"
    ],
    category: "Pakistani Three Piece",
    fabric: "সুতি",
    color: "ছবির মতো",
    stock: true,
    featured: true,
    details: "প্রিমিয়াম পাকিস্তানি থ্রি পিস। উন্নত মানের সুতি ফেব্রিক, প্রিমিয়াম ফিনিশিং এবং আধুনিক ডিজাইনের সমন্বয়।"
}

];