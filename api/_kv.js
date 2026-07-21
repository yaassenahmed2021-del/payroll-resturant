import { createClient } from '@vercel/kv';

// Vercel KV القديم اتلغى (deprecated)، ومحله دلوقتي تكامل Upstash Redis من
// Vercel Marketplace. المشكلة إن أسماء متغيرات البيئة ممكن تختلف حسب
// طريقة الربط:
//   - مشاريع قديمة اتنقلت تلقائياً: KV_REST_API_URL / KV_REST_API_TOKEN
//   - تكامل Upstash الجديد من الـ Marketplace: ممكن يجي باسم مختلف زي
//     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN، أو باسم مخصص
//     فيه بادئة (prefix) اسم التكامل نفسه.
//
// الحل هنا: نجرّب كل الاحتمالات المعروفة، وأول زوج (URL + TOKEN) موجود
// فعلاً في process.env هو اللي هيُستخدم. لو حابب تضيف اسم متغير مختلف
// شفته في إعدادات مشروعك على Vercel، زوّد اسمه في القائمة تحت.
const CANDIDATE_ENV_PAIRS = [
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['REDIS_REST_API_URL', 'REDIS_REST_API_TOKEN'],
];

function resolveCredentials() {
    for (const [urlKey, tokenKey] of CANDIDATE_ENV_PAIRS) {
        const url = process.env[urlKey];
        const token = process.env[tokenKey];
        if (url && token) {
            return { url, token, urlKey, tokenKey };
        }
    }
    return null;
}

const creds = resolveCredentials();

if (!creds) {
    // مفيش أي زوج متغيرات معروف موجود - هنسيب رسالة خطأ واضحة في اللوج
    // بدل ما الطلبات تفشل بصمت وترجع نتائج غلط (زي "التفعيل مش موجود").
    console.error(
        '[kv] لم يتم العثور على متغيرات بيئة قاعدة بيانات KV/Redis. ' +
        'تأكد من ربط تكامل Redis (Upstash) من Vercel Marketplace بالمشروع، ' +
        'أو أضف اسم المتغيرات الفعلي داخل server/_kv.js'
    );
}

export const kv = creds
    ? createClient({ url: creds.url, token: creds.token })
    : createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
