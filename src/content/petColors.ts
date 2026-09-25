export type PetColorId =
  | 'green'
  | 'brown'
  | 'orange'
  | 'magenta'
  | 'purple';

export type PetColorOption = {
  id: PetColorId;
  label: string;
  hex: string;
};

/**
 * Цвета взяты прямо из макетов 412×917.
 * Порядок тоже совпадает с экраном выбора цвета.
 */
export const PET_COLOR_OPTIONS: readonly PetColorOption[] = [
  { id: 'green', label: 'Зелёный', hex: '#005511' },
  { id: 'brown', label: 'Коричневый', hex: '#6F422B' },
  { id: 'orange', label: 'Оранжевый', hex: '#F16800' },
  { id: 'magenta', label: 'Малиновый', hex: '#A40063' },
  { id: 'purple', label: 'Фиолетовый', hex: '#2F009E' },
];