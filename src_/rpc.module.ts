import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"

export { RpcDataSource, RpcGroup, RpcMethod, IRpcDataSource } from "./rpc/rpc-source"
export { RpcTransport } from "./rpc/rpc-transport"
export { ExtjsTransport, ExtjsDataSource, ExtjsListItemsParam } from "./rpc/extjs"


@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
    ],
    declarations: [

    ],
    exports: [
        HttpClientModule
    ]
})
export class RpcModule {

}
