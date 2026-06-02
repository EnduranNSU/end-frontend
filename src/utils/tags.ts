const TAG_MAP: Record<string, string> = {
  arms:        'Руки',
  back:        'Спина',
  bodyweight:  'Вес тела',
  chest:       'Грудь',
  core:        'Кор',
  'free-weight': 'Свободные веса',
  glutes:      'Ягодицы',
  hamstrings:  'Бицепс бедра',
  hinge:       'Шарнир',
  legs:        'Ноги',
  lower_back:  'Поясница',
  lunge:       'Выпады',
  machine:     'Тренажёр',
  pull:        'Тяга',
  push:        'Жим',
  quadriceps:  'Квадрицепс',
  shoulders:   'Плечи',
  squat:       'Приседания',
  stability:   'Стабилизация',
  upper_back:  'Верхняя спина',
}

export function tagLabel(tag: string): string {
  return TAG_MAP[tag] ?? tag
}

const DAY_MAP: Record<string, string> = {
  Mon: 'Пн',
  Tue: 'Вт',
  Wed: 'Ср',
  Thu: 'Чт',
  Fri: 'Пт',
  Sat: 'Сб',
  Sun: 'Вс',
}

export function dayLabel(day: string): string {
  return DAY_MAP[day] ?? day
}
