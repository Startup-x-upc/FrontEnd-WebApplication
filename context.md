# Guía General para Examen Práctico — Angular con DDD y Layered Architecture

> **Propósito:** Este documento contiene las instrucciones genéricas, patrones de arquitectura y convenciones de código que debe seguir un agente (o el desarrollador) para construir **cualquier** aplicación Angular que se solicite en el examen. Los detalles específicos del caso (bounded contexts, endpoint, entidades) se proporcionarán al momento de la práctica.

---

## 1. Stack Tecnológico y Versiones

| Tecnología | Versión |
|---|---|
| Angular CLI | 21.x |
| Angular Core | 21.x |
| Angular Material + CDK | 21.x |
| @ngx-translate/core | ^17.0.0 |
| @ngx-translate/http-loader | ^17.0.0 |
| TypeScript | ~5.9.x |
| Node.js | 22.x |
| RxJS | ~7.8.x |
| zone.js | ~0.15.x |

### 1.1 Creación del Proyecto

```bash
# Crear proyecto nuevo con Angular CLI (standalone por defecto en v21)
npx -y @angular/cli@21 new nombre-del-proyecto --style=css --ssr=false
```

### 1.2 Dependencias Adicionales a Instalar

Después de crear el proyecto, instalar únicamente estas dependencias adicionales:

```bash
# Angular Material (incluye CDK automáticamente)
ng add @angular/material

# Internacionalización con ngx-translate
npm install @ngx-translate/core @ngx-translate/http-loader
```

> [!IMPORTANT]
> Angular Material se agrega con `ng add` (no `npm install`) porque ejecuta un schematic que configura automáticamente el tema en `angular.json`, agrega la fuente Roboto y los Material Icons en `index.html`, y crea `custom-theme.scss`.

---

## 2. Arquitectura: Domain-Driven Design con Layered Architecture

La organización del código dentro de `src/app/` se divide en **Bounded Contexts** (sub-dominios). Cada bounded context contiene **4 capas**.

### 2.1 Bounded Contexts

El enunciado del examen indicará cuáles son. Ejemplo genérico:

- **`shared`** — Elementos genéricos reutilizables (layout, footer, language-switcher, servicios transversales).
- **`<dominio-principal>`** — El dominio de negocio específico del caso (ej. `news`, `universities`, `products`...). Se proporcionará en la práctica.

### 2.2 Las 4 Capas dentro de cada Bounded Context

```
src/app/<bounded-context>/
├── domain/             ← Entidades y reglas de negocio puras
│   └── model/
│       └── <entity-name>.entity.ts
├── infrastructure/     ← Comunicación HTTP, DTOs, Assemblers
│   ├── <context>-api.service.ts
│   ├── <entity>-assembler.ts
│   └── <endpoint>-response.ts   (interfaces DTO)
├── application/        ← Orquestación, estado, lógica de aplicación
│   └── <context>.store.ts
└── presentation/       ← Componentes Angular (vista + lógica de UI)
    └── components/
        ├── <entity>-item/
        │   ├── <entity>-item.ts
        │   ├── <entity>-item.html
        │   └── <entity>-item.css
        └── <entity>-list/
            ├── <entity>-list.ts
            ├── <entity>-list.html
            └── <entity>-list.css
```

#### Responsabilidad de cada capa:

| Capa | Qué contiene | Qué NO debe hacer |
|---|---|---|
| **domain/model** | Clases Entity con propiedades del dominio. Constructor inicializa valores vacíos. | No importa HttpClient, no conoce Angular. |
| **infrastructure** | Servicio API (`@Injectable`) con `HttpClient`, interfaces DTO (Response/Resource), clases Assembler estáticas que mapean DTO → Entity. | No renderiza UI, no maneja estado global. |
| **application** | Store/Service (`@Injectable`) con Angular `signal()` y `computed()`. Orquesta llamadas al infrastructure y expone datos a presentation. | No hace llamadas HTTP directamente, no renderiza. |
| **presentation/components** | Componentes Angular con `@Component`. Reciben datos vía `input()`. Usan Material components. | No llaman a HttpClient, no mapean DTOs. |

### 2.3 Estructura Completa del Proyecto

