import { describe, expect, it } from 'vitest'
import { isCompleteCnj, maskCnj } from '../cnj'

describe('maskCnj', () => {
  it.each([
    ['', ''],
    ['1234567', '1234567'],
    ['12345678', '1234567-8'],
    ['1234567891', '1234567-89.1'],
    ['12345678920248260100', '1234567-89.2024.8.26.0100'],
    ['1234567-89.2024.8.26.0100', '1234567-89.2024.8.26.0100'],
    ['123456789202482601009999', '1234567-89.2024.8.26.0100'], // corta excesso
    ['abc12', '12'],
  ])('%s → %s', (input, expected) => {
    expect(maskCnj(input)).toBe(expected)
  })
})

describe('isCompleteCnj', () => {
  it('exige 20 dígitos', () => {
    expect(isCompleteCnj('1234567-89.2024.8.26.0100')).toBe(true)
    expect(isCompleteCnj('1234567-89.2024')).toBe(false)
  })
})
