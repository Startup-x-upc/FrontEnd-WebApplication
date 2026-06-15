import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './shared/infrastructure/auth.interceptor';
import { errorInterceptor } from './shared/infrastructure/error.interceptor';

/**
 * @summary Global application configuration with providers for HTTP, routing and Material animations.
 * @author Jesús Iván Castillo Vidal
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(routes)
  ]
};
