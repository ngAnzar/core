import { Component, ContentChild, TemplateRef, Inject, Input, OnDestroy } from "@angular/core"

import { Destruct } from "../../util"
import { DataSourceDirective, Model, SelectionItems, ISelectable, SelectOrigin } from "../../data.module"
import { Margin, MarginParsed, parseMargin } from "../../layout.module"


export interface RowTplContext<T> {
    $implicit: T
}


@Component({
    selector: ".nz-exlist",
    templateUrl: "./exlist.template.pug"
})
export class ExlistComponent<T extends Model = Model> implements OnDestroy {
    public readonly destruct = new Destruct()

    @ContentChild("item", { read: TemplateRef }) public readonly tplItem: TemplateRef<RowTplContext<T>>
    @ContentChild("exHeader", { read: TemplateRef }) public readonly tplExHeader: TemplateRef<RowTplContext<T>>
    @ContentChild("exContent", { read: TemplateRef }) public readonly tplExContent: TemplateRef<RowTplContext<T>>
    @ContentChild("exFooter", { read: TemplateRef }) public readonly tplExFooter: TemplateRef<RowTplContext<T>>

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
        @Inject(DataSourceDirective) public readonly source: DataSourceDirective) {
    }

    public setOpened(model: any, origin: SelectOrigin) {
        this.opened.set([model], origin)
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
