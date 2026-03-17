import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { IndexHeaderComponent } from './components/index-header/index-header.component';
import { StockTableComponent } from './components/stock-table/stock-table.component';
import { GainersLosersComponent } from './components/gainers-losers/gainers-losers.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    IndexHeaderComponent,
    StockTableComponent,
    GainersLosersComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Nifty 50 Live Dashboard';
}
