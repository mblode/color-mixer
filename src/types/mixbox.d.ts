declare module 'mixbox' {
  export interface MixboxAPI {
    lerp(
      color1: [number, number, number] | string,
      color2: [number, number, number] | string,
      t: number,
    ): [number, number, number]
    rgbToLatent(color: [number, number, number] | string): number[]
  }

  const mixbox: MixboxAPI
  export default mixbox
}
