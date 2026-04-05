import { useState, useCallback } from 'react';
import * as api from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';

/**
 * @param {object | null} user - auth user for Razorpay prefill
 */
export function useRazorpayCheckout(user) {
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState(null);

  const startCheckout = useCallback(
    async (test, { onVerified } = {}) => {
      setMessage(null);
      setPayingId(test._id);
      try {
        await loadRazorpayScript();
        const order = await api.createPaymentOrder(test._id);

        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Quizzer',
          description: order.title || test.title,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                mockTestId: test._id,
              });
              setMessage('Payment successful! You can start the test now.');
              onVerified?.();
            } catch (err) {
              console.error(err);
              setMessage(
                err.response?.data?.message ||
                  'Verification failed. Contact support if money was debited.'
              );
            } finally {
              setPayingId(null);
            }
          },
          prefill: {
            email: user?.email || '',
            name: [user?.fullname?.firstName, user?.fullname?.lastName].filter(Boolean).join(' ') || '',
          },
          theme: { color: '#2563eb' },
          modal: {
            ondismiss: () => setPayingId(null),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (failResponse) => {
          setPayingId(null);
          setMessage(failResponse?.error?.description || 'Payment failed. Try again or use another method.');
        });
        rzp.open();
      } catch (error) {
        console.error(error);
        setPayingId(null);
        const msg =
          error.response?.data?.message ||
          (error.message === 'Could not load Razorpay checkout'
            ? 'Could not load payment widget. Check your network.'
            : 'Could not start payment.');
        setMessage(msg);
      }
    },
    [user]
  );

  return { startCheckout, payingId, message, setMessage };
}
