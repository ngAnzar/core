import { Component, ContentChild, TemplateRef, Inject, Input, OnDestroy, Optional, ChangeDetectorRef, ChangeDetectionStrategy, OnInit, ViewChild } from "@angular/core"
import { of } from "rxjs"
import { take, startWith } from "rxjs/operators"

import { Destruct, Margin, MarginParsed, parseMargin } from "../../util"
import { DataSourceDirective, Model, SelectionItems, ISelectable, SelectOrigin } from "../../data.module"
import { ExlistSwitchHandler } from "./exlist-switch-handler"
import { VirtualForDirective } from "../virtual-for/virtual-for.directive"
import { ScrollerComponent } from "../scroller/scroller.component"
import { ExlistItemComponent } from "./exlist-item.component"


export interface RowTplContext<T> {
    $implicit: T
}


class DefaultSwitchHandler extends ExlistSwitchHandler<any> {
    public canSwitch(from: any, to: any) {
        return of(true)
    }
}


const DEFAULT_SWITCH_HANDLER = new DefaultSwitchHandler()


@Component({
    selector: ".nz-exlist",
    templateUrl: "./exlist.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExlistComponent<T extends Model = Model> implements OnDestroy, OnInit {
    public readonly destruct = new Destruct()

    @ContentChild("item", { read: TemplateRef, static: true }) public readonly tplItem: TemplateRef<RowTplContext<T>>
    @ContentChild("exHeader", { read: TemplateRef, static: true }) public readonly tplExHeader: TemplateRef<RowTplContext<T>>
    @ContentChild("exContent", { read: TemplateRef, static: true }) public readonly tplExContent: TemplateRef<RowTplContext<T>>
    @ContentChild("exFooter", { read: TemplateRef, static: true }) public readonly tplExFooter: TemplateRef<RowTplContext<T>>

    @ViewChild("virtualList", { read: VirtualForDirective, static: true }) public readonly virtualList: VirtualForDirective<T>
    @ViewChild("scroller", { read: ScrollerComponent, static: true }) public readonly scroller: ScrollerComponent

    @Input()
    public set padding(val: Margin) {
        if (this._padding !== val) {
            this._padding = val
            this._paddingParsed = parseMargin(val)
        }
    }
    public get padding(): Margin { return this._padding }
    private _padding: Margin
    private _paddingParsed: MarginParsed = {} as any

    public get paddingTop(): number { return this._paddingParsed.top }
    public get paddingLeft(): number { return this._paddingParsed.left }
    public get paddingRight(): number { return this._paddingParsed.right }
    public get paddingBottom(): number { return this._paddingParsed.bottom }

    protected _rows: { [key: string]: ISelectable<T> } = {}
    public readonly opened = this.destruct.disposable(new SelectionItems(this._rows))

    @Input()
    public set isBusy(val: boolean) {
        if (this._isBusy !== val) {
            this._isBusy = val
            this.cdr.markForCheck()
        }
    }
    public get isBusy(): boolean { return this._isBusy }
    public _isBusy: boolean = false

    public constructor(
        @Inject(DataSourceDirective) public readonly source: DataSourceDirective,
        @Inject(ExlistSwitchHandler) @Optional() private readonly switchHandler: ExlistSwitchHandler<T>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
        if (!this.switchHandler) {
            this.switchHandler = DEFAULT_SWITCH_HANDLER
        }
    }

    public ngOnInit() {
        if (this.source.async) {
            this.destruct.subscription(this.source.storage.busy)
                .pipe(startWith(this.source.isBusy))
                .subscribe(value => {
                    this.isBusy = value
                })
        }

        this.destruct.subscription(this.opened.changes)
            .subscribe(changes => {
                const opened = changes.length && changes[0] ? changes[0] : null
                if (opened) {
                    this._updateOpenedRowByScroll()
                    this.scrollIntoViewport(opened)
                }
            })

        this.destruct.subscription(this.scroller.service.vpRender.scroll).subscribe(() => {
            this._updateOpenedRowByScroll()
        })
    }

    public setOpened(model: any, origin: SelectOrigin) {
        let from: T = this.opened.get()[0] || null
        let to: T = origin ? model : null

        this.switchHandler.canSwitch(from, to)
            .pipe(take(1))
            .subscribe(val => {
                if (val) {
                    this.opened.set([model], origin)
                }
            })
    }

    public scrollIntoViewport(model: T) {
        this.virtualList.scrollIntoViewport(model)
    }

    public _handleOnDestroy(cmp: ISelectable<T>): void {
        let model = cmp.model
        if (model) {
            delete this._rows[cmp.model.pk]
        }
    }

    public _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void {
        if (oldModel && this._rows[oldModel.pk] === cmp) {
            delete this._rows[oldModel.pk]
        }

        if (newModel) {
            this._rows[newModel.pk] = cmp
        }

        this._updateOpenedRowByScroll()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    private _getOpenedRow(): ExlistItemComponent<T> {
        let opened = this.opened.get()
        return opened && opened.length > 0 ? this._rows[opened[0].pk] as any : null
    }

    private _updateOpenedRowByScroll() {
        let openedRow = this._getOpenedRow()
        openedRow && openedRow._updateByScroll()
    }
}
