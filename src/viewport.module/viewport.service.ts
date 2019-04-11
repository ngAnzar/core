import { Injectable, Inject, EventEmitter, TemplateRef, Injector, EmbeddedViewRef, OnDestroy } from "@angular/core"
import { Router, NavigationEnd } from "@angular/router"
import { Portal, ComponentType, ComponentPortal, TemplatePortal } from "@angular/cdk/portal"
import { Observable, NEVER, of, Subject, Subscription } from "rxjs"
import { share, filter, map, startWith, switchMap } from "rxjs/operators"

import { Destruct } from "../util"
import { KeyEventService, SpecialKey, MediaQueryService, KeyWatcher } from "../common.module"


export interface VPItem {
    area: string,
    order: number,
    tplRef: TemplateRef<any>,
    viewRef: EmbeddedViewRef<any>
}


export const enum VPMenuStyle {
    SLIDE = 1,
    OVERLAY = 2
}


@Injectable()
export class ViewportService implements OnDestroy {
    public readonly destruct = new Destruct()

    public set menuDisabled(val: boolean) {
        if (this._menuDisabled !== val) {
            this._menuDisabled = val;
            (this.menuChanges as EventEmitter<any>).emit()
        }
    }
    public get menuDisabled(): boolean { return this._menuDisabled }
    private _menuDisabled: boolean

    public set menuStyle(val: VPMenuStyle) {
        if (this._menuStyle !== val) {
            this._menuStyle = val

            if (this.menuOpened) {
                this.menuOpened = false
                this.menuOpened = true
            }

            (this.menuChanges as EventEmitter<any>).emit()
        }
    }
    public get menuStyle(): VPMenuStyle { return this._menuStyle }
    private _menuStyle: VPMenuStyle = VPMenuStyle.OVERLAY // TODO: kis felbontáson overlay


    public set menuOpened(val: boolean) {
        if (this._menuOpened !== val) {
            this._menuOpened = val

            if (val) {
                this._menuBackWatch.on()
            } else {
                this._menuBackWatch.off()
            }

            (this.menuChanges as EventEmitter<any>).emit()
        }
    }
    public get menuOpened(): boolean { return this._menuOpened }
    private _menuOpened: boolean = false
    private _menuBackWatch: KeyWatcher


    public readonly menuChanges: Observable<any> = new EventEmitter()

    public set navbarCenterOverlap(val: boolean) {
        if (this._navbarCenterOverlap !== val) {
            this._navbarCenterOverlap = val

            if (val) {
                if (this.menuStyle === VPMenuStyle.OVERLAY) {
                    this.menuOpened = false
                }
            }

            (this.navbarChanges as EventEmitter<boolean>).emit(val)
        }
    }
    public get navbarCenterOverlap(): boolean { return this._navbarCenterOverlap }
    private _navbarCenterOverlap: boolean = false

    public readonly navbarChanges: Observable<boolean> = new EventEmitter<boolean>()

    private _items: VPItem[] = []
    private _itemsObserver = new Observable<VPItem[]>(subscriber => {
        this._emitItemChange = (area: string) => {
            subscriber.next(this._items.filter(item => item.area === area))
        }
        return () => {
            delete this._emitItemChange
        }
    }).pipe(share())

    private _emitItemChange: (area: string) => void

    public query(area: string): Observable<Array<VPItem>> {
        return this._itemsObserver
            .pipe(
                startWith(this._items),
                map(items => {
                    return items
                        .filter(item => item.area === area)
                }),
                switchMap(items => items.length ? of(items) : NEVER)
            )
    }

    public constructor(
        @Inject(Router) router: Router,
        @Inject(Injector) protected readonly injector: Injector,
        @Inject(KeyEventService) protected readonly keyEvent: KeyEventService,
        @Inject(MediaQueryService) protected readonly mq: MediaQueryService) {

        this._menuBackWatch = this.destruct.disposable(keyEvent.newWatcher(SpecialKey.BackButton, () => {
            this.menuOpened = false
            return true
        }))

        this.destruct.subscription(router.events).subscribe(event => {
            if (event instanceof NavigationEnd) {
                if (!this.menuDisabled && this.menuStyle != VPMenuStyle.SLIDE) {
                    this.menuOpened = false
                }
            }
        })

        let first = true
        this.destruct.subscription(mq.watch("xs")).subscribe(event => {
            if (!event.matches) {
                this.navbarCenterOverlap = false
                this.menuStyle = VPMenuStyle.SLIDE
                if (first) {
                    this.menuOpened = true
                }
            } else {
                this.menuStyle = VPMenuStyle.OVERLAY
            }
            first = false
        })
    }

    public addItem(area: string, order: number, tplRef: TemplateRef<any>): Readonly<VPItem> {
        let item: VPItem = { area, order, tplRef, viewRef: null }
        this._items.push(item)
        this._items.sort((a, b) => a.order - b.order)
        this._emitItemChange && this._emitItemChange(area)
        return item
    }

    public delItem(item: VPItem): void {
        if (item.viewRef) {
            item.viewRef.destroy()
        }

        let idx = this._items.indexOf(item)
        if (idx !== -1) {
            this._items.splice(idx, 1)
            this._emitItemChange && this._emitItemChange(item.area)
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
