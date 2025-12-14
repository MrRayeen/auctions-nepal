"use client"

import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useState, useEffect } from "react"
import "leaflet/dist/leaflet.css"

// Fix default marker icon (Next.js quirk)
const DefaultIcon = L.icon({
  iconUrl: "/marker-icon.svg",
  shadowUrl: "/marker-shadow.svg",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

const RADIUS = 300 // 1km approx area

function LocationHandler({ onSelect, disabled }: { onSelect: (latlng: L.LatLng) => void, disabled?: boolean }) {
  useMapEvents({
    click(e) {
      if (!disabled) onSelect(e.latlng)
    },
  })
  return null
}

export interface LocationData {
  lat: number
  lng: number
  area: string
  city: string
  display: string
}

interface LocationPickerMapProps {
  onLocationSelect?: (location: LocationData) => void
  onLocationChange?: (location: LocationData) => void
  disabled?: boolean
  initialLocation?: LocationData | null
}

export default function LocationPickerMap({ onLocationSelect, onLocationChange, disabled, initialLocation }: LocationPickerMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [mapRef, setMapRef] = useState<any>(null)

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true)
    if (initialLocation) {
      setPosition(L.latLng(initialLocation.lat, initialLocation.lng))
    }
  }, [initialLocation])

  // Center map when position changes
  useEffect(() => {
    if (mapRef && position) {
      mapRef.flyTo(position, 15, { duration: 1 })
    }
  }, [position, mapRef])

  async function handleSelect(latlng: L.LatLng) {
    setPosition(latlng)

    try {
      // Reverse geocode using Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
        {
          headers: {
            "User-Agent": "Nepal-Auction-Website"
          }
        }
      )
      const data = await res.json()

      const area =
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.village ||
        data.address?.county ||
        ""

      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.municipality ||
        data.address?.state ||
        ""

      const locationData: LocationData = {
        lat: latlng.lat,
        lng: latlng.lng,
        area,
        city,
        display: `${area}, ${city}`.replace(/^,\s*/, ""),
      }

      const callback = onLocationSelect || onLocationChange
      if (callback) callback(locationData)
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      // Fallback if geocoding fails
      const locationData: LocationData = {
        lat: latlng.lat,
        lng: latlng.lng,
        area: "",
        city: "",
        display: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
      }
      const callback = onLocationSelect || onLocationChange
      if (callback) callback(locationData)
    }
  }

  if (!isClient) {
    return (
      <div style={{ height: "350px", width: "100%", background: "#f0f0f0" }}>
        Loading map...
      </div>
    )
  }

  return (
    <MapContainer
      ref={setMapRef}
      center={[27.7172, 85.324]}
      zoom={13}
      style={{ height: "350px", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationHandler onSelect={handleSelect} disabled={disabled} />

      {position && (
        <>
          <Marker position={position} />
          <Circle
            center={position}
            radius={RADIUS}
            pathOptions={{ fillOpacity: 0.2 }}
          />
        </>
      )}
    </MapContainer>
  )
}
