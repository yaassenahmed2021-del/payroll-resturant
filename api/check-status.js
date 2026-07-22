import { kv } from './_kv.js';

// namespace جديد كلياً - مختلف عن أي نسخة سابقة، عشان أي بيانات قديمة
// (تجارب/تفعيلات) في نفس قاعدة الـ KV متأثرش على السيرفر ده ولا العكس.
// نفس القيمة لازم تكون مطابقة بالظبط في trial.js و verify.js.
const APP_NAME = 'payroll_b5otbv_v1';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(404).json({ isActivated: false, message: 'Not Found' });
    }

    const { deviceId } = req.body || {};

    if (!deviceId) {
        return res.status(400).json({ isActivated: false, message: 'معرّف الجهاز مفقود' });
    }

    const key = await kv.get(`device:${APP_NAME}:${deviceId}`);
    if (!key) {
        return res.status(200).json({ isActivated: false });
    }

    const record = await kv.get(`license:${APP_NAME}:${key}`);
    if (!record || record.revoked || record.deviceId !== deviceId) {
        return res.status(200).json({ isActivated: false });
    }

    return res.status(200).json({ isActivated: true });
}
