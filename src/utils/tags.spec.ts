import { describe, it, expect } from 'vitest'
import { tagLabel, dayLabel } from './tags'

describe('tagLabel', () => {
  it('translates known tags', () => {
    expect(tagLabel('arms')).toBe('Руки')
    expect(tagLabel('chest')).toBe('Грудь')
    expect(tagLabel('legs')).toBe('Ноги')
    expect(tagLabel('squat')).toBe('Приседания')
    expect(tagLabel('shoulders')).toBe('Плечи')
    expect(tagLabel('core')).toBe('Кор')
    expect(tagLabel('pull')).toBe('Тяга')
    expect(tagLabel('push')).toBe('Жим')
  })

  it('returns original string for unknown tags', () => {
    expect(tagLabel('unknown_tag')).toBe('unknown_tag')
    expect(tagLabel('')).toBe('')
  })

  it('handles hyphenated tag', () => {
    expect(tagLabel('free-weight')).toBe('Свободные веса')
  })
})

describe('dayLabel', () => {
  it('translates all weekdays', () => {
    expect(dayLabel('Mon')).toBe('Пн')
    expect(dayLabel('Tue')).toBe('Вт')
    expect(dayLabel('Wed')).toBe('Ср')
    expect(dayLabel('Thu')).toBe('Чт')
    expect(dayLabel('Fri')).toBe('Пт')
    expect(dayLabel('Sat')).toBe('Сб')
    expect(dayLabel('Sun')).toBe('Вс')
  })

  it('returns original string for unknown day codes', () => {
    expect(dayLabel('XYZ')).toBe('XYZ')
    expect(dayLabel('')).toBe('')
  })
})
