import {
    Component, ContentChildren, TemplateRef, QueryList, Inject, Input,
    AfterViewInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy
} from "@angular/core"

import { Destruct } from "../../util"
import { AnimateSwitch } from "./stack.animation"


@Component({
    selector: ".nz-stack",
    templateUrl: "./stack.template.pug",
    animations: [AnimateSwitch],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackComponent implements AfterViewInit, OnDestroy {
    @ContentChildren(TemplateRef) protected readonly contentChildren: QueryList<TemplateRef<any>>
    @Input("children") protected readonly vChildren: Array<TemplateRef<any>>

    public get children() {
        return this.vChildren ? this.vChildren : this.contentChildren
    }

    @Input()
    public set selectedIndex(val: number) {
        val = isNaN(val) ? 0 : this.children ? Math.max(0, Math.min(val, this.children.length)) : 0

        if (this._selectedIndex !== val) {
            if (this._viewReady === false) {
                this._pendingIndex = val
                return
            }

            const old = isNaN(this._selectedIndex) ? -1 : this._selectedIndex
            const dir = old > val ? "right" : "left"
            this.childSwitch[old] = `${dir}-out`
            this.childSwitch[val] = `${dir}-in`
            this._selectedIndex = val
            this.cdr.detectChanges()
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    private _selectedIndex: number

    public readonly destruct = new Destruct()
    public readonly childSwitch: string[] = []

    private _pendingIndex: number = 0
    private _viewReady: boolean = false

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterViewInit() {
        this._viewReady = true
        this.selectedIndex = this._pendingIndex
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
