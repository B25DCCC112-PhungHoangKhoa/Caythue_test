import type { Request, Response } from 'express';
import Order from '../models/Order.js';

interface SepayWebhookBody {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  code?: string | null;
  content?: string;
  transferType?: 'in' | 'out';
  description?: string;
  transferAmount?: number;
  referenceCode?: string;
  accumulated?: number;
}

export async function handleSepayPaymentWebhook(req: Request, res: Response): Promise<void> {
  try {
    const webhookKey = process.env.SEPAY_WEBHOOK_KEY?.trim();
    if (webhookKey) {
      const authHeader = (req.headers.authorization || (req.headers['x-api-key'] as string) || '').trim();
      // Support raw key or with "Apikey <key>" / "Bearer <key>" prefix
      const token = authHeader.replace(/^(Apikey|Bearer)\s+/i, '').trim();

      if (token !== webhookKey && authHeader !== webhookKey) {
        console.warn('[SePay Webhook] Unauthorized webhook attempt. Received header:', authHeader);
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
    }

    const payload: SepayWebhookBody = req.body || {};
    console.log('[SePay Webhook] Received payload:', JSON.stringify(payload));

    // Only process incoming money ('in')
    if (payload.transferType && payload.transferType.toLowerCase() === 'out') {
      console.log('[SePay Webhook] Ignored outgoing transfer');
      res.status(200).json({ success: true, message: 'Ignored outgoing transfer' });
      return;
    }

    const content = payload.content || '';
    const description = payload.description || '';
    const combinedText = `${content} ${description}`.trim();
    const transferAmount = Number(payload.transferAmount) || 0;

    // 1. Try finding transfer code / order code via regex or code field
    const candidates: string[] = [];
    if (payload.code) {
      candidates.push(payload.code.trim());
    }

    // Match NAP <code/orderCode> pattern (e.g. NAP d6yc33 or NAP CT8F2A19)
    const napMatches = combinedText.matchAll(/NAP\s*([a-zA-Z0-9]+)/gi);
    for (const match of napMatches) {
      if (match[1]) {
        candidates.push(match[1].trim());
      }
    }

    // Match CTxxxxxx pattern (orderCode)
    const ctMatches = combinedText.matchAll(/(CT[a-zA-Z0-9]{6,8})/gi);
    for (const match of ctMatches) {
      if (match[1]) {
        candidates.push(match[1].trim());
      }
    }

    let matchedOrder = null;

    // 2. Try candidate match first
    for (const code of candidates) {
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchedOrder = await Order.findOne({
        $or: [
          { transferCode: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { orderCode: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        ],
        paymentStatus: 'pending',
      });
      if (matchedOrder) break;
    }

    // 3. Fallback: Search all recent pending orders (within 7 days) and check text containment
    if (!matchedOrder) {
      const recentPendingOrders = await Order.find({
        paymentStatus: 'pending',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      const upperText = combinedText.toUpperCase();
      for (const order of recentPendingOrders) {
        const tCode = order.transferCode ? order.transferCode.toUpperCase() : '';
        const oCode = order.orderCode ? order.orderCode.toUpperCase() : '';

        if ((tCode && upperText.includes(tCode)) || (oCode && upperText.includes(oCode))) {
          matchedOrder = order;
          break;
        }
      }
    }

    if (!matchedOrder) {
      console.warn('[SePay Webhook] No matching pending order found for text:', combinedText);
      res.status(200).json({
        success: true,
        message: 'No matching pending order found, logged for review',
      });
      return;
    }

    // Check payment amount (allow transferAmount >= totalPrice)
    if (transferAmount > 0 && transferAmount < matchedOrder.totalPrice) {
      console.warn(
        `[SePay Webhook] Underpaid: expected ${matchedOrder.totalPrice}, received ${transferAmount} for order ${matchedOrder.orderCode}`
      );
      res.status(200).json({
        success: true,
        message: 'Underpaid transfer amount, pending manual resolution',
      });
      return;
    }

    // Mark as paid
    matchedOrder.paymentStatus = 'paid';
    if (matchedOrder.orderStatus === 'pending') {
      matchedOrder.orderStatus = 'in_progress';
    }

    // Append payment note
    const refCode = payload.referenceCode || payload.id || 'N/A';
    const payNote = `[SePay ${payload.gateway || 'Bank'} Ref: ${refCode} - ${transferAmount}đ]`;
    matchedOrder.accountInfo = matchedOrder.accountInfo || {
      inGameAccount: '',
      inGamePassword: '',
      inGameServer: 'VN',
      inGameName: '',
      contactPhone: '',
      note: '',
    };
    matchedOrder.accountInfo.note = matchedOrder.accountInfo.note
      ? `${matchedOrder.accountInfo.note} | ${payNote}`
      : payNote;

    await matchedOrder.save();

    console.log(
      `[SePay Webhook] Order ${matchedOrder.orderCode} successfully updated to 'paid' and 'in_progress'`
    );

    res.status(200).json({
      success: true,
      message: 'Payment processed and order updated successfully',
      orderCode: matchedOrder.orderCode,
    });
  } catch (error) {
    console.error('[SePay Webhook Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error processing webhook' });
  }
}