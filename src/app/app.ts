import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
/**
 * @summary Root application component. Renders the router outlet only.
 * All UI is delegated to routed components (LoginForm, dashboards, etc.).
 * @author Jesús Iván Castillo Vidal
 */
export class App {}
