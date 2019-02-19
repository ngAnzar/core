import { Injectable, Inject, EventEmitter, TemplateRef, StaticProvider, Injector, EmbeddedViewRef } from "@angular/core"
import { Router, NavigationEnd } from "@angular/router"
import { Portal, ComponentType, ComponentPortal, TemplatePortal } from "@angular/cdk/portal"
import { Observable, NEVER, of, Subject } from "rxjs"
import { share, filter, map, startWith, switchMap } from "rxjs/operators"


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
export class ViewportService {

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
                this.closeMenu()
                this.openMenu()
            }

            (this.menuChanges as EventEmitter<any>).emit()
        }
    }
    public get menuStyle(): VPMenuStyle { return this._menuStyle }
    private _menuStyle: VPMenuStyle = VPMenuStyle.OVERLAY // TODO: kis felbontáson overlay

    public readonly menuOpened: boolean = false
    public readonly menuChanges: Observable<any> = new EventEmitter()

    public set navbarCenterOverlap(val: boolean) {
        if (this._navbarCenterOverlap !== val) {
            this._navbarCenterOverlap = val;
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
        @Inject(Injector) protected readonly injector: Injector) {
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

    public openMenu() {
        if (this.menuOpened) {
            return
        }
        (this as any).menuOpened = true;
        (this.menuChanges as EventEmitter<any>).emit()
    }

    public closeMenu() {
        if (!this.menuOpened) {
            return
        }
        (this as any).menuOpened = false;
        (this.menuChanges as EventEmitter<any>).emit()
    }

    public toggleMenu() {
        if (this.menuOpened) {
            this.closeMenu()
        } else {
            this.openMenu()
        }
    }

    // public addComponent(area: string, order: number, cmp: ComponentType<any>, provides?: StaticProvider[]): Readonly<VPItem> {
    //     const injector = provides ? Injector.create(provides, this.injector) : this.injector
    //     const portal = new ComponentPortal(cmp, null, injector)
    //     return this.addItem(area, order, portal)
    // }

    // public addTemplate(area: string, order: number, tpl: TemplateRef<any>, vcr: ViewContainerRef, context?: any): Readonly<VPItem> {
    //     const portal = new TemplatePortal(tpl, vcr, context)
    //     return this.addItem(area, order, portal)
    // }

}
