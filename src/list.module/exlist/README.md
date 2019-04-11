

```jade

.nz-exlist([dataSource]="...")
   ng-template(#item, let-item)
      div row content template

   ng-template(#exHeader, let-item)
      div header

   ng-template(#exContent, let-item)
      div content

   ng-template(#exFooter, let-item)
      div footer

```
