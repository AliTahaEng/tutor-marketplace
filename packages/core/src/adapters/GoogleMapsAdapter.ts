import { CircuitBreaker } from '../circuit-breaker/CircuitBreaker'
import type { IMapProvider, Coordinates, QatarArea } from '../interfaces/IMapProvider'

const QATAR_AREA_KEYWORDS: Record<QatarArea, string[]> = {
  'Doha': ['doha', 'ad dawhah'],
  'Al Rayyan': ['al rayyan', 'ar rayyan'],
  'Al Wakra': ['al wakra', 'al wakrah'],
  'Al Khor': ['al khor', 'al khawr'],
  'Lusail': ['lusail'],
  'Al Daayen': ['al daayen', 'ad daayen'],
  'Al Shamal': ['al shamal'],
  'Al Shahaniya': ['al shahaniya'],
}

interface GoogleMapsConfig {
  apiKey: string
}

export class GoogleMapsAdapter implements IMapProvider {
  private readonly apiKey: string
  private readonly cb: CircuitBreaker

  constructor(config: GoogleMapsConfig) {
    this.apiKey = config.apiKey
    this.cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 60_000 })
  }

  async geocode(address: string): Promise<Coordinates> {
    return this.cb.execute(async () => {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      const res = await fetch(url)
      const data = await res.json() as { results: Array<{ geometry: { location: { lat: number; lng: number } } }>; status: string }

      if (data.status !== 'OK' || !data.results[0]) {
        throw new Error(`Geocoding failed: ${data.status}`)
      }

      return data.results[0].geometry.location
    })
  }

  async reverseGeocode(coords: Coordinates): Promise<string> {
    return this.cb.execute(async () => {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${this.apiKey}`
      const res = await fetch(url)
      const data = await res.json() as { results: Array<{ formatted_address: string }>; status: string }

      if (data.status !== 'OK' || !data.results[0]) {
        throw new Error(`Reverse geocoding failed: ${data.status}`)
      }

      return data.results[0].formatted_address
    })
  }

  async getAreaFromCoordinates(coords: Coordinates): Promise<QatarArea | null> {
    const address = await this.reverseGeocode(coords)
    const lower = address.toLowerCase()

    for (const [area, keywords] of Object.entries(QATAR_AREA_KEYWORDS)) {
      if (keywords.some(k => lower.includes(k))) {
        return area as QatarArea
      }
    }

    return null
  }
}
