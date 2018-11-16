import { NgModule } from "@angular/core"


export { Collection, Items } from "./collection"
export { DataSource, Filter, Sorter, LoadFields, LoadFieldsArg } from "./data-source"
export { DataStorage } from "./data-storage"
export { Model, ModelProxy, ModelClass, ModelFactory, Field, IDField, MODEL_ID, ID, MODEL_EQ } from "./model"
export { StaticSource } from "./static-source"


import { SingleSelection, MultiSelection, PropagateSelection } from "./selection/selection.directive"
import { SelectableDirective } from "./selection/selectable.directive"
export { SelectionModel, ISelectionModel, SelectionEvent, ISelectable } from "./selection/abstract"
export { SingleSelection, MultiSelection, PropagateSelection }


export {
    RpcTransport, RpcError, RpcAction, RpcFailureCallback, RpcSuccessCallback,
    Transaction, TransactionsDict, TransactionFactory
} from "./rpc/rpc-transport"
export { ExtjsTransport, ExtjsListItemsParam, ExtjsDataSource } from "./rpc/extjs"


@NgModule({
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
