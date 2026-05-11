import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

// Fix for default Leaflet icon path issues
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div id="trip-map" class="map-frame"></div>`,
  styles: [`
    .map-frame {
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
  `]
})
export class TripMapComponent implements AfterViewInit, OnChanges {
  @Input() origin: string = '';
  @Input() destination: string = '';
  @Input() nearbyDrivers: any[] = [];
  @Output() mapClicked = new EventEmitter<{lat: number, lng: number}>();

  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private polylines: L.Polyline[] = [];

  ngAfterViewInit(): void {
    this.initMap();
    // Invalidate size to fix tile rendering issues in Angular
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['origin'] || changes['destination'] || changes['nearbyDrivers'])) {
      this.updateMap();
    }
  }

  private initMap(): void {
    // Center in Lima, Peru for demo
    this.map = L.map('trip-map', { zoomControl: false }).setView([-12.0464, -77.0428], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClicked.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.updateMap();
  }

  private parseCoord(str: string, fallbackLat: number, fallbackLng: number): [number, number] {
    const parts = str.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return [fallbackLat, fallbackLng];
  }

  private updateMap(): void {
    if (!this.map) return;

    // Clear previous markers and lines
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.polylines.forEach(p => p.remove());
    this.polylines = [];

    let originCoord: [number, number] | null = null;
    let destCoord: [number, number] | null = null;

    if (this.origin) {
      originCoord = this.parseCoord(this.origin, -12.0464, -77.0428);
      const originMarker = L.marker(originCoord).bindPopup('Origen').addTo(this.map);
      this.markers.push(originMarker);
    }
    
    if (this.destination) {
      destCoord = this.parseCoord(this.destination, -12.0664, -77.0228);
      const destMarker = L.marker(destCoord).bindPopup('Destino').addTo(this.map);
      this.markers.push(destMarker);
    }

    if (originCoord && destCoord) {
      // Draw line between them
      const polyline = L.polyline([originCoord, destCoord], {color: '#1a73e8', weight: 4}).addTo(this.map);
      this.polylines.push(polyline);
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    // Add drivers
    this.nearbyDrivers.forEach(driver => {
      const driverIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:#1a73e8;width:12px;height:12px;border-radius:50%;border:2px solid white;'></div>`,
        iconSize: [16, 16]
      });
      const driverMarker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).bindPopup(driver.name).addTo(this.map!);
      this.markers.push(driverMarker);
    });
  }
}
