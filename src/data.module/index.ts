import { NgModule } from "@angular/core"
import { HttpClientModule } from "@angular/common/http"


export { Collection, Items } from "./collection"
export { DataSource, Filter, Sorter, LoadFields, Meta } from "./data-source"
export { DataStorage, Diff, DiffKind } from "./data-storage"
export { Model, ModelFields, ModelProxy, ModelClass, ModelFactory, Field, IDField, MODEL_ID, PrimaryKey, MODEL_EQ, decorateModelClass } from "./model"
export { StaticSource } from "./static-source"
export { CombinedSource } from "./combined-source"
export { ObservableSource } from "./observable-source"


import { SingleSelection, MultiSelection, NoneSelection, PropagateSelection } from "./selection/selection.directive"
import { SelectableDirective } from "./selection/selectable.directive"
import { SelectionKeyboardHandler } from "./selection/keyboard-handler"
export { SelectionModel, ISelectionModel, SelectionEvent, ISelectable, SelectOrigin, SelectionItems } from "./selection/abstract"
export { SingleSelection, MultiSelection, NoneSelection, PropagateSelection, SelectableDirective }
export { SelectionKeyboardHandler }


import { DataSourceDirective, FilterDirective, SorterDirective, FieldsDirective } from "./data-source.directive"
export { DataSourceDirective, FilterDirective, SorterDirective, FieldsDirective }


@NgModule({
    imports: [
        HttpClientModule
    ],
    declarations: [
        SingleSelection,
        MultiSelection,
        NoneSelection,
        PropagateSelection,
        SelectableDirective,

        DataSourceDirective,
        FilterDirective,
        SorterDirective,
        FieldsDirective
    ],
    exports: [
        SingleSelection,
        MultiSelection,
        NoneSelection,
        PropagateSelection,
        SelectableDirective,

        DataSourceDirective,
        FilterDirective,
        SorterDirective,
        FieldsDirective
    ]
})
export class NzDataModule { }
