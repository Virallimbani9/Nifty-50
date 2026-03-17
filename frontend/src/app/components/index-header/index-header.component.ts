import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketService } from '../../services/market.service';
import { IndexResponse, MarketStatus } from '../../models/market.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-index-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index-header.component.html',
  styleUrls: ['./index-header.component.scss']
})
export class IndexHeaderComponent implements OnInit, OnDestroy {
  indexData: IndexResponse | null = null;
  marketStatus: MarketStatus | null = null;
  lastUpdated: Date = new Date();
  private subs = new Subscription();

  constructor(private marketService: MarketService) {}

  ngOnInit() {
    this.subs.add(
      this.marketService.getIndexData().subscribe(data => {
        this.indexData = data;
        this.lastUpdated = new Date();
      })
    );
    this.subs.add(
      this.marketService.getMarketStatus().subscribe(data => {
        this.marketStatus = data;
      })
    );
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  get isMarketOpen(): boolean {
    return this.marketStatus?.marketState?.[0]?.marketStatus === 'Open';
  }
}
