import { NgModule } from "@angular/core"
import { HttpClientModule } from "@angular/common/http"


export { Collection, Items } from "./collection"
export { DataSource, Filter, Sorter, LoadFields, LoadFieldsArg } from "./data-source"
export { DataStorage } from "./data-storage"
export { Model, ModelProxy, ModelClass, ModelFactory, Field, IDField, MODEL_ID, ID, MODEL_EQ } from "./model"
export { StaticSource } from "./static-source"


import { SingleSelection, MultiSelection, PropagateSelection } from "./selection/selection.directive"
import { SelectableDirective } from "./selection/selectable.directive"
export { SelectionModel, ISelectionModel, SelectionEvent, ISelectable } from "./selection/abstract"
export { SingleSelection, MultiSelection, PropagateSelection, SelectableDirective }


export {
    RpcTransport, RpcError, RpcAction, RpcFailureCallback, RpcSuccessCallback,
    Transaction, TransactionsDict, TransactionFactory
} from "./rpc/rpc-transport"
export { RpcGroup, RpcMethod, RpcDataSource, IRpcDataSource } from "./rpc/rpc-source"
export { ExtjsTransport, ExtjsListItemsParam, ExtjsDataSource } from "./rpc/extjs"


@NgModule({
    imports: [
        HttpClientModule
    ],
    declarations: [
        SingleSelection,
        MultiSelection,
        PropagateSelection,
        SelectableDirective
    ],
    exports: [
        SingleSelection,
        MultiSelection,
        PropagateSelection,
        SelectableDirective
    ]
})
export class NzDataModule { }
