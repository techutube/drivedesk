export interface CalculationParams {
  basePrice: number; // For now derived from ex-showroom backwards
  carLengthMeters?: number;
  engineCapacityCC?: number;
  fuelType: string;
  isSUV?: boolean;
  registrationCharges?: number; // Optional override
  insuranceRate?: number; // Percentage, e.g. 0.035 for 3.5%
  accessoriesTotal?: number;
  handlingCharges?: number;
  extendedWarranty?: number;
  fastagCharges?: number;
  dealerDiscount?: number;
  exchangeBonus?: number;
  corporateDiscount?: number;
  specialDiscount?: number;
}

export interface CalculationResult {
  basePrice: number;
  gstRate: number;
  gstAmount: number;
  cessRate: number;
  cessAmount: number;
  exShowroomPrice: number;
  rtoAmount: number;
  insuranceAmount: number;
  accessoriesTotal: number;
  handlingCharges: number;
  extendedWarranty: number;
  fastagCharges: number;
  subtotal: number;
  totalDiscount: number;
  finalOnRoadPrice: number;
}

export const calculateOnRoadPrice = (params: CalculationParams): CalculationResult => {
  const {
    basePrice,
    carLengthMeters = 0,
    engineCapacityCC = 0,
    fuelType,
    isSUV = false,
    registrationCharges,
    insuranceRate = 0.035, // Default 3.5%
    accessoriesTotal = 0,
    handlingCharges = 0,
    extendedWarranty = 0,
    fastagCharges = 550, // Default 550
    dealerDiscount = 0,
    exchangeBonus = 0,
    corporateDiscount = 0,
    specialDiscount = 0
  } = params;

  // 1. GST CALCULATION
  const gstRate = fuelType === 'EV' ? 0.05 : 0.28;
  const gstAmount = Math.round(basePrice * gstRate);

  // 2. COMPENSATION CESS CALCULATION
  let cessRate = 0;
  if (fuelType === 'EV') {
    cessRate = 0;
  } else if (carLengthMeters < 4 && engineCapacityCC <= 1200 && fuelType === 'Petrol') {
    cessRate = 0.01;
  } else if (carLengthMeters < 4 && engineCapacityCC <= 1500 && fuelType === 'Diesel') {
    cessRate = 0.03;
  } else if (carLengthMeters > 4 && !isSUV) {
    cessRate = 0.15;
  } else if (carLengthMeters > 4 && engineCapacityCC > 1500 && isSUV) {
    cessRate = 0.22;
  }

  const cessAmount = Math.round(basePrice * cessRate);

  // 3. EX-SHOWROOM PRICE
  const exShowroomPrice = Math.round(basePrice + gstAmount + cessAmount);

  // 4. RTO REGISTRATION CALCULATION
  let rtoRate = 0;
  
  if (fuelType === 'EV') {
    rtoRate = 0.02; // 2% for EV
  } else {
    // Petrol/Diesel Base Rates
    if (exShowroomPrice <= 600000) {
      rtoRate = 0.05; // 5% below 6L
    } else if (exShowroomPrice <= 1000000) {
      rtoRate = 0.10; // 10% between 6L-10L
    } else {
      rtoRate = 0.15; // 15% over 10L
    }
    
    // Apply 20% rebate for CNG
    if (fuelType === 'CNG') {
      rtoRate = rtoRate * 0.80; // 20% rebate
    }
  }

  // Calculate engine capacity based Registration Fee
  let fixedRegistrationFee = 1000;
  if (!engineCapacityCC || engineCapacityCC <= 1200) {
    fixedRegistrationFee = 1000;
  } else if (engineCapacityCC <= 1500) {
    fixedRegistrationFee = 3000;
  } else {
    fixedRegistrationFee = 5000;
  }
  
  const baseRTO = Math.round(exShowroomPrice * rtoRate);
  const otherFixedCharges = fixedRegistrationFee + 1500 + 400; // Registration + Hypothecation + HSRP
  
  let rtoAmount = registrationCharges ?? (baseRTO + otherFixedCharges); // Compute total RTO including fixed

  // 5. INSURANCE CALCULATION
  const insuranceAmount = Math.round(exShowroomPrice * (insuranceRate || 0.035));

  // 6. SUBTOTAL CALCULATION
  const subtotal =
    exShowroomPrice +
    rtoAmount +
    insuranceAmount +
    accessoriesTotal +
    handlingCharges +
    extendedWarranty +
    fastagCharges;

  // 7. DISCOUNT CALCULATION
  const totalDiscount =
    dealerDiscount +
    exchangeBonus +
    corporateDiscount +
    specialDiscount;

  // 8. FINAL ON-ROAD PRICE
  let finalOnRoadPrice = Math.round(subtotal - totalDiscount);
  if (finalOnRoadPrice < 0) {
    finalOnRoadPrice = 0;
  }

  return {
    basePrice: Math.round(basePrice),
    gstRate,
    gstAmount,
    cessRate,
    cessAmount,
    exShowroomPrice,
    rtoAmount,
    insuranceAmount,
    accessoriesTotal,
    handlingCharges,
    extendedWarranty,
    fastagCharges,
    subtotal,
    totalDiscount,
    finalOnRoadPrice
  };
};

/**
 * Utility to calculate backwards from Ex-Showroom to Base Price if Base Price is unknown.
 * Let Ex = Base + (Base * GST) + (Base * Cess)
 * Let Ex = Base * (1 + GST + Cess)
 * 
 * Then Base = Ex / (1 + GST + Cess)
 */
export const deriveBasePriceFromExShowroom = (
  exShowroomPrice: number,
  fuelType: string,
  carLengthMeters: number = 0,
  engineCapacityCC: number = 0,
  isSUV: boolean = false
) => {
  const gstRate = fuelType === 'EV' ? 0.05 : 0.28;
  
  let cessRate = 0;
  if (fuelType === 'EV') {
    cessRate = 0;
  } else if (carLengthMeters < 4 && engineCapacityCC <= 1200 && fuelType === 'Petrol') {
    cessRate = 0.01;
  } else if (carLengthMeters < 4 && engineCapacityCC <= 1500 && fuelType === 'Diesel') {
    cessRate = 0.03;
  } else if (carLengthMeters > 4 && !isSUV) {
    cessRate = 0.15;
  } else if (carLengthMeters > 4 && engineCapacityCC > 1500 && isSUV) {
    cessRate = 0.22;
  }

  const basePrice = exShowroomPrice / (1 + gstRate + cessRate);
  return Math.round(basePrice);
};
