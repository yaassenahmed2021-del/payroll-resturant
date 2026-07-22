import { kv } from './_kv.js';

// نفس القيمة الموجودة في باقي ملفات الـ API لهذا البرنامج
const APP_NAME = 'payroll_b5otbv_v1';

/**
 * Endpoint إداري لمسح كل سجلات "التجربة المجانية" لكل الأجهزة دفعة واحدة.
 * لا يمسح تراخيص التفعيل الدائمة (license:*) ولا ربط الجهاز بالمفتاح
 * (device:*) - بيمسح فقط مفاتيح trial:<APP_NAME>:* .
 *
 * الحماية: لازم تبعت { secret: "..." } في جسم الطلب، ويطابق متغير البيئة
 * ADMIN_SECRET المضبوط في إعدادات المشروع على Vercel.
 *
 *   curl -X POST https://payroll-resturant.vercel.app/api/admin-reset-trials \
 *        -H "Content-Type: application/json" \
 *        -d '{"secret":"ضع_السر_هنا"}'
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(404).json({ success: false, message: 'Not Found' });
    }

    if (!process.env.ADMIN_SECRET) {
        return res.status(500).json({
            success: false,
            message: 'متغير البيئة ADMIN_SECRET غير مضبوط في إعدادات المشروع على Vercel.'
        });
    }

    const { secret } = req.body || {};
    if (!secret || secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ success: false, message: 'غير مصرح' });
    }

    const pattern = `trial:${APP_NAME}:*`;
    let deletedCount = 0;
    let cursor = 0;

    try {
        do {
            const [nextCursor, keys] = await kv.scan(cursor, { match: pattern, count: 200 });
            cursor = Number(nextCursor);
            if (keys && keys.length) {
                await kv.del(...keys);
                deletedCount += keys.length;
            }
        } while (cursor !== 0);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء المسح: ' + (err && err.message ? err.message : String(err))
        });
    }

    return res.status(200).json({ success: true, deletedCount });
}
