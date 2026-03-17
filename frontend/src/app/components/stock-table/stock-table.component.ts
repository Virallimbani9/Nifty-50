import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketService } from '../../services/market.service';
import { StockData } from '../../models/market.model';
import { Subscription } from 'rxjs';

type SortField = keyof StockData;
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-stock-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-table.component.html',
  styleUrls: ['./stock-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockTableComponent implements OnInit, OnDestroy {
  allStocks: StockData[] = [];
  filteredStocks: StockData[] = [];
  searchQuery = '';
  sortField: SortField = 'symbol';
  sortDir: SortDir = 'asc';
  isLoading = true;
  errorMsg = '';
  private sub = new Subscription();

  // Flash tracking
  priceFlash: Record<string, 'up' | 'down' | null> = {};
  prevPrices: Record<string, number> = {};

  constructor(private marketService: MarketService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub.add(
      this.marketService.getConstituents().subscribe({
        next: (data) => {
          const newStocks = data.stocks || [];
          // Detect price changes for flash
          newStocks.forEach(s => {
            const prev = this.prevPrices[s.symbol];
            if (prev !== undefined && prev !== s.ltp) {
              this.priceFlash[s.symbol] = s.ltp > prev ? 'up' : 'down';
              setTimeout(() => {
                this.priceFlash[s.symbol] = null;
                this.cdr.markForCheck();
              }, 1000);
            }
            this.prevPrices[s.symbol] = s.ltp;
          });
          this.allStocks = newStocks;
          this.applyFilter();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMsg = 'Failed to load market data.';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  applyFilter() {
    const q = this.searchQuery.toLowerCase();
    this.filteredStocks = this.allStocks
      .filter(s => s.symbol.toLowerCase().includes(q))
      .sort((a, b) => {
        const aVal = a[this.sortField] as any;
        const bVal = b[this.sortField] as any;
        if (typeof aVal === 'string') {
          return this.sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return this.sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }

  sort(field: SortField) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = field === 'symbol' ? 'asc' : 'desc';
    }
    this.applyFilter();
  }

  onSearch() { this.applyFilter(); }

  get advancesCount(): number {
    return this.allStocks.filter(s => s.pChange > 0).length;
  }

  get declinesCount(): number {
    return this.allStocks.filter(s => s.pChange < 0).length;
  }

  get unchangedCount(): number {
    return this.allStocks.filter(s => s.pChange === 0).length;
  }

  formatVolume(vol: number): string {
    if (vol >= 1e7) return (vol / 1e7).toFixed(2) + ' Cr';
    if (vol >= 1e5) return (vol / 1e5).toFixed(2) + ' L';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + ' K';
    return vol.toString();
  }

  trackBySymbol(_index: number, stock: StockData): string { return stock.symbol; }

  get skeletonRows(): number[] { return Array(15).fill(0).map((_, i) => i); }
}
