import {
  getServiceTypeLabel,
  serviceTypeSynonyms,
  serviceTypes
} from '../domain/serviceTypes.js';

export function formatServiceTypes(): string {
  const lines = serviceTypes.map((serviceType) => {
    const label = getServiceTypeLabel(serviceType);
    const synonyms = serviceTypeSynonyms[serviceType].filter(
      (synonym) => synonym !== label.toLocaleLowerCase('ru-RU')
    );
    const suffix = synonyms.length > 0 ? `: ${synonyms.join(', ')}` : '';

    return `- ${label}${suffix}`;
  });

  return [
    'Типы обслуживания:',
    ...lines,
    '',
    'Примеры:',
    '/service масло 6200 пробег 126000 след 8000',
    '/service тормозная жидкость 1200 след 24 месяца'
  ].join('\n');
}
