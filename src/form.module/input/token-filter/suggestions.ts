import { QueryList, TemplateRef } from "@angular/core"
import { Observable } from "rxjs"

import { DataSource, DataSourceDirective, Model, SelectionModel, SingleSelection } from "../../../data.module"
import { LayerRef, LayerService, DropdownLayer } from "../../../layer.module"
import { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_FACTORY, AUTOCOMPLETE_ITEM_TPL } from "../../../list.module"


export class TFSuggestions<T extends Model = Model> {
    public readonly ds: DataSourceDirective<T>
    public readonly selection: SelectionModel<T> = new SingleSelection()

    protected layerRef: LayerRef

    public get isVisible() { return this.layerRef?.isVisible }

    public constructor(
        source: DataSourceDirective<T> | DataSource<T>,
        public readonly layerSvc: LayerService,
        public readonly itemTpl: TemplateRef<any>
    ) {
        if (source instanceof DataSourceDirective) {
            this.ds = source
        } else {
            this.ds = new DataSourceDirective()
            this.ds.dataSource = source
        }
    }

    public show(target: HTMLElement, crop?: HTMLElement, fm?: (el: HTMLElement) => () => void): Observable<T> {
        return new Observable(subscriber => {
            const behavior = new DropdownLayer({
                backdrop: { type: "empty", crop: crop, hideOnClick: true },
                rounded: 3,
                elevation: 10,
                minWidth: 100,
                maxHeight: 48 * 7,
                trapFocus: false,
                position: {
                    align: "left bottom",
                    anchor: {
                        ref: target,
                        align: "left top",
                        margin: "6 0"
                    },
                    constraint: {
                        ref: "viewport",
                        inset: 16
                    }
                }
            })

            const layerRef = this.layerSvc.createFromComponent(AutocompleteComponent, behavior, null, [
                { provide: AUTOCOMPLETE_ACTIONS, useValue: new QueryList() },
                { provide: AUTOCOMPLETE_ITEM_FACTORY, useValue: null },
                { provide: AUTOCOMPLETE_ITEM_TPL, useValue: this.itemTpl },
                { provide: SelectionModel, useValue: this.selection },
                { provide: DataSourceDirective, useValue: this.ds },
            ])
            this.layerRef = layerRef

            layerRef.subscribe(event => {
                if (event.type === "destroy") {
                    subscriber.next(null)
                    subscriber.complete()
                }
            })

            const ss = this.selection.changes.subscribe(selected => {
                subscriber.next(selected[0])
                subscriber.complete()
            })

            layerRef.show()

            const fmd = fm ? fm(layerRef.outlet.nativeElement) : null
            return () => {
                ss?.unsubscribe()
                this.hide()
                this.selection.clear()
                fmd && fmd()
            }
        })
    }

    public hide() {
        if (this.layerRef) {
            this.layerRef.hide()
            this.layerRef = null
        }
    }
}
