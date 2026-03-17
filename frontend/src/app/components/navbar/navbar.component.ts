import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  currentTime = new Date();

  constructor() {
    setInterval(() => { this.currentTime = new Date(); }, 1000);
  }

  get istTime(): Date {
    const utc = this.currentTime.getTime() + this.currentTime.getTimezoneOffset() * 60000;
    return new Date(utc + 5.5 * 60 * 60000);
  }
}
