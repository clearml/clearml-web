import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of, Subject, EMPTY } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { initSearch } from '@common/common-search/common-search.actions';
import { selectActiveSearch } from '@common/common-search/common-search.reducer';
import {
  selectCurrentUser,
  selectShowOnlyUserWork
} from '@common/core/reducers/users-reducer';
import { selectFirstLogin } from '@common/core/reducers/view.reducer';
import {
  getRecentExperiments,
  getRecentProjects,
  getRecentReports
} from '@common/dashboard/common-dashboard.actions';
import { selectRecentTasks } from '@common/dashboard/common-dashboard.reducer';
import { firstLogin } from '@common/core/actions/layout.actions';
import { setDeep } from '@common/core/actions/projects.actions';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let store: jasmine.SpyObj<Store<any>>;
  let router: jasmine.SpyObj<Router>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let activatedRoute: ActivatedRoute;

  let activeSearch$: Subject<boolean>;
  let showOnlyUserWork$: Subject<boolean>;
  let currentUser$: Subject<any>;
  let firstLogin$: Subject<boolean>;
  let recentTasks$: Subject<any[]>;

  beforeEach(async () => {
    activeSearch$ = new Subject<boolean>();
    showOnlyUserWork$ = new Subject<boolean>();
    currentUser$ = new Subject<any>();
    firstLogin$ = new Subject<boolean>();
    recentTasks$ = new Subject<any[]>();

    store = jasmine.createSpyObj<Store<any>>('Store', ['select', 'dispatch']);
    (store.select as jasmine.Spy).and.callFake((selector: any) => {
      switch (selector) {
        case selectActiveSearch:
          return activeSearch$.asObservable();
        case selectShowOnlyUserWork:
          return showOnlyUserWork$.asObservable();
        case selectCurrentUser:
          return currentUser$.asObservable();
        case selectFirstLogin:
          return firstLogin$.asObservable();
        case selectRecentTasks:
          return recentTasks$.asObservable();
        default:
          return EMPTY;
      }
    });

    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    activatedRoute = {} as ActivatedRoute;

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => of(null)
    } as any);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: Store, useValue: store },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: MatDialog, useValue: dialog }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch initSearch in the constructor', () => {
    expect(store.dispatch).toHaveBeenCalledWith(initSearch({payload: 'Search for all'}));
  });

  it('should navigate to search when active search becomes true', fakeAsync(() => {
    activeSearch$.next(false);
    activeSearch$.next(true);
    tick();

    expect(router.navigate).toHaveBeenCalledWith(
      ['search'],
      {relativeTo: activatedRoute, queryParamsHandling: 'preserve'}
    );
  }));

  it('should dispatch recent entities actions when user and showOnlyUserWork are set', fakeAsync(() => {
    const initialDispatchCount = store.dispatch.calls.count();

    showOnlyUserWork$.next(true);
    currentUser$.next({id: 'user-1'});

    tick(150);

    expect(store.dispatch.calls.count()).toBeGreaterThan(initialDispatchCount);
    expect(store.dispatch).toHaveBeenCalledWith(getRecentProjects());
    expect(store.dispatch).toHaveBeenCalledWith(getRecentExperiments());
    expect(store.dispatch).toHaveBeenCalledWith(getRecentReports());
  }));

  it('should show welcome dialog on first login and dispatch firstLogin(false) after closing', () => {
    firstLogin$.next(true);

    expect(dialog.open).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(firstLogin({first: false}));
  });

  it('should dispatch setDeep(false) on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(setDeep({deep: false}));
  });

  it('should navigate to workers and queues on redirectToWorkers', () => {
    component.redirectToWorkers();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/workers-and-queues');
  });

  it('should set width via setWidth', () => {
    component.setWidth(1024);
    expect(component.width).toBe(1024);
  });
});


