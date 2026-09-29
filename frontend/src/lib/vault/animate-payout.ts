import gsap from 'gsap';

export function animateMultiplierCount(
  el: HTMLElement | null,
  from: number,
  to: number,
  duration = 0.85,
): Promise<void> {
  if (!el) return Promise.resolve();
  const obj = { v: from };
  return new Promise((resolve) => {
    gsap.to(obj, {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = `${obj.v.toFixed(2)}×`;
      },
      onComplete: resolve,
    });
  });
}

export function animateCurrencyCount(
  el: HTMLElement | null,
  from: number,
  to: number,
  duration = 0.65,
): Promise<void> {
  if (!el) return Promise.resolve();
  const obj = { v: from };
  return new Promise((resolve) => {
    gsap.to(obj, {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = obj.v.toFixed(2);
      },
      onComplete: resolve,
    });
  });
}
