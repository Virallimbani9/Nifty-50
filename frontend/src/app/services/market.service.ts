import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, shareReplay, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Nifty50Response, IndexResponse, GainersLosersResponse, MarketStatus } from '../models/market.model';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private baseUrl = environment.apiUrl;
  private refreshInterval = 30000; // 30 seconds

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getConstituents(): Observable<Nifty50Response> {
    return interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() => {
        this.loadingSubject.next(true);
        return this.http.get<Nifty50Response>(`${this.baseUrl}/nifty50/constituents`).pipe(
          catchError(err => {
            console.error('Constituents error:', err);
            return of({ indexData: {}, stocks: [], timestamp: new Date().toISOString() } as Nifty50Response);
          })
        );
      }),
      shareReplay(1)
    );
  }

  getIndexData(): Observable<IndexResponse> {
    return interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() =>
        this.http.get<IndexResponse>(`${this.baseUrl}/nifty50/index`).pipe(
          catchError(err => {
            console.error('Index error:', err);
            return of(null as any);
          })
        )
      ),
      shareReplay(1)
    );
  }

  getGainersLosers(): Observable<GainersLosersResponse> {
    return interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() =>
        this.http.get<GainersLosersResponse>(`${this.baseUrl}/nifty50/gainers-losers`).pipe(
          catchError(err => {
            console.error('Gainers/Losers error:', err);
            return of({ gainers: [], losers: [], timestamp: new Date().toISOString() } as GainersLosersResponse);
          })
        )
      ),
      shareReplay(1)
    );
  }

  getMarketStatus(): Observable<MarketStatus> {
    return this.http.get<MarketStatus>(`${this.baseUrl}/nifty50/market-status`).pipe(
      catchError(() => of({ marketState: [{ market: 'Capital Market', marketStatus: 'Closed', tradeDate: '', index: 'NIFTY 50' }] }))
    );
  }

  getStockDetail(symbol: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/nifty50/stock/${symbol}`).pipe(
      catchError(err => of(null))
    );
  }
}
