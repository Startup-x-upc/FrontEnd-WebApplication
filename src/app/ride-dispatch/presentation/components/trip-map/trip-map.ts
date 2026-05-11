import { Component, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
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

  private map: L.Map | undefined;
  private markers: L.Marker[] = [];

  ngAfterViewInit(): void {
    this.initMap();
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

    this.updateMap();
  }

  private updateMap(): void {
    if (!this.map) return;

    // Clear previous markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    // Mock logic: Drop markers nearby based on strings
    if (this.origin) {
      const originMarker = L.marker([-12.0464, -77.0428]).bindPopup('Origen: ' + this.origin).addTo(this.map);
      this.markers.push(originMarker);
    }
    
    if (this.destination) {
      const destMarker = L.marker([-12.0664, -77.0228]).bindPopup('Destino: ' + this.destination).addTo(this.map);
      this.markers.push(destMarker);
    }

    if (this.origin && this.destination) {
      // Fit bounds
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
