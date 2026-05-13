import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { MatIcon } from '@angular/material/icon';

/**
 * @summary SVG path for a map pin (material-style drop-pin).
 */
const PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

/**
 * @summary Builds a colored SVG pin DivIcon for Leaflet.
 *
 * @param fillColor - Fill color for the pin body.
 * @param strokeColor - Stroke/border color.
 * @param size - Icon size in px.
 */
function buildPinIcon(fillColor: string, strokeColor: string, size = 36): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="${size}" height="${size}"
         style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <path d="${PIN_PATH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5"/>
    </svg>`;
  return L.divIcon({
    className: 'custom-map-icon',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}



/** Color tokens for map semantics. */
const ORIGIN_COLOR = '#10b981';
const ORIGIN_STROKE = '#059669';
const DEST_COLOR = '#ef4444';
const DEST_STROKE = '#dc2626';

/**
 * @summary Presentation component that renders the interactive trip map using Leaflet.
 * Provides semantic visual conventions: green pin = origin, red pin = destination,
 * blue circle = nearby driver, teal polyline = estimated route.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule, MatIcon],
  template: `
    <div class="map-wrapper">
      <div id="trip-map" class="map-frame"></div>

      <!-- Compact legend -->
      <div class="map-legend" *ngIf="showLegend">
        <div class="legend-item">
          <span class="legend-dot" style="background:#10b981"></span>
          <span>Origen</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#ef4444"></span>
          <span>Destino</span>
        </div>

      </div>

      <!-- Map hint overlay (only when map is empty) -->
      <div class="map-hint" *ngIf="!origin && !destination">
        <mat-icon>touch_app</mat-icon>
        <span>Toca el mapa para fijar tu punto de partida</span>
      </div>
    </div>
  `,
  styles: [
    `
      .map-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 400px;
      }
      .map-frame {
        width: 100%;
        height: 100%;
        min-height: 400px;
        border-radius: 12px;
      }
      /* Suppress Leaflet outline on focus */
      :host ::ng-deep .leaflet-container:focus {
        outline: none;
      }
      :host ::ng-deep .custom-map-icon {
        background: transparent !important;
        border: none !important;
      }

      /* Legend */
      .map-legend {
        position: absolute;
        bottom: 16px;
        left: 16px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(4px);
        border-radius: 8px;
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        pointer-events: none;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #374151;
        font-weight: 500;
      }
      .legend-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* Empty state hint overlay */
      .map-hint {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(4px);
        border-radius: 24px;
        padding: 10px 18px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #4b5563;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
      }
      .map-hint mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        color: #1a73e8;
      }
    `,
  ],
})
export class TripMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Raw origin coordinate string (lat,lng). */
  @Input() origin: string = '';
  /** Raw destination coordinate string (lat,lng). */
  @Input() destination: string = '';
  /** Array of nearby driver objects with lat/lng/name. */
  @Input() nearbyDrivers: any[] = [];
  /** Emitted when the user clicks on the map. */
  @Output() mapClicked = new EventEmitter<{ lat: number; lng: number }>();

  /** Whether to show the legend overlay. */
  get showLegend(): boolean {
    return !!(this.origin || this.destination || this.nearbyDrivers.length > 0);
  }

  private map: L.Map | undefined;
  private markers: L.Layer[] = [];

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 150);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['origin'] || changes['destination'] || changes['nearbyDrivers'])) {
      this.updateMap();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map('trip-map', { zoomControl: true }).setView([-9.47388, -78.29814], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClicked.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.updateMap();
  }

  /**
   * Parses a "lat,lng" string into a Leaflet LatLng tuple.
   *
   * @param str - The coordinate string to parse.
   * @param fallbackLat - Fallback latitude if parsing fails.
   * @param fallbackLng - Fallback longitude if parsing fails.
   */
  private parseCoord(str: string, fallbackLat: number, fallbackLng: number): [number, number] {
    const parts = str.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return [fallbackLat, fallbackLng];
  }

  /** Clears all markers and the route polyline from the map. */
  private clearMap(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
  }

  /** Rebuilds markers and route based on current inputs. */
  private updateMap(): void {
    if (!this.map) return;
    this.clearMap();

    let originCoord: [number, number] | null = null;
    let destCoord: [number, number] | null = null;

    // Origin marker (green pin)
    if (this.origin) {
      originCoord = this.parseCoord(this.origin, -9.47388, -78.29814);
      const marker = L.marker(originCoord, { icon: buildPinIcon(ORIGIN_COLOR, ORIGIN_STROKE) })
        .bindPopup('<b style="color:#059669">📍 Origen</b>')
        .addTo(this.map!);
      this.markers.push(marker);
    }

    // Destination marker (red pin)
    if (this.destination) {
      destCoord = this.parseCoord(this.destination, -9.475, -78.295);
      const marker = L.marker(destCoord, { icon: buildPinIcon(DEST_COLOR, DEST_STROKE) })
        .bindPopup('<b style="color:#dc2626">🏁 Destino</b>')
        .addTo(this.map!);
      this.markers.push(marker);
    }

    // Center map appropriately
    if (originCoord && destCoord) {
      // Fit map to show both points without polyline
      const group = L.featureGroup([L.marker(originCoord), L.marker(destCoord)]);
      this.map.fitBounds(group.getBounds(), { padding: [60, 60] });
    } else if (originCoord) {
      this.map.setView(originCoord, 16);
    } else if (destCoord) {
      this.map.setView(destCoord, 16);
    }


  }
}
