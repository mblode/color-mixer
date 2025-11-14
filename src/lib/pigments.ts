export type PigmentSlot = 'A' | 'B'

export interface PigmentPreset {
  id: string
  name: string
  hex: string
  mixboxPigment: string
  description: string
  family: 'primary' | 'earth' | 'neutral'
  temperature: 'warm' | 'cool' | 'neutral'
}

export type PigmentSelectionState = Record<PigmentSlot, PigmentPreset | null>

export const pigmentPalette: PigmentPreset[] = [
  {
    id: 'cadmium-yellow',
    name: 'Cadmium Yellow',
    hex: '#feec00',
    mixboxPigment: 'cadmium_yellow',
    description: 'Vibrant warm yellow used as a foundation for high-chroma mixes.',
    family: 'primary',
    temperature: 'warm',
  },
  {
    id: 'hansa-yellow',
    name: 'Hansa Yellow',
    hex: '#fcd300',
    mixboxPigment: 'hansa_yellow',
    description: 'Cool lemon yellow that leans green for sparkling secondary blends.',
    family: 'primary',
    temperature: 'cool',
  },
  {
    id: 'cadmium-red',
    name: 'Cadmium Red',
    hex: '#ff2702',
    mixboxPigment: 'cadmium_red',
    description: 'Punchy warm red ideal for oranges and sunset gradients.',
    family: 'primary',
    temperature: 'warm',
  },
  {
    id: 'quinacridone-magenta',
    name: 'Quinacridone Magenta',
    hex: '#80022e',
    mixboxPigment: 'quinacridone_magenta',
    description: 'Deep magenta that anchors violets and rich purples.',
    family: 'primary',
    temperature: 'cool',
  },
  {
    id: 'ultramarine-blue',
    name: 'Ultramarine Blue',
    hex: '#190059',
    mixboxPigment: 'ultramarine_blue',
    description: 'Classic warm blue for natural skies and desaturated mixes.',
    family: 'primary',
    temperature: 'warm',
  },
  {
    id: 'phthalo-blue',
    name: 'Phthalo Blue',
    hex: '#0d1b44',
    mixboxPigment: 'phthalo_blue',
    description: 'Cool high-tinting blue that shifts quickly toward greens.',
    family: 'primary',
    temperature: 'cool',
  },
  {
    id: 'phthalo-green',
    name: 'Phthalo Green',
    hex: '#003c32',
    mixboxPigment: 'phthalo_green',
    description: 'Intense cool green for jewel-toned blends.',
    family: 'primary',
    temperature: 'cool',
  },
  {
    id: 'sap-green',
    name: 'Sap Green',
    hex: '#6b9404',
    mixboxPigment: 'sap_green',
    description: 'Earthy neutralized green perfect for foliage studies.',
    family: 'earth',
    temperature: 'warm',
  },
  {
    id: 'burnt-sienna',
    name: 'Burnt Sienna',
    hex: '#7b4800',
    mixboxPigment: 'burnt_sienna',
    description: 'Go-to earth hue for skin tones and glazing shadows.',
    family: 'earth',
    temperature: 'warm',
  },
]

export const DEFAULT_PIGMENT_SELECTION: PigmentSelectionState = {
  A: pigmentPalette[0],
  B: pigmentPalette[4],
}

export const pigmentSlots: PigmentSlot[] = ['A', 'B']

export const otherSlot = (slot: PigmentSlot): PigmentSlot => (slot === 'A' ? 'B' : 'A')
