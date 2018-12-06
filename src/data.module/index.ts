import { NgModule } from "@angular/core"
import { HttpClientModule } from "@angular/common/http"


export { Collection, Items } from "./collection"
export { DataSource, Filter, Sorter, LoadFields, LoadFieldsArg } from "./data-source"
export { DataStorage } from "./data-storage"
export { Model, ModelProxy, ModelClass, ModelFactory, Field, IDField, MODEL_ID, ID, MODEL_EQ } from "./model"
export { StaticSource } from "./static-source"


import { SingleSelection, MultiSelection, PropagateSelection } from "./selection/selection.directive"
import { SelectableDirective } from "./selection/selectable.directive"
export { SelectionModel, ISelectionModel, SelectionEvent, ISelectable, SelectOrigin } from "./selection/abstract"
export { SingleSelection, MultiSelection, PropagateSelection, SelectableDirective }


export {
    RpcTransport, RpcError, RpcAction, RpcFailureCallback, RpcSuccessCallback,
    Transaction, TransactionsDict, TransactionFactory, RPC_ENDPOINT, RPC_BATCHING
} from "./rpc/rpc-transport"
export { RpcGroup, RpcMethod, RpcDataSource, IRpcDataSource } from "./rpc/rpc-source"
export { ExtjsTransport, ExtjsListItemsParam, ExtjsDataSource } from "./rpc/extjs"

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