```
src/
├── app/
│   ├── shared/                                 # Bounded Context: shared/public
│   │   ├── infrastructure/
│   │   │   └── logo-dev-api.ts                 # Servicio para obtener logos (SIEMPRE incluir)
│   │   └── presentation/
│   │       └── components/
│   │           ├── footer/                     # Footer con i18n
│   │           ├── language-switcher/          # Toggle EN/ES
│   │           └── layout/                     # Shell principal (toolbar + content + footer)
│   │
│   ├── <dominio>/                              # Bounded Context: dominio del examen
│   │   ├── domain/
│   │   │   └── model/
│   │   ├── infrastructure/
│   │   ├── application/
│   │   └── presentation/
│   │       └── components/
│   │
│   ├── app.ts                                  # Root component
│   ├── app.html                                # Solo contiene <app-layout/>
│   ├── app.css
│   ├── app.config.ts                           # Providers globales
│   └── app.routes.ts                           # Vacío (routing fuera de alcance)
│
├── environments/
│   ├── environment.ts                          # Config producción
│   └── environment.development.ts              # Config desarrollo
│
├── custom-theme.scss                           # Tema de Angular Material
├── styles.css                                  # Estilos globales
├── index.html                                  # HTML base con fuentes
└── main.ts                                     # Bootstrap de la app
```

---

## 3. Patrones de Código (con ejemplos del proyecto de referencia)

### 3.1 Entity (domain/model)

```typescript
/**
 * @summary Represents a [DomainEntity] in the [BoundedContext] bounded context.
 * @author Jesús Iván Castillo Vidal
 */
export class DomainEntity {
  propertyOne: string;
  propertyTwo: string;

  constructor() {
    this.propertyOne = '';
    this.propertyTwo = '';
  }
}
```

**Clave:** Es una clase simple, sin decoradores Angular, constructor inicializa todo vacío.

### 3.2 DTO / Response Interface (infrastructure)

```typescript
/**
 * @summary Raw response contract for the [endpoint-name] endpoint.
 * @author Jesús Iván Castillo Vidal
 */
export interface EndpointResponse {
  status: string;
  results: ResourceItem[];
}

/**
 * @summary Raw resource returned by the provider API.
 * @author Jesús Iván Castillo Vidal
 */
export interface ResourceItem {
  id: string;
  name: string;
  // ... propiedades tal cual vienen del JSON
}
```

**Clave:** Refleja exactamente la estructura JSON del API. Usa `interface`, no `class`.

### 3.3 Assembler (infrastructure)

```typescript
import {ResourceItem, EndpointResponse} from './endpoint-response';
import {DomainEntity} from '../domain/model/domain-entity.entity';

/**
 * @summary Maps [resource] resources from the API into [Entity] domain entities.
 * @author Jesús Iván Castillo Vidal
 */
export class DomainEntityAssembler {

  static toEntityFromResource(resource: ResourceItem): DomainEntity {
    return {
      propertyOne: resource.name,
      propertyTwo: resource.id || '',
    };
  }

  static toEntitiesFromResponse(response: EndpointResponse): DomainEntity[] {
    return response.results.map(item => this.toEntityFromResource(item));
  }
}
```

**Clave:** Métodos estáticos. Convierte DTO → Entity. No tiene decorador `@Injectable`.

### 3.4 API Service (infrastructure)

```typescript
import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map, Observable} from 'rxjs';
import {DomainEntity} from '../domain/model/domain-entity.entity';
import {EndpointResponse} from './endpoint-response';
import {DomainEntityAssembler} from './domain-entity-assembler';

@Injectable({providedIn: 'root'})
/**
 * @summary Infrastructure gateway to the external [context] provider API.
 * @author Jesús Iván Castillo Vidal
 */
export class DomainApi {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getAll(): Observable<DomainEntity[]> {
    return this.http.get<EndpointResponse>(`${this.baseUrl}/endpoint`).pipe(
      map(response => DomainEntityAssembler.toEntitiesFromResponse(response))
    );
  }
}
```

**Clave:** Usa `inject(HttpClient)`. Lee URLs del `environment`. Retorna `Observable<Entity[]>` ya mapeado por el Assembler.

### 3.5 Store (application)

