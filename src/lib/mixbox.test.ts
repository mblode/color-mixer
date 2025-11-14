import { describe, expect, it } from 'vitest'
import { hexToRgb, mixPigmentPair } from './mixbox'
import { pigmentPalette } from './pigments'

const getPigment = (id: string) => {
  const pigment = pigmentPalette.find((item) => item.id === id)
  if (!pigment) {
    throw new Error(`Pigment ${id} not found in palette`)
  }
  return pigment
}

describe('hexToRgb', () => {
  it('converts hex strings to RGB tuples', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#1a2b3c')).toEqual([26, 43, 60])
  })
})

describe('mixPigmentPair', () => {
  const yellow = getPigment('cadmium-yellow')
  const blue = getPigment('ultramarine-blue')

  it('returns null if either pigment is missing', () => {
    expect(mixPigmentPair(yellow, null, 50)).toBeNull()
    expect(mixPigmentPair(null, blue, 50)).toBeNull()
  })

  it('returns pigment B when ratio favors it completely', () => {
    const result = mixPigmentPair(yellow, blue, 0)
    expect(result?.hex).toBe('#190059')
  })

  it('leans toward pigment A as the ratio increases', () => {
    const result = mixPigmentPair(yellow, blue, 100)
    expect(result?.hex).toBe('#FEEC00')
  })

  it('produces a greenish tint for equal parts yellow and blue', () => {
    const result = mixPigmentPair(yellow, blue, 50)
    expect(result).not.toBeNull()
    const mix = result!
    expect(mix.rgb.length).toBe(3)
    expect(mix.rgb[1]).toBeGreaterThan(mix.rgb[0])
    expect(mix.rgb[1]).toBeGreaterThan(mix.rgb[2])
  })
})
