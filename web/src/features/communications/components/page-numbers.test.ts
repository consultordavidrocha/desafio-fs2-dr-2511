import { describe, expect, it } from 'vitest'
import { pageNumbers } from './page-numbers'

describe('pageNumbers', () => {
  it.each([
    [1, 1, [1]],
    [1, 2, [1, 2]],
    [1, 5, [1, 2, 'gap', 5]],
    [3, 5, [1, 2, 3, 4, 5]],
    [6, 20, [1, 'gap', 5, 6, 7, 'gap', 20]],
    [20, 20, [1, 'gap', 19, 20]],
  ])('página %i de %i', (page, total, expected) => {
    expect(pageNumbers(page, total)).toEqual(expected)
  })
})
