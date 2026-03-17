import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketService } from '../../services/market.service';
import { GainersLosersResponse } from '../../models/market.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gainers-losers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gainers-losers.component.html',
  styleUrls: ['./gainers-losers.component.scss']
})
export class GainersLosersComponent implements OnInit, OnDestroy {
  data: GainersLosersResponse | null = null;
  activeTab: 'gainers' | 'losers' = 'gainers';
  isLoading = true;
  private sub = new Subscription();

  constructor(private marketService: MarketService) {}

  ngOnInit() {
    this.sub.add(
      this.marketService.getGainersLosers().subscribe({
        next: (data) => {
          this.data = data;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  get activeList() {
    if (!this.data) return [];
    return this.activeTab === 'gainers' ? this.data.gainers : this.data.losers;
  }

  formatVolume(vol: number): string {
    if (vol >= 1e7) return (vol / 1e7).toFixed(1) + 'Cr';
    if (vol >= 1e5) return (vol / 1e5).toFixed(1) + 'L';
    if (vol >= 1e3) return (vol / 1e3).toFixed(0) + 'K';
    return String(vol);
  }

  get skeletonRows(): number[] { return Array(10).fill(0); }
}
