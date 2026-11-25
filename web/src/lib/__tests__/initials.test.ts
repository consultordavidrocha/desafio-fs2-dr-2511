import { describe, expect, it } from 'vitest'
import { getInitials } from '../initials'

describe('getInitials', () => {
  it.each([
    ['Carlos Nogueira', 'CN'],
    ['Amélia Mascarenhas Macedo', 'AM'],
    ['Lavínia de Jesus', 'LJ'],
    ['  maria   da silva  ', 'MS'],
    ['Ana', 'A'],
    ['élcio ramos', 'ÉR'],
    ['', ''],
    [undefined, ''],
  ])('%s → %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected)
  })
})