```typescript
import {computed, inject, Injectable, signal} from '@angular/core';
import {DomainEntity} from '../domain/model/domain-entity.entity';
import {DomainApi} from '../infrastructure/domain-api';

@Injectable({providedIn: 'root'})
/**
 * @summary Application service that coordinates state for the [Context] bounded context.
 * @author Jesús Iván Castillo Vidal
 */
export class DomainStore {
  private domainApi = inject(DomainApi);
  private itemsSignal = signal<DomainEntity[]>([]);

  readonly items = computed(() => this.itemsSignal());

  loadItems(): void {
    this.domainApi.getAll().subscribe(items => {
      this.itemsSignal.set(items);
    });
  }
}
```

**Clave:** Usa Angular `signal()` para estado reactivo y `computed()` para lecturas. Llama al API del infrastructure.

### 3.6 LogoDevApi — Servicio Transversal (shared/infrastructure) — SIEMPRE INCLUIR

Este servicio se ubica en `shared/infrastructure/` y sirve para generar URLs de logos a partir de un dominio web. Se usa dentro de los Assemblers o del Store para enriquecer las entidades con imágenes de logo.

```typescript
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
/**
 * @summary Infrastructure gateway for generating source logo URLs using logo.dev.
 * @author Jesús Iván Castillo Vidal
 */
export class LogoDevApi {
  /** Base URL for the logo provider API. */
  baseUrl = environment.logoProviderApiBaseUrl;
  /** Publishable API key required by the logo provider. */
  apiKey = environment.logoProviderPublishableKey;

  constructor() {}

  /**
   * Builds the logo URL for a given website URL.
   *
   * @param url - A string value containing the website URL.
   */
  getUrlToLogo(url: string): string {
    return `${this.baseUrl}${new URL(url).hostname}?token=${this.apiKey}`;
  }
}
```

**Clave:** Se inyecta en el Assembler o en el API Service del dominio para enriquecer entidades con `urlToLogo`. Genera la URL así: `https://img.logo.dev/<hostname>?token=<publishable_key>`.

**Uso típico en un Assembler:**
```typescript
// Dentro del assembler, si la entidad tiene campo urlToLogo:
static logoApi: LogoDevApi;

static withLogoApi(logoApi: LogoDevApi) {
  this.logoApi = logoApi;
  return this;
}

static toEntityFromResource(resource: ResourceItem): DomainEntity {
  return {
    // ... otras propiedades
    urlToLogo: this.logoApi.getUrlToLogo(resource.url)
  };
}
```

**Uso típico desde el API Service:**
```typescript
private logoApi = inject(LogoDevApi);

getAll(): Observable<DomainEntity[]> {
  return this.http.get<EndpointResponse>(`${this.baseUrl}/endpoint`).pipe(
    map(response => DomainEntityAssembler.withLogoApi(this.logoApi).toEntitiesFromResponse(response))
  );
}
```

### 3.7 Componente Presentación — Item (presentation/components)

```typescript
import {Component, input} from '@angular/core';
import {DomainEntity} from '../../../domain/model/domain-entity.entity';
import {MatCard, MatCardContent, MatCardHeader, ...} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-domain-item',
  imports: [MatCard, MatCardContent, MatCardHeader, MatButton, TranslatePipe],
  templateUrl: './domain-item.html',
  styleUrl: './domain-item.css'
})
/**
 * @summary Presentation component that renders a single [Entity] card.
 * @author Jesús Iván Castillo Vidal
 */
export class DomainItem {
  item = input.required<DomainEntity>();
}
```

**HTML del Item:**
```html
<mat-card>
  <img mat-card-image [alt]="item().name" [src]="item().imageUrl"/>
  <mat-card-header>
    <mat-card-title>{{ item().name }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <p>{{ item().description }}</p>
  </mat-card-content>
  <mat-card-actions>
    <a [href]="item().url" mat-button target="_blank"
       aria-label="Read more about this item">
      {{ 'item.read-more' | translate }}
    </a>
  </mat-card-actions>
</mat-card>
```

### 3.7 Componente Presentación — List (presentation/components)

```typescript
@Component({
  selector: 'app-domain-list',
  imports: [DomainItem],
  templateUrl: './domain-list.html',
  styleUrl: './domain-list.css'
})
/**
 * @summary Presentation component that renders a list of [Entity] cards.
 * @author Jesús Iván Castillo Vidal
 */
export class DomainList {
  items = input.required<Array<DomainEntity>>();
}
```

**HTML del List:**
```html
@for (item of items(); track item.id) {
  <app-domain-item [item]="item"/>
}
```

