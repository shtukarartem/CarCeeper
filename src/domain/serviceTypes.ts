export const serviceTypes = [
  'oil',
  'oil_filter',
  'air_filter',
  'cabin_filter',
  'fuel_filter',
  'brake_pads',
  'brake_discs',
  'spark_plugs',
  'tires',
  'battery',
  'timing_belt',
  'coolant',
  'brake_fluid',
  'other'
] as const;

export type ServiceType = (typeof serviceTypes)[number];

export const serviceTypeLabels: Record<ServiceType, string> = {
  oil: 'масло',
  oil_filter: 'масляный фильтр',
  air_filter: 'воздушный фильтр',
  cabin_filter: 'салонный фильтр',
  fuel_filter: 'топливный фильтр',
  brake_pads: 'тормозные колодки',
  brake_discs: 'тормозные диски',
  spark_plugs: 'свечи',
  tires: 'шины',
  battery: 'аккумулятор',
  timing_belt: 'ремень ГРМ',
  coolant: 'антифриз',
  brake_fluid: 'тормозная жидкость',
  other: 'прочее'
};

export const serviceTypeSynonyms: Record<ServiceType, string[]> = {
  oil: ['масло', 'замена масла'],
  oil_filter: ['масляный фильтр', 'масляный'],
  air_filter: ['воздушный фильтр', 'воздушный'],
  cabin_filter: ['салонный фильтр', 'салонный'],
  fuel_filter: ['топливный фильтр', 'топливный'],
  brake_pads: ['колодки', 'тормозные колодки'],
  brake_discs: ['диски', 'тормозные диски'],
  spark_plugs: ['свечи', 'свеча'],
  tires: ['шины', 'резина', 'колеса', 'колёса'],
  battery: ['аккумулятор', 'акб', 'батарея'],
  timing_belt: ['грм', 'ремень грм'],
  coolant: ['антифриз', 'охлаждающая жидкость'],
  brake_fluid: ['тормозная жидкость', 'тормозуха'],
  other: ['прочее', 'другое']
};

const synonymToServiceType = new Map<string, ServiceType>(
  Object.entries(serviceTypeSynonyms).flatMap(([serviceType, synonyms]) =>
    synonyms.map((synonym) => [normalizeServiceTypeText(synonym), serviceType as ServiceType])
  )
);

export function normalizeServiceTypeText(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function getServiceTypeLabel(serviceType: ServiceType): string {
  return serviceTypeLabels[serviceType];
}

export function detectServiceType(tokens: string[]): ServiceType {
  const normalizedTokens = tokens.map(normalizeServiceTypeText).filter(Boolean);

  for (const token of normalizedTokens) {
    const serviceType = synonymToServiceType.get(token);

    if (serviceType) {
      return serviceType;
    }
  }

  for (let index = 0; index < normalizedTokens.length - 1; index += 1) {
    const phrase = `${normalizedTokens[index]} ${normalizedTokens[index + 1]}`;
    const serviceType = synonymToServiceType.get(phrase);

    if (serviceType) {
      return serviceType;
    }
  }

  return 'other';
}
