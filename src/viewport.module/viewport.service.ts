import { Injectable, Inject, EventEmitter, TemplateRef, Injector, EmbeddedViewRef, OnDestroy } from "@angular/core"
import { Router, NavigationEnd } from "@angular/router"
import { Portal, ComponentType, ComponentPortal, TemplatePortal } from "@angular/cdk/portal"
import { Observable, NEVER, of, Subject, Subscription, merge } from "rxjs"
import { share, filter, map, startWith, switchMap, debounceTime } from "rxjs/operators"

import { Destruct } from "../util"
import { KeyEventService, SpecialKey, MediaQueryService, KeyWatcher } from "../common.module"


export interface VPItem {
    area: string,
    order: number,
    tplRef: TemplateRef<any>,
    viewRef: EmbeddedViewRef<any>
}


export const enum VPPanelStyle {
    SLIDE = 1,
    OVERLAY = 2
}


export class VPPanel {
    public set width(val: number) {
        if (this._width !== val) {
            this._width = val;
            (this.changes as EventEmitter<any>).emit()
        }
    }
    public get width(): number { return this._width }
    private _width: number = 300

    public set disabled(val: boolean) {
        if (this._disabled !== val) {
            this._disabled = val;
            (this.changes as EventEmitter<any>).emit()
        }
    }
    public get disabled(): boolean { return this._disabled }
    private _disabled: boolean = false


    public set style(val: VPPanelStyle) {
        if (this._style !== val) {
            this._style = val;
            (this.changes as EventEmitter<any>).emit()
        }
    }
    public get style(): VPPanelStyle { return this._style }
    private _style: VPPanelStyle = VPPanelStyle.OVERLAY


    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val;
            (this.changes as EventEmitter<any>).emit()
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean = false

    public readonly changes: Observable<void> = new EventEmitter<any>()
}


@Injectable()
export class ViewportService implements OnDestroy {
    public readonly destruct = new Destruct()

    public readonly menu = new VPPanel()
    public readonly right = new VPPanel()

    private _menuBackWatch: KeyWatcher
    private _rightBackWatch: KeyWatcher


    // public readonly menuChanges: Observable<any> = new EventEmitter()

    public set navbarCenterOverlap(val: boolean) {
        if (this._navbarCenterOverlap !== val) {
            this._navbarCenterOverlap = val

            if (val) {
                if (this.menu.style === VPPanelStyle.OVERLAY) {
                    this.menu.opened = false
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
            this.menu.opened = false
            return true
        }))

        this._rightBackWatch = this.destruct.disposable(keyEvent.newWatcher(SpecialKey.BackButton, () => {
            this.right.opened = false
            return true
        }))

        this.destruct.subscription(merge(this.menu.changes, this.right.changes))
            .pipe(debounceTime(10))
            .subscribe(_ => {
                if (this.right.opened && this.right.style === VPPanelStyle.OVERLAY) {
                    if (this.menu.style === VPPanelStyle.OVERLAY) {
                        this.menu.opened = false
                    }
                    this._rightBackWatch.on()
                } else {
                    this._rightBackWatch.off()
                    if (this.menu.opened && this.menu.style === VPPanelStyle.OVERLAY) {
                        if (this.right.style === VPPanelStyle.OVERLAY) {
                            this.right.opened = false
                        }
                        this._menuBackWatch.on()
                    } else {
                        this._menuBackWatch.off()
                    }
                }
            })

        this.destruct.subscription(router.events).subscribe(event => {
            if (event instanceof NavigationEnd) {
                if (!this.menu.disabled && this.menu.style != VPPanelStyle.SLIDE) {
                    this.menu.opened = false
                }
            }
        })

        let first = true
        this.destruct.subscription(mq.watch("xs")).subscribe(event => {
            if (!event.matches) {
                this.navbarCenterOverlap = false
                this.menu.style = VPPanelStyle.SLIDE
                this.right.style = VPPanelStyle.SLIDE
                if (first) {
                    this.menu.opened = true
                }
            } else {
                this.menu.style = VPPanelStyle.OVERLAY
                this.right.style = VPPanelStyle.OVERLAY
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
