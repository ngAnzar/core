import {
    Component, ContentChildren, QueryList, ElementRef, AfterContentInit, OnDestroy, Input, Inject,
    ChangeDetectorRef, ChangeDetectionStrategy
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Subject, Observable, merge } from "rxjs"
import { take, concat, filter, map, concatAll } from "rxjs/operators"

import { PanelComponent, PanelPosition, OpenedChangingEvent, PanelStateEvent, PanelState } from "./panel.component"
import { Subscriptions } from "../../util"
import { MaskService, MaskRef } from "../../mask.module"


export class DrawerSide {
    public readonly panels: PanelComponent[] = []

    public get opened(): PanelComponent {
        return this.panels.filter(p => this.pending[0] === p && this.pending[1])[0]
    }

    protected visible: PanelComponent | null = null
    protected pending: [PanelComponent | null, boolean] = [null, false]

    public updatePanelState(panel: PanelComponent, opened: boolean): boolean {
        this.pending = [panel, opened]

        if (this.panels.indexOf(panel) === -1) {
            this.panels.push(panel)
        }

        if (opened && this.visible !== panel) {
            if (this.visible) {
                this.visible.onClosed.pipe(take(1)).subscribe(() => {
                    this.visible = panel
                    panel.opened = true
                })
                this.visible.opened = false
                this.pending = [panel, true]
                return false
            } else {
                this.visible = panel
            }
        }

        return opened
    }

    public dispose() {
        delete this.visible
        delete this.pending
        this.panels.length = 0
    }
}


@Component({
    selector: ".nz-drawer",
    templateUrl: "./drawer.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrawerComponent implements AfterContentInit, OnDestroy {
    @ContentChildren(PanelComponent) readonly panels: QueryList<PanelComponent>
    // @ViewChild("content") readonly content: ElementRef<HTMLElement>
    // @ViewChild("overlay") readonly overlay: ElementRef<HTMLElement>

    @Input()
    public set overlayed(val: boolean) { this._overlayed = coerceBooleanProperty(val) }
    public get overlayed(): boolean { return this._overlayed }
    protected _overlayed: boolean = false

    @Input()
    public set autohide(val: boolean) { this._autohide = coerceBooleanProperty(val) }
    public get autohide(): boolean { return this._autohide }
    protected _autohide: boolean = false

    protected _subscriptions: Subscriptions = new Subscriptions()
    protected _side: { [K in PanelPosition]?: DrawerSide } = {}

    public get opened(): PanelComponent[] {
        let res: PanelComponent[] = []
        for (let k in this._side) {
            let o = this._side[k as PanelPosition].opened
            if (o) {
                res.push(o)
            }
        }
        return res
    }

    public get hasOpenedPanel(): boolean {
        for (let k in this._side) {
            if (this._side[k as PanelPosition].opened) {
                return true
            }
        }
        return false
    }

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit() {
        this.panels.forEach((panel: PanelComponent) => {
            if (!this._side[panel.position]) {
                this._side[panel.position] = new DrawerSide()
            }
            this._side[panel.position].updatePanelState(panel, panel.opened)
            this._watchPanelOpened(panel)
            this.cdr.markForCheck()
        })

    }

    public hideOpenedPanel() {
        if (this.autohide) {
            for (const opened of this.opened) {
                opened.opened = false
            }
        }
    }

    public ngOnDestroy() {
        this._subscriptions.unsubscribe()
        for (const k in this._side) {
            this._side[k as PanelPosition].dispose()
        }
    }

    protected _watchPanelOpened(panel: PanelComponent) {
        this._subscriptions.add(panel.openedChanging).subscribe(this._handlePanelSwitch)
    }

    protected _handlePanelSwitch = (panelEvent: OpenedChangingEvent) => {
        const position = panelEvent.source.position
        if (position) {
            panelEvent.finalValue = this._side[position]
                .updatePanelState(panelEvent.source, panelEvent.pendigValue)

            console.log(this.hasOpenedPanel)
            this.cdr.detectChanges()

            // this._updateOverlay()
        }
    }

    // protected _updateOverlay() {
    //     if (this.overlay) {
    //         if (this.overlayed && this.opened.length) {
    //             this.overlay.nativeElement.classList.add("visible")
    //         } else {
    //             this.overlay.nativeElement.classList.remove("visible")
    //         }
    //     }
    // }
}
