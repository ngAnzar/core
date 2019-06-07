import { NgModule } from "@angular/core"
import { HttpClientModule } from "@angular/common/http"


export { Collection, Items } from "./collection"
export { DataSource, Filter, Sorter, Meta } from "./data-source"
export { DataStorage, Diff, DiffKind } from "./data-storage"
export { Model, ModelFields, ModelProxy, ModelClass, ModelFactory, Field, IDField, MODEL_ID, ID, MODEL_EQ } from "./model"
export { StaticSource } from "./static-source"


import { SingleSelection, MultiSelection, PropagateSelection } from "./selection/selection.directive"
import { SelectableDirective } from "./selection/selectable.directive"
import { SelectionKeyboardHandler } from "./selection/keyboard-handler"
export { SelectionModel, ISelectionModel, SelectionEvent, ISelectable, SelectOrigin, SelectionItems } from "./selection/abstract"
export { SingleSelection, MultiSelection, PropagateSelection, SelectableDirective }
export { SelectionKeyboardHandler }


// export {
//     RpcTransport, RpcError, RpcAction, RpcFailureCallback, RpcSuccessCallback,
//     Transaction, TransactionsDict, TransactionFactory, RPC_ENDPOINT, RPC_BATCHING
// } from "./rpc/rpc-transport"
// export { RpcGroup, RpcMethod, RpcDataSource, IRpcDataSource } from "./rpc/rpc-source"
// export { ExtjsTransport, ExtjsListItemsParam, ExtjsDataSource } from "./rpc/extjs"

import { DataSourceDirective, FilterDirective, SorterDirective } from "./data-source.directive"
export { DataSourceDirective, FilterDirective, SorterDirective }


@NgModule({
    imports: [
        HttpClientModule
    ],
    declarations: [
        SingleSelection,
        MultiSelection,
        PropagateSelection,
        SelectableDirective,

        DataSourceDirective,
        FilterDirective,
        SorterDirective
    ],
    exports: [
        SingleSelection,
        MultiSelection,
        PropagateSelection,
        SelectableDirective,

        DataSourceDirective,
        FilterDirective,
        SorterDirective
    ]
})
export class NzDataModule { }
