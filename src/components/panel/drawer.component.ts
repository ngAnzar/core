import { Component, ContentChildren, ViewChild, QueryList, ElementRef, AfterContentInit, OnDestroy, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Subject, Observable, merge } from "rxjs"
import { take, concat, filter, map, concatAll } from "rxjs/operators"

import { PanelComponent, PanelPosition, OpenedChangingEvent, PanelStateEvent, PanelState } from "./panel.component"
import { Subscriptions } from "../../util"


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

        if (this.visible === panel) {
            if (!opened) {
                this.visible = null
            }
        } else if (opened) {
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
    templateUrl: "./drawer.template.pug"
})
export class DrawerComponent implements AfterContentInit, OnDestroy {
    @ContentChildren(PanelComponent) readonly panels: QueryList<PanelComponent>
    // @ViewChild("content") readonly content: ElementRef<HTMLElement>
    @ViewChild("overlay") readonly overlay: ElementRef<HTMLElement>

    @Input()
    public set overlayed(val: boolean) { this._overlayed = coerceBooleanProperty(val) }
    public get overlayed(): boolean { return this._overlayed }
    protected _overlayed: boolean = false

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

    public ngAfterContentInit() {
        this.panels.forEach(this._watchPanelOpened.bind(this))
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
            if (!this._side[position]) {
                this._side[position] = new DrawerSide()
            }
            panelEvent.finalValue = this._side[position]
                .updatePanelState(panelEvent.source, panelEvent.pendigValue)

            if (this.overlayed) {
                if (this.opened.length) {
                    this.overlay.nativeElement.classList.add("visible")
                } else {
                    this.overlay.nativeElement.classList.remove("visible")
                }
            }
        }
    }
}