**Clave:** Usa `@for` (nueva sintaxis de Angular 17+), no `*ngFor`.

---

## 4. Internacionalización (i18n) con @ngx-translate

### 4.1 Configuración en `app.config.ts`

```typescript
import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({prefix: './i18n/', suffix: '.json'}),
      fallbackLang: 'en'
    })
  ]
};
```

### 4.2 Archivos de traducción

Ubicación: `public/i18n/en.json` y `public/i18n/es.json`

**Todo texto estático visible en el HTML debe ser traducible.** Se organizan por bounded context:

```json
// en.json
{
  "app": { "title": "App Title" },
  "footer": { "rights": "All rights reserved.", "powered-by": "Powered by" },
  "item": { "read-more": "Read more" }
}
```

```json
// es.json
{
  "app": { "title": "Título de la App" },
  "footer": { "rights": "Todos los derechos reservados.", "powered-by": "Desarrollado por" },
  "item": { "read-more": "Ver más" }
}
```

### 4.3 Uso en Templates HTML

```html
<!-- Importar TranslatePipe en el componente -->
<p>{{ 'footer.rights' | translate }}</p>
<a href="...">{{ 'item.read-more' | translate }}</a>
```

### 4.4 Componente Language Switcher

Utiliza `MatButtonToggleGroup` de Angular Material:

```typescript
import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';

@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleGroup, MatButtonToggle],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher {
  currentLang = 'en';
  languages = ['en', 'es'];

  constructor(private translate: TranslateService) {
    this.currentLang = translate.getCurrentLang();
  }

  useLanguage(language: string) {
    this.translate.use(language);
  }
}
```

```html
<mat-button-toggle-group [value]="currentLang" appearance="standard"
                         aria-label="Preferred Language" name="language">
  @for (language of languages; track language) {
    <mat-button-toggle (click)="useLanguage(language)"
                       [aria-label]="language"
                       [value]="language">{{ language.toUpperCase() }}
    </mat-button-toggle>
  }
</mat-button-toggle-group>
```

---

## 5. Componentes Shared Obligatorios

### 5.1 Layout (Shell principal)

El Layout orquesta todo sin necesidad de routing:

```html
<!-- layout.html -->
<mat-toolbar color="primary">
  <span>{{ 'app.title' | translate }}</span>
  <span class="spacer"></span>
  <app-language-switcher/>
</mat-toolbar>

<!-- Aquí se coloca el componente list del dominio -->
<app-domain-list [items]="items()"/>

<app-footer/>
```

```typescript
// layout.ts - inyecta el Store y dispara la carga en OnInit
export class Layout implements OnInit {
  protected store = inject(DomainStore);
  protected readonly items = this.store.items;

  ngOnInit(): void {
    this.store.loadItems();
  }
}
```

### 5.2 Footer (con i18n)

```html
<div class="footer-content">
  <p>{{ 'footer.rights' | translate }}</p>
</div>
```

### 5.3 Root Component (`app.ts` y `app.html`)

```typescript
// app.ts
@Component({
  selector: 'app-root',
  imports: [Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('app-name');
}
```

```html
<!-- app.html — solo esto -->
<app-layout/>
```

---

## 6. Configuración de Environments

Los environments siempre deben incluir las claves de `logo.dev` y las del API del dominio (que se darán en el examen).

```typescript
// src/environments/environment.ts (producción)
/**
 * @summary Production environment configuration.
 * @author Jesús Iván Castillo Vidal
 */
export const environment = {
  production: true,
  // --- API del dominio (se completa con los datos del examen) ---
  apiBaseUrl: 'https://api.example.com/v1',
  // ... endpoints específicos del examen
  // --- Logo provider (SIEMPRE incluir) ---
  logoProviderApiBaseUrl: 'https://img.logo.dev/',
  logoProviderPublishableKey: 'pk_WGGAjW7qTXKkKp9SS-SlUg'
};
```

```typescript
// src/environments/environment.development.ts
/**
 * @summary Development environment configuration.
 * @author Jesús Iván Castillo Vidal
 */
export const environment = {
  production: false,
  // --- API del dominio (se completa con los datos del examen) ---
  apiBaseUrl: 'https://api.example.com/v1',
  // ... endpoints específicos del examen
  // --- Logo provider (SIEMPRE incluir) ---
  logoProviderApiBaseUrl: 'https://img.logo.dev/',
  logoProviderPublishableKey: 'pk_WGGAjW7qTXKkKp9SS-SlUg'
};
```

