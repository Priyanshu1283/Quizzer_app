let loadPromise = null;

export function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only load in the browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      loadPromise = null;
      resolve();
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Could not load Razorpay checkout'));
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}
