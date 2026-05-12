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
    :host ::ng-deep .custom-svg-icon {
      background: transparent;
      border: none;
    }
    :host ::ng-deep .custom-div-icon {
      background: transparent;
      border: none;
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

  // SVG Icons
  private getSvgIcon(color: string): L.DivIcon {
    const svgHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="${color}" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;
    return L.divIcon({
      className: 'custom-svg-icon',
      html: svgHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  }

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

    // Clear previous markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    let originCoord: [number, number] | null = null;
    let destCoord: [number, number] | null = null;

    if (this.origin) {
      originCoord = this.parseCoord(this.origin, -12.0464, -77.0428);
      const originMarker = L.marker(originCoord, { icon: this.getSvgIcon('#10b981') }).bindPopup('Origen').addTo(this.map);
      this.markers.push(originMarker);
    }
    
    if (this.destination) {
      destCoord = this.parseCoord(this.destination, -12.0664, -77.0228);
      const destMarker = L.marker(destCoord, { icon: this.getSvgIcon('#ef4444') }).bindPopup('Destino').addTo(this.map);
      this.markers.push(destMarker);
    }

    if (originCoord && destCoord) {
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else if (originCoord) {
      this.map.setView(originCoord, 15);
    } else if (destCoord) {
      this.map.setView(destCoord, 15);
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
