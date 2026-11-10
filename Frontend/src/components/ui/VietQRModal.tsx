import React from 'react';
import { VietQRPaymentCard } from './VietQRPaymentCard';
import type { IBankInfo } from '../../types';

export interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrUrl?: string;
  orderCode: string;
  transferCode?: string;
  transferMessage?: string;
  totalPrice: number;
  bankInfo?: IBankInfo;
  orderId?: string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  qrUrl,
  orderCode,
  transferCode,
  transferMessage,
  totalPrice,
  bankInfo,
  orderId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn motion-reduce:animate-none">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <VietQRPaymentCard
          orderCode={orderCode}
          transferCode={transferCode}
          transferMessage={transferMessage}
          totalPrice={totalPrice}
          qrUrl={qrUrl}
          bankInfo={bankInfo}
          orderId={orderId}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};

export default VietQRModal;
