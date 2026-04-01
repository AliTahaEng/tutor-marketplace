export interface Coordinates {
  lat: number
  lng: number
}

export type QatarArea =
  | 'Doha'
  | 'Al Rayyan'
  | 'Al Wakra'
  | 'Al Khor'
  | 'Lusail'
  | 'Al Daayen'
  | 'Al Shamal'
  | 'Al Shahaniya'

export interface IMapProvider {
  geocode(address: string): Promise<Coordinates>
  reverseGeocode(coords: Coordinates): Promise<string>
  getAreaFromCoordinates(coords: Coordinates): Promise<QatarArea | null>
}
