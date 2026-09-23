export type PetColorOption = {
  id: string;
  label: string; 
  hex: string;
};

export const PET_COLOR_OPTIONS: PetColorOption[] = [
  { id: 'green', label: 'Зелёный', hex: '#2E7D32' },
  { id: 'brown', label: 'Коричневый', hex: '#6D4C41' },
  { id: 'orange', label: 'Оранжевый', hex: '#F57C00' },
  { id: 'magenta', label: 'Малиновый', hex: '#C2185B' },
  { id: 'purple', label: 'Фиолетовый', hex: '#512DA8' },
];