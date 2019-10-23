import { Component, ContentChild, TemplateRef, Inject, Input, OnDestroy, Optional } from "@angular/core"
import { of } from "rxjs"
import { take } from "rxjs/operators"

import { Destruct } from "../../util"
import { DataSourceDirective, Model, SelectionItems, ISelectable, SelectOrigin } from "../../data.module"
import { Margin, MarginParsed, parseMargin } from "../../layout.module"
import { ExlistSwitchHandler } from "./exlist-switch-handler"


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
    templateUrl: "./exlist.template.pug"
})
export class ExlistComponent<T extends Model = Model> implements OnDestroy {
    public readonly destruct = new Destruct()

    @ContentChild("item", { read: TemplateRef, static: true }) public readonly tplItem: TemplateRef<RowTplContext<T>>
    @ContentChild("exHeader", { read: TemplateRef, static: true }) public readonly tplExHeader: TemplateRef<RowTplContext<T>>
    @ContentChild("exContent", { read: TemplateRef, static: true }) public readonly tplExContent: TemplateRef<RowTplContext<T>>
    @ContentChild("exFooter", { read: TemplateRef, static: true }) public readonly tplExFooter: TemplateRef<RowTplContext<T>>

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

    public constructor(
        @Inject(DataSourceDirective) public readonly source: DataSourceDirective,
        @Inject(ExlistSwitchHandler) @Optional() private readonly switchHandler: ExlistSwitchHandler<T>) {
        if (!this.switchHandler) {
            this.switchHandler = DEFAULT_SWITCH_HANDLER
        }
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
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
