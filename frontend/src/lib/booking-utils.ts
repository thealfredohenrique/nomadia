const MS_PER_DAY = 86_400_000;
const SERVICE_FEE_RATE = 0.1;

export interface PriceBreakdown {
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

export function calculateBookingPrice(
  pricePerNight: number,
  cleaningFee: number,
  checkIn: string,
  checkOut: string,
): PriceBreakdown | null {
  if (!checkIn || !checkOut) return null;
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY,
  );
  if (nights <= 0) return null;
  const subtotal = pricePerNight * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return {
    nights,
    subtotal,
    cleaningFee,
    serviceFee,
    total: subtotal + cleaningFee + serviceFee,
  };
}