> [!NOTE]
> En `angular.json`, la configuración `development` tiene un `fileReplacements` que cambia `environment.ts` por `environment.development.ts` al usar `ng serve`.

---

## 7. Archivos Base del Proyecto

### 7.1 `index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AppName</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

### 7.2 `styles.css`

```css
html, body { height: 100%; }
body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }
```

### 7.3 `main.ts`

```typescript
import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {App} from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

---

## 8. Accesibilidad (a11y) — Checklist

- [ ] Todas las `<img>` tienen atributo `alt` descriptivo.
- [ ] Botones y enlaces interactivos llevan `aria-label`.
- [ ] El `mat-button-toggle-group` del language switcher tiene `aria-label="Preferred Language"`.
- [ ] Botones de ícono (`mat-icon-button`) tienen `aria-label` describiendo la acción.
- [ ] Elementos de navegación/toggle usan atributos `name` semánticos.

---

## 9. Convenciones de Nomenclatura — Checklist

- [ ] **Idioma:** Todo en **inglés** (archivos, clases, variables, métodos, constantes).
- [ ] **Archivos:** `kebab-case` (ej. `university-card.ts`, `news-api.ts`).
- [ ] **Clases:** `PascalCase` (ej. `UniversityCard`, `NewsApi`).
- [ ] **Propiedades/Métodos:** `camelCase` (ej. `loadItems`, `currentLang`).
- [ ] **Entidades:** `<nombre>.entity.ts` (ej. `article.entity.ts`).
- [ ] **Servicios API:** `<context>-api.ts` o `<context>-api.service.ts`.
- [ ] **Assemblers:** `<entity>-assembler.ts`.
- [ ] **DTOs:** `<endpoint>-response.ts`.
- [ ] **Stores:** `<context>.store.ts`.

---

## 10. Comentarios JSDoc — Obligatorios

Cada archivo de código fuente creado debe incluir:

```typescript
/**
 * @summary Breve descripción del propósito del archivo, clase o componente.
 * @author Jesús Iván Castillo Vidal
 */
```

Adicionalmente, cada **método público** debe tener su comentario:

```typescript
/**
 * Loads all items from the external API.
 *
 * @param sourceId - Optional filter by source identifier.
 */
```

Y cada **propiedad** debe tener un comentario en línea:

```typescript
/** Internal signal containing all available items. */
private itemsSignal = signal<Item[]>([]);
```

---

## 11. README.md — Template

```markdown
# [Nombre de la Aplicación]

## Descripción
[Descripción breve de la aplicación y su propósito.]

## Autor
- **Nombre:** Jesús Iván Castillo Vidal
- **Código:** [Tu código de estudiante]

## Tecnologías
- Angular 21
- Angular Material
- @ngx-translate
- TypeScript

## Instalación
\`\`\`bash
npm install
ng serve
\`\`\`
```

---

## 12. Orden de Ejecución Paso a Paso

Cuando se reciba el enunciado del examen, seguir este orden:

1. **Crear proyecto:** `ng new <nombre> --style=css --ssr=false`
2. **Agregar Material:** `ng add @angular/material`
3. **Instalar i18n:** `npm install @ngx-translate/core @ngx-translate/http-loader`
4. **Configurar `app.config.ts`:** provideHttpClient + provideTranslateService
5. **Crear `environments/`:** con la URL del API que den en el examen
6. **Crear los archivos de traducción:** `public/i18n/en.json` y `es.json`
7. **Capa domain:** Crear las entidades
8. **Capa infrastructure:** Crear DTOs (Response), Assemblers y API Service
9. **Capa application:** Crear el Store
10. **Capa presentation (shared):** Footer, LanguageSwitcher, Layout
11. **Capa presentation (dominio):** Item component y List component
12. **Integrar en Layout:** Conectar Store → List → Items
13. **Root component:** `app.html` solo `<app-layout/>`
14. **README.md:** Rellenar con la información solicitada
15. **Verificar:** `ng serve` debe compilar sin errores
16. **Revisión final:** JSDoc en todos los archivos, ARIA attributes, `alt` en imágenes
