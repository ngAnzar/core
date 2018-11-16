import {
    Component, ContentChildren, QueryList, ElementRef, AfterContentInit, OnDestroy, Input, Inject,
    ChangeDetectorRef, ChangeDetectionStrategy
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { take } from "rxjs/operators"

import { PanelComponent, PanelPosition, PanelOpeningEvent } from "./panel.component"
import { Destruct } from "../../util"


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

    protected _side: { [K in PanelPosition]?: DrawerSide } = {}

    public readonly destruct: Destruct = new Destruct(() => {
        for (const k in this._side) {
            this._side[k as PanelPosition].dispose()
        }
    })

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

    public ngOnDestroy() {
        this.destruct.run()
    }

    public hideOpenedPanel() {
        if (this.autohide) {
            for (const opened of this.opened) {
                opened.opened = false
            }
        }
    }

    protected _watchPanelOpened(panel: PanelComponent) {
        this.destruct.subscription(panel.openedChanging).subscribe(this._handlePanelSwitch)
    }

    protected _handlePanelSwitch = (panelEvent: PanelOpeningEvent) => {
        const position = panelEvent.source.position
        if (position) {
            panelEvent.finalValue = this._side[position]
                .updatePanelState(panelEvent.source, panelEvent.pendigValue)

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
